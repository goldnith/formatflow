import assert from 'node:assert/strict';
import test from 'node:test';
import {build} from 'esbuild';
import {mkdir,readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {PDFDocument} from 'pdf-lib';
import JSZip from 'jszip';
import QR from 'qrcode';

await mkdir('.sites-runtime/tests',{recursive:true});
await build({entryPoints:['lib/conversions.ts','lib/media-options.ts'],outdir:'.sites-runtime/tests',bundle:true,platform:'node',format:'esm',packages:'external',outExtension:{'.js':'.mjs'}});
// Match browser resolution, including Vite's optional Node-buffer stub in docx.
await build({entryPoints:['lib/file-tools.ts'],outfile:'.sites-runtime/tests/file-tools.mjs',bundle:true,platform:'browser',format:'esm',plugins:[{name:'optional-node-buffer',setup(b){b.onResolve({filter:/^buffer$/},()=>({path:'buffer',namespace:'optional'}));b.onLoad({filter:/.*/,namespace:'optional'},()=>({contents:'export default {};'}));}}]});
const convert=await import('../.sites-runtime/tests/conversions.mjs');
const files=await import('../.sites-runtime/tests/file-tools.mjs');
const {mediaArgs}=await import('../.sites-runtime/tests/media-options.mjs');

test('CSV preserves quoted commas, embedded newlines, Unicode and later columns',async()=>{
 const data=[{name:'தமிழ், Tamil',notes:'line 1\nline "2"',id:'001'},{name:'Apple',notes:'',extra:'new column'}];
 const csv=await convert.writeData(data,'csv');const restored=await convert.readData(csv,'csv');
 assert.equal(restored[0].name,data[0].name);assert.equal(restored[0].notes,data[0].notes);assert.equal(restored[0].id,'001');assert.equal(restored[1].extra,'new column');
 await assert.rejects(()=>convert.readData('a,a\n1,2','csv'),/unique/);
 await assert.rejects(()=>convert.readData('a,b\n1,2,3','csv'),/cells/);
 await assert.rejects(()=>convert.writeData([1,2,3],'csv'),/array of objects/);
});
test('XML parses attributes and rejects external entities',async()=>{
 assert.deepEqual(await convert.readData('<item id="12">001</item>','xml'),{item:{'#text':'001','@_id':'12'}});
 await assert.rejects(()=>convert.readData('<!DOCTYPE x [<!ENTITY test SYSTEM "file:///tmp/test">]><x>&test;</x>','xml'),/entities/);
 const xml=await convert.writeData({name:'A&B',amount:'002'},'xml');assert.deepEqual(await convert.readData(xml,'xml'),{data:{name:'A&B',amount:'002'}});
 const rows=await convert.writeData([{name:'Mango'},{name:'Apple'}],'xml');assert.deepEqual(await convert.readData(rows,'xml'),{data:{row:[{name:'Mango'},{name:'Apple'}]}});
});
test('Number bases use exact integers and reject partial parses',()=>{
 const n=convert.baseNumber('123456789012345678901234567890',10);assert.equal(n.toString(),'123456789012345678901234567890');
 assert.equal(convert.baseNumber('-ff',16),-255n);assert.throws(()=>convert.baseNumber('102',2));assert.throws(()=>convert.baseNumber('12xyz',10));
});
test('Temperature, length and precise weight conversion',()=>{
 assert.equal(convert.convertUnit(100,'Temperature','Celsius (°C)','Fahrenheit (°F)'),212);
 assert.equal(convert.convertUnit(0,'Temperature','Celsius (°C)','Kelvin (K)'),273.15);
 assert.throws(()=>convert.convertUnit(-1,'Temperature','Kelvin (K)','Celsius (°C)'),/absolute zero/);
 assert.equal(convert.convertUnit(1,'Length','Miles (mi)','Metres (m)'),1609.344);
 assert.equal(convert.convertUnit(1,'Weight','Pounds (lb)','Kilograms (kg)'),.45359237);
});
async function fixture(widths){const doc=await PDFDocument.create();widths.forEach(w=>doc.addPage([w,300]));return new File([await doc.save()],'test.pdf',{type:'application/pdf'})}
test('PDF merge/extract/split/rotate preserve requested page order',async()=>{
 const a=await fixture([111,222]);const b=await fixture([333]);
 const [merged]=await files.processPdf([a,b],'merge','',90);let doc=await PDFDocument.load(await merged.blob.arrayBuffer());assert.deepEqual(doc.getPages().map(p=>p.getWidth()),[111,222,333]);
 const [extracted]=await files.processPdf([a],'extract','2,1',90);doc=await PDFDocument.load(await extracted.blob.arrayBuffer());assert.deepEqual(doc.getPages().map(p=>p.getWidth()),[222,111]);
 const [rotated]=await files.processPdf([a],'rotate','2',90);doc=await PDFDocument.load(await rotated.blob.arrayBuffer());assert.deepEqual(doc.getPages().map(p=>p.getRotation().angle),[0,90]);
 const [split]=await files.processPdf([a],'split','',90);const zip=await JSZip.loadAsync(await split.blob.arrayBuffer());assert.equal(Object.keys(zip.files).length,2);
 const splitPage=await PDFDocument.load(await zip.file('test-page-2.pdf').async('uint8array'));assert.equal(splitPage.getPage(0).getWidth(),222);
 await assert.rejects(()=>files.processPdf([a],'extract','3',90),/between 1 and 2/);
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jBfkAAAAASUVORK5CYII=','base64');
 const [imagePdf]=await files.processPdf([new File([png],'dot.png')],'images','',0);doc=await PDFDocument.load(await imagePdf.blob.arrayBuffer());assert.equal(doc.getPageCount(),1);
});
test('ZIP creation retains duplicate names and extraction rejects oversized expansion',async()=>{
 const blob=await files.createZip([new File(['one'],'notes.txt'),new File(['two'],'notes.txt')]);
 const zip=await files.openZip(new Uint8Array(await blob.arrayBuffer()));assert.equal(await zip.file('notes.txt').async('string'),'one');assert.equal(await zip.file('notes (2).txt').async('string'),'two');
 const bytes=new Uint8Array(await blob.arrayBuffer());const view=new DataView(bytes.buffer);let offset=0;while(view.getUint32(offset,true)!==0x02014b50)offset++;view.setUint32(offset+24,200*1024*1024,true);
 assert.throws(()=>convert.inspectZip(bytes),/128 MB/);assert.throws(()=>convert.inspectZip(new Uint8Array(8)),/supported ZIP/);
});
test('DOCX text export round-trips Tamil, punctuation and paragraphs through the browser bundle',async()=>{
 const source='தமிழ் வணக்கம்\nText & <tags> "quotes"\nSecond paragraph';
 const doc=await files.exportDocument(source,'docx','Test');const result=await files.documentText(new File([doc],'test.docx'));
 for(const line of source.split('\n'))assert.ok(result.includes(line),line);
 const html=await files.exportDocument(source,'html','Test <title>');assert.ok((await html.text()).includes('&lt;tags&gt;'));assert.ok(!(await html.text()).includes('<tags>'));
});
test('QR payload encodes Wi-Fi escaping and generates vector and PNG outputs',async()=>{
 const payload=convert.qrPayload('wifi','','Shop;wifi','a:b\\c','WPA');assert.equal(payload,'WIFI:T:WPA;S:Shop\\;wifi;P:a\\:b\\\\c;;');
 const svg=await QR.toString('https://example.com',{type:'svg',margin:4});assert.match(svg,/<svg/);assert.match(svg,/<path/);
 const png=await QR.toBuffer('https://example.com',{width:512});assert.equal(png.subarray(1,4).toString(),'PNG');
});
test('Every advertised media output is produced by the actual single-thread WASM engine',async()=>{
 globalThis.self=globalThis;globalThis.location={href:'http://localhost/ffmpeg-core.js'};
 const require=createRequire(import.meta.url);const createCore=require('@ffmpeg/core');
 const wasm=await readFile(require.resolve('@ffmpeg/core/wasm'));let core=await createCore({wasmBinary:wasm});const logs=[];core.setLogger(({message})=>logs.push(message));
 core.exec('-f','lavfi','-i','testsrc=size=32x32:rate=2','-f','lavfi','-i','sine=frequency=440:sample_rate=8000','-t','1','-c:v','libx264','-pix_fmt','yuv420p','-c:a','aac','fixture.mp4');assert.equal(core.ret,0,logs.slice(-8).join('\n'));core.reset();const fixtureBytes=core.FS.readFile('fixture.mp4');
 for(const format of ['mp4','webm','mp3','wav','m4a','flac','gif']){core=await createCore({wasmBinary:wasm});core.setLogger(({message})=>logs.push(message));core.FS.writeFile('fixture.mp4',fixtureBytes);logs.length=0;try{core.exec(...mediaArgs('fixture.mp4',format,0,null))}catch(e){throw new Error(format+': '+e.message+'\n'+logs.slice(-12).join('\n'))}assert.equal(core.ret,0,`${format}: ${logs.slice(-8).join('\n')}`);assert.ok(core.FS.readFile(`output.${format}`).length>16,format);core.reset();}
 assert.throws(()=>mediaArgs('file.mp4','mp4',-2,null),/Start/);
});
