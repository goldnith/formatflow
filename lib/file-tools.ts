import { fileStem, inspectZip, pageSelection, uniqueName } from './conversions';

export function binaryBlob(bytes: Uint8Array, type='application/octet-stream') {return new Blob([new Uint8Array(bytes)], {type});}
export async function processPdf(files: File[], operation: string, pages: string, angle: number) {
  const {PDFDocument,degrees}=await import('pdf-lib');
  if(!files.length)throw new Error('Choose your files first.');
  const output=await PDFDocument.create();
  if(operation==='images') {
    for(const file of files) {
      const bytes=new Uint8Array(await file.arrayBuffer());
      const image=bytes[0]===0xff&&bytes[1]===0xd8?await output.embedJpg(bytes):await output.embedPng(bytes);
      const landscape=image.width>image.height;
      const w=landscape?842:595,h=landscape?595:842;
      const page=output.addPage([w,h]);const scale=Math.min((w-48)/image.width,(h-48)/image.height);
      page.drawImage(image,{x:(w-image.width*scale)/2,y:(h-image.height*scale)/2,width:image.width*scale,height:image.height*scale});
    }
    return [{name:'images.pdf',blob:binaryBlob(await output.save(),'application/pdf')}];
  }
  const sources=[];
  for(const file of files) {
    try {sources.push(await PDFDocument.load(await file.arrayBuffer()));}
    catch {throw new Error(`Cannot open ${file.name}. Use a valid PDF without password protection.`);}
  }
  if(sources.reduce((n,p)=>n+p.getPageCount(),0)>500)throw new Error('Choose PDFs with no more than 500 pages combined.');
  if(operation==='merge') {
    if(files.length<2)throw new Error('Add at least two PDFs to merge.');
    for(const source of sources)for(const page of await output.copyPages(source,source.getPageIndices()))output.addPage(page);
  } else if(operation==='extract') {
    for(const page of await output.copyPages(sources[0],pageSelection(pages,sources[0].getPageCount())))output.addPage(page);
  } else if(operation==='rotate') {
    const selected=new Set(pageSelection(pages,sources[0].getPageCount()));
    const copied=await output.copyPages(sources[0],sources[0].getPageIndices());
    copied.forEach((page,index)=>{if(selected.has(index))page.setRotation(degrees((page.getRotation().angle+angle)%360));output.addPage(page)});
  } else if(operation==='split') {
    const selected=pageSelection(pages,sources[0].getPageCount());
    if(selected.length>100)throw new Error('Split up to 100 pages at a time. Use the page range to select fewer.');
    const JSZip=(await import('jszip')).default;const zip=new JSZip();
    for(const index of selected){const single=await PDFDocument.create();const [page]=await single.copyPages(sources[0],[index]);single.addPage(page);zip.file(`${fileStem(files[0].name)}-page-${index+1}.pdf`,await single.save());}
    return [{name:`${fileStem(files[0].name)}-pages.zip`,blob:binaryBlob(await zip.generateAsync({type:'uint8array',compression:'DEFLATE'}),'application/zip')}];
  } else throw new Error('Choose a PDF operation.');
  return [{name:operation==='merge'?'merged.pdf':`${fileStem(files[0].name)}-${operation}.pdf`,blob:binaryBlob(await output.save(),'application/pdf')}];
}
export async function createZip(files:File[]) {
  const JSZip=(await import('jszip')).default;const zip=new JSZip();const used=new Set<string>();
  for(const file of files)zip.file(uniqueName(file.name,used),await file.arrayBuffer());
  return binaryBlob(await zip.generateAsync({type:'uint8array',compression:'DEFLATE',compressionOptions:{level:6}}),'application/zip');
}
export async function openZip(bytes:Uint8Array) {
  inspectZip(bytes);const JSZip=(await import('jszip')).default;
  return JSZip.loadAsync(bytes);
}
export async function documentText(file:File) {
  if(file.name.toLowerCase().endsWith('.docx')){
    const mammoth=await import('mammoth');const result=await mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()});return result.value;
  }
  const source=await file.text();
  if(/\.html?$/i.test(file.name)) {
    const doc=new DOMParser().parseFromString(source,'text/html');
    doc.querySelectorAll('script,style,iframe,object,template').forEach(n=>n.remove());
    doc.querySelectorAll('br').forEach(n=>n.replaceWith('\n'));
    doc.querySelectorAll('p,div,h1,h2,h3,h4,h5,h6,li,tr,section').forEach(n=>n.append('\n'));
    return (doc.body.textContent||'').replace(/\n{3,}/g,'\n\n').trim();
  }
  return source;
}
export async function exportDocument(text:string,format:string,title:string) {
  if(!text.trim())throw new Error('The document has no readable text. Scans and images need OCR, which is not included.');
  if(format==='docx') {
    const {Document,Packer,Paragraph}=await import('docx');
    return Packer.toBlob(new Document({sections:[{children:text.split(/\r?\n/).map(line=>new Paragraph({text:line}))}]}));
  }
  if(format==='html') {
    const escape=(s:string)=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
    return new Blob([`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title></head><body><main style="max-width:70ch;margin:3rem auto;padding:1rem;font:1rem/1.6 system-ui;white-space:pre-wrap">${escape(text)}</main></body></html>`],{type:'text/html;charset=utf-8'});
  }
  return new Blob([text],{type:'text/plain;charset=utf-8'});
}
