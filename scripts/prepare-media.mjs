import {copyFile,mkdir,readFile,writeFile} from 'node:fs/promises';
const dest=new URL('../public/media/ffmpeg/',import.meta.url);
await mkdir(dest,{recursive:true});
for(const file of ['worker.js','const.js','errors.js'])await copyFile(new URL(`../node_modules/@ffmpeg/ffmpeg/dist/esm/${file}`,import.meta.url),new URL(file,dest));
await copyFile(new URL('../node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.js',import.meta.url),new URL('ffmpeg-core.js',dest));
const wasm=await readFile(new URL('../node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.wasm',import.meta.url));
const size=16*1024*1024;const parts=[];
for(let offset=0;offset<wasm.length;offset+=size){const name=`core-${parts.length}.bin`;await writeFile(new URL(name,dest),wasm.subarray(offset,offset+size));parts.push(name)}
await writeFile(new URL('manifest.json',dest),JSON.stringify({version:'0.12.10',bytes:wasm.length,parts}));
await writeFile(new URL('NOTICE.txt',dest),'FFmpeg WebAssembly core 0.12.10 (GPL-2.0-or-later) and ffmpeg.wasm 0.12.15 (MIT).\nUnmodified upstream distribution, with the WebAssembly binary split into transport parts.\nCore source, build recipes, bundled dependency versions, and license information:\nhttps://github.com/ffmpegwasm/ffmpeg.wasm/tree/main/packages/core\nhttps://github.com/ffmpegwasm/ffmpeg.wasm\nhttps://ffmpeg.org/legal.html\n');
console.log(`Prepared media engine: ${parts.length} local binary parts.`);
