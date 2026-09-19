"use client";
import { useEffect, useRef, useState } from 'react';
import type { FFmpeg } from '@ffmpeg/ffmpeg';
import { Music2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Choice, FilePicker, FileQueue, TaskOutput, useTask } from './shared';
import { binaryBlob } from '@/lib/file-tools';
import { extension, fileStem } from '@/lib/conversions';
import { mediaArgs, mediaFormats, mediaMime } from '@/lib/media-options';

export default function MediaPanel(){const [files,setFiles]=useState<File[]>([]);const [format,setFormat]=useState('mp4');const [start,setStart]=useState('0');const [duration,setDuration]=useState('');const [phase,setPhase]=useState('');const engine=useRef<FFmpeg|null>(null);const abort=useRef<AbortController|null>(null);const task=useTask();
  useEffect(()=>()=>{abort.current?.abort();engine.current?.terminate()},[]);
  const receive=(added:File[])=>{task.reset();if(!/\.(mp4|mov|mkv|webm|avi|mpeg|mpg|m4v|mp3|wav|m4a|aac|ogg|flac|opus|gif)$/i.test(added[0].name)){task.setError('Choose a supported audio or video file.');return;}setFiles(added);if(/\.(mp3|wav|m4a|aac|ogg|flac|opus)$/i.test(added[0].name))setFormat('mp3')};
  const convert=()=>task.run(async()=>{
    if(typeof WebAssembly==='undefined'||typeof Worker==='undefined')throw new Error('Media conversion needs a browser with WebAssembly and Web Workers. Try a recent Chrome, Edge, Firefox or Safari.');
    const input=`input.${extension(files[0].name)}`;const args=mediaArgs(input,format,Number(start),duration.trim()?Number(duration):null);
    const controller=new AbortController();abort.current=controller;let wasmUrl='';let timer:ReturnType<typeof setTimeout>|undefined;
    try{
      setPhase('Loading media engine (about 31 MB on first use)…');
      const {FFmpeg}=await import('@ffmpeg/ffmpeg');if(controller.signal.aborted)throw new Error('Conversion cancelled.');
      const ff=new FFmpeg();engine.current=ff;
      const load=async()=>{const response=await fetch('/media/ffmpeg/manifest.json',{signal:controller.signal});if(!response.ok)throw new Error('The media engine could not download. Check your connection and try again.');const manifest=await response.json();const parts:Blob[]=[];for(const part of manifest.parts){const file=await fetch(`/media/ffmpeg/${part}`,{signal:controller.signal});if(!file.ok)throw new Error('The media engine download was interrupted. Try again.');parts.push(await file.blob())}const wasm=new Blob(parts,{type:'application/wasm'});if(wasm.size!==manifest.bytes)throw new Error('The media engine download was incomplete.');wasmUrl=URL.createObjectURL(wasm);await ff.load({classWorkerURL:new URL('/media/ffmpeg/worker.js',window.location.origin).href,coreURL:new URL('/media/ffmpeg/ffmpeg-core.js',window.location.origin).href,wasmURL:wasmUrl},{signal:controller.signal})};
      const timeout=new Promise<never>((_,reject)=>{timer=setTimeout(()=>{controller.abort();ff.terminate();reject(new Error('The media engine took too long to load. Check your connection and try again.'))},120000)});
      await Promise.race([load(),timeout]);clearTimeout(timer);
      if(controller.signal.aborted)throw new Error('Conversion cancelled.');
      setPhase('Converting on your device… You can cancel at any time.');await ff.writeFile(input,new Uint8Array(await files[0].arrayBuffer()));
      const code=await ff.exec(args,300000,{signal:controller.signal});
      if(code!==0)throw new Error('This file could not be converted within five minutes. Try a shorter clip. Audio export needs an audio track; video export needs a video track.');
      const bytes=await ff.readFile(`output.${format}`);if(typeof bytes==='string'||bytes.byteLength<16)throw new Error('No media was produced. Check the start time and duration.');
      return [{name:`${fileStem(files[0].name)}.${format}`,blob:binaryBlob(bytes,mediaMime[format])}];
    }catch(e){if(controller.signal.aborted)throw new Error('Conversion stopped. You can try again with a smaller file or shorter clip.');throw e instanceof Error?e:new Error('Media conversion failed. Try a smaller file or another format.');}
    finally{clearTimeout(timer);engine.current?.terminate();engine.current=null;abort.current=null;if(wasmUrl)URL.revokeObjectURL(wasmUrl);setPhase('')}
  });
  return <Card className="panel"><p className="help-note">Best for short clips up to 60 MB. The media engine downloads only when you convert. Video exports fit within 1280 × 720; GIFs are limited to 10 seconds. Large files may exceed your device’s memory.</p><FilePicker title="Convert audio or video" hint="MP4, MOV, MKV, WebM, AVI, MP3, WAV, M4A, AAC, OGG, FLAC and more" accept=".mp4,.mov,.mkv,.webm,.avi,.mpeg,.mpg,.m4v,.mp3,.wav,.m4a,.aac,.ogg,.flac,.opus,.gif" disabled={task.busy} maxMB={60} onFiles={receive}/><FileQueue files={files} disabled={task.busy} onChange={f=>{setFiles(f);task.reset()}}/><div className="controls-grid"><Choice label="Output format" value={format} onChange={v=>{setFormat(v);task.reset()}} disabled={task.busy} options={mediaFormats}/><div className="field"><Label htmlFor="media-start">Start time (seconds)</Label><Input id="media-start" type="number" min={0} step="any" value={start} disabled={task.busy} onChange={e=>{setStart(e.target.value);task.reset()}}/></div><div className="field"><Label htmlFor="media-duration">Duration (optional, seconds)</Label><Input id="media-duration" type="number" min={.01} step="any" value={duration} placeholder="Until the end" disabled={task.busy} onChange={e=>{setDuration(e.target.value);task.reset()}}/></div></div><div className="action-row"><p className="help-note">Choose an audio format to extract a video’s soundtrack.</p>{task.busy?<Button variant="outline" onClick={()=>{abort.current?.abort();engine.current?.terminate()}}>Cancel conversion</Button>:<Button disabled={!files.length} onClick={convert}><Music2/>Convert media</Button>}</div><TaskOutput task={task} label={phase||'Preparing media…'}/></Card>;
}
