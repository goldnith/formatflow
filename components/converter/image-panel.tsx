"use client";
import { useState } from 'react';
import { WandSparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Choice, FilePicker, FileQueue, joinFiles, TaskOutput, useTask, type ResultFile } from './shared';
import { fileStem, uniqueName } from '@/lib/conversions';
import { createZip } from '@/lib/file-tools';

async function decode(file:File):Promise<{source:CanvasImageSource;width:number;height:number;close:()=>void}> {
  if(typeof createImageBitmap==='function')try{const b=await createImageBitmap(file);return{source:b,width:b.width,height:b.height,close:()=>b.close()}}catch{}
  const url=URL.createObjectURL(file);const image=new Image();
  try{await new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=()=>reject(new Error(`Your browser cannot read ${file.name}. Try a JPG or PNG image.`));image.src=url});return {source:image,width:image.naturalWidth,height:image.naturalHeight,close:()=>URL.revokeObjectURL(url)}}catch(e){URL.revokeObjectURL(url);throw e}
}
export default function ImagePanel() {
  const [files,setFiles]=useState<File[]>([]);const [format,setFormat]=useState('webp');const [quality,setQuality]=useState(82);const [width,setWidth]=useState('1920');const [angle,setAngle]=useState('0');const task=useTask();
  const changeFiles=(f:File[])=>{setFiles(f);task.reset()};
  const receive=(added:File[])=>{task.reset();try{if(added.some(f=>!(/\.(jpe?g|png|webp|gif|bmp|avif|svg)$/i).test(f.name)))throw new Error('Choose JPG, PNG, WebP, GIF, BMP, AVIF or SVG images.');changeFiles(joinFiles(files,added))}catch(e){task.setError((e as Error).message)}};
  const convert=()=>task.run(async()=>{
    const limit=width.trim()?Number(width):0;if(width.trim()&&(!Number.isInteger(limit)||limit<1||limit>8192))throw new Error('Maximum width must be a whole number between 1 and 8,192.');
    if(format!=='png'&&(!Number.isFinite(quality)||quality<10||quality>100))throw new Error('Quality must be between 10 and 100.');
    const results:ResultFile[]=[];const used=new Set<string>();
    for(const file of files){const image=await decode(file);try{
      if(image.width*image.height>40000000)throw new Error(`${file.name} exceeds the 40 megapixel limit. Choose a smaller image.`);
      const rotated=Number(angle)%180!==0;const sourceW=rotated?image.height:image.width,sourceH=rotated?image.width:image.height;
      const scale=limit?Math.min(1,limit/sourceW):1;const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(sourceW*scale));canvas.height=Math.max(1,Math.round(sourceH*scale));
      const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Image conversion is not supported by this browser.');
      if(format==='jpg'){ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height)}
      ctx.translate(canvas.width/2,canvas.height/2);ctx.rotate(Number(angle)*Math.PI/180);ctx.drawImage(image.source,-image.width*scale/2,-image.height*scale/2,image.width*scale,image.height*scale);
      const type=`image/${format==='jpg'?'jpeg':format}`;const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Image conversion failed. Try a smaller size.')),type,quality/100));
      if(blob.type!==type)throw new Error(`${format.toUpperCase()} export is unavailable in this browser. Choose PNG or JPG.`);
      results.push({name:uniqueName(`${fileStem(file.name)}.${format}`,used),blob});canvas.width=canvas.height=1;
    }finally{image.close()}}
    if(results.length>1)results.unshift({name:'converted-images.zip',blob:await createZip(results.map(r=>new File([r.blob],r.name,{type:r.blob.type})))});
    return results;
  });
  return <div className="image-layout"><Card className="panel"><FilePicker title="Convert your images" hint="JPG, PNG, WebP, GIF, BMP, AVIF or SVG · up to 20 files" accept=".jpg,.jpeg,.png,.webp,.gif,.bmp,.avif,.svg" multiple maxMB={40} disabled={task.busy} onFiles={receive}/><FileQueue files={files} onChange={changeFiles} disabled={task.busy}/><p className="help-note">GIF and animated images export as a still image. Supported input formats depend on your browser.</p></Card>
    <Card className="panel settings-panel"><h2>Output settings</h2><Choice label="Convert to" value={format} onChange={v=>{setFormat(v);task.reset()}} disabled={task.busy} options={[{value:'webp',label:'WebP — smaller file sizes'},{value:'jpg',label:'JPG — photos'},{value:'png',label:'PNG — transparency'}]}/><div className="field"><Label htmlFor="image-width">Maximum width in pixels</Label><Input id="image-width" type="number" min={1} max={8192} value={width} onChange={e=>{setWidth(e.target.value);task.reset()}} disabled={task.busy} placeholder="Keep original size" aria-describedby="width-help"/><small id="width-help">Proportions stay the same. Leave empty to keep the original size.</small></div><Choice label="Rotate clockwise" value={angle} onChange={v=>{setAngle(v);task.reset()}} disabled={task.busy} options={['0','90','180','270'].map(v=>({value:v,label:v==='0'?'No rotation':`${v}°`}))}/><div className="field"><div className="label-row"><Label htmlFor="image-quality">Quality (10–100%)</Label><span>{format==='png'?'Lossless':`${quality}%`}</span></div><Input id="image-quality" type="number" min={10} max={100} value={quality} disabled={task.busy||format==='png'} onChange={e=>{setQuality(Number(e.target.value));task.reset()}}/><small>{format==='jpg'?'Transparent areas become white.':'PNG and WebP preserve transparency.'}</small></div><Button disabled={task.busy||!files.length} onClick={convert}><WandSparkles/>Convert {files.length||''} image{files.length===1?'':'s'}</Button></Card>
    <div className="full-span"><TaskOutput task={task} label="Converting images…"/></div></div>;
}
