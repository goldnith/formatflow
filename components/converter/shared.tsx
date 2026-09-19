"use client";
import { useEffect, useId, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Check, Download, LoaderCircle, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { bytesLabel } from '@/lib/conversions';
import { toast } from 'sonner';

export type ResultFile = {name: string; blob: Blob};
export function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob); const a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
export async function copyText(text: string) {
  try { await navigator.clipboard.writeText(text); toast.success('Copied to clipboard.'); }
  catch { toast.error('Copy is unavailable. Select the text and copy it manually.'); }
}
export function Choice({label,value,onChange,options,disabled=false}: {label:string;value:string;onChange:(v:string)=>void;options:readonly (string|{value:string;label:string})[];disabled?:boolean}) {
  const id=useId();
  return <div className="field"><Label htmlFor={id}>{label}</Label><Select value={value} onValueChange={onChange} disabled={disabled}><SelectTrigger id={id}><SelectValue/></SelectTrigger><SelectContent>{options.map(o=>{const v=typeof o==='string'?o:o.value;return <SelectItem value={v} key={v}>{typeof o==='string'?o:o.label}</SelectItem>})}</SelectContent></Select></div>;
}
export function ErrorNote({error}:{error:string}) {return error?<p className="error-note" role="alert">{error}</p>:null;}
export function Busy({label,progress}:{label:string;progress?:number}) {return <div className="busy-note" role="status"><span><LoaderCircle className="spinning" aria-hidden="true"/>{label}</span>{progress!==undefined&&<Progress value={progress} aria-label={label}/>}</div>;}
export function FilePicker({onFiles,accept,multiple=false,disabled=false,hint,title='Choose a file',maxMB=50}: {onFiles:(files:File[])=>void;accept:string;multiple?:boolean;disabled?:boolean;hint:string;title?:string;maxMB?:number}) {
  const input=useRef<HTMLInputElement>(null); const id=useId(); const [dragging,setDragging]=useState(false);const [error,setError]=useState('');
  const receive=(files:File[])=>{setError('');if(!files.length)return;if(!multiple&&files.length>1){setError('Choose one file at a time.');return;}if(files.some(f=>f.size>maxMB*1024*1024)){setError(`Each file must be ${maxMB} MB or smaller.`);return;}onFiles(files);};
  return <div><div className={`drop-zone ${dragging?'dragging':''}`} onDragOver={e=>{e.preventDefault();if(!disabled)setDragging(true)}} onDragLeave={()=>setDragging(false)} onDrop={e=>{e.preventDefault();setDragging(false);if(!disabled)receive(Array.from(e.dataTransfer.files));}}>
    <Upload className="upload-mark" aria-hidden="true"/><strong>{title}</strong><p id={id}>{hint}</p>
    <input ref={input} type="file" accept={accept} multiple={multiple} hidden disabled={disabled} onChange={e=>{receive(Array.from(e.target.files||[]));e.target.value='';}}/>
    <Button type="button" disabled={disabled} onClick={()=>input.current?.click()} aria-describedby={id}><Upload aria-hidden="true"/>Browse {multiple?'files':'file'}</Button><span className="drop-caption">or drag and drop · up to {maxMB} MB per file</span>
  </div><ErrorNote error={error}/></div>;
}
export function FileQueue({files,onChange,disabled=false,reorder=false}: {files:File[];onChange:(files:File[])=>void;disabled?:boolean;reorder?:boolean}) {
  const move=(index:number,step:number)=>{const next=[...files];[next[index],next[index+step]]=[next[index+step],next[index]];onChange(next)};
  return !!files.length&&<ol className="file-queue" aria-label="Selected files">{files.map((file,i)=><li key={`${file.name}-${i}`}><span className="file-index">{i+1}</span><div className="file-details"><strong>{file.name}</strong><small>{bytesLabel(file.size)}</small></div><div className="file-actions">{reorder&&<><Button size="icon" variant="ghost" aria-label={`Move ${file.name} up`} disabled={disabled||i===0} onClick={()=>move(i,-1)}><ArrowUp/></Button><Button size="icon" variant="ghost" aria-label={`Move ${file.name} down`} disabled={disabled||i===files.length-1} onClick={()=>move(i,1)}><ArrowDown/></Button></>}<Button size="icon" variant="ghost" aria-label={`Remove ${file.name}`} disabled={disabled} onClick={()=>onChange(files.filter((_,n)=>n!==i))}><X/></Button></div></li>)}</ol>;
}
export function Downloads({results}:{results:ResultFile[]}) {
  return !!results.length&&<section className="download-section" aria-label="Converted files"><h3><Check aria-hidden="true"/>Ready to download</h3><ul>{results.map((r,i)=><li key={`${r.name}-${i}`}><div className="file-details"><strong>{r.name}</strong><small>{bytesLabel(r.blob.size)}</small></div><Button variant="outline" onClick={()=>saveBlob(r.blob,r.name)} aria-label={`Download ${r.name}`}><Download aria-hidden="true"/>Download</Button></li>)}</ul></section>;
}
export function useTask() {
  const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [results,setResults]=useState<ResultFile[]>([]);const [status,setStatus]=useState('');
  const alive=useRef(true);useEffect(()=>{alive.current=true;return()=>{alive.current=false}},[]);
  async function run(work:()=>Promise<ResultFile[]>) {if(busy)return;setBusy(true);setError('');setStatus('');setResults([]);try{const output=await work();if(alive.current){setResults(output);setStatus(`${output.length} file${output.length===1?'':'s'} ready to download.`);}}catch(e){if(alive.current)setError(e instanceof Error?e.message:'Conversion failed. Please try another file.');}finally{if(alive.current)setBusy(false);}}
  function reset(){setResults([]);setError('');setStatus('');}
  return {busy,error,results,status,run,reset,setError};
}
export function TaskOutput({task,label='Converting…'}:{task:ReturnType<typeof useTask>;label?:string}) {return <>{task.busy&&<Busy label={label}/>}<ErrorNote error={task.error}/><span className="sr-only" role="status">{task.status}</span><Downloads results={task.results}/></>}
export function joinFiles(old:File[], added:File[], max=20) {
  const all=[...old,...added];if(all.length>max)throw new Error(`Choose up to ${max} files at a time.`);if(all.reduce((s,f)=>s+f.size,0)>100*1024*1024)throw new Error('Keep the combined file size under 100 MB.');return all;
}
