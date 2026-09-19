export const mediaFormats=[{value:'mp4',label:'MP4 video (H.264)'},{value:'webm',label:'WebM video (VP8)'},{value:'mp3',label:'MP3 audio'},{value:'wav',label:'WAV audio'},{value:'m4a',label:'M4A audio (AAC)'},{value:'flac',label:'FLAC audio'},{value:'gif',label:'Animated GIF (up to 10 seconds)'}];
export const mediaMime:Record<string,string>={mp4:'video/mp4',webm:'video/webm',mp3:'audio/mpeg',wav:'audio/wav',m4a:'audio/mp4',flac:'audio/flac',gif:'image/gif'};
export function mediaArgs(input:string,format:string,start:number,duration:number|null) {
  if(!Number.isFinite(start)||start<0)throw new Error('Start time must be zero or a positive number.');
  if(duration!==null&&(!Number.isFinite(duration)||duration<=0))throw new Error('Duration must be a positive number, or leave it empty.');
  if(!mediaMime[format])throw new Error('Choose a supported output format.');
  const args=['-i',input];if(start>0)args.push('-ss',String(start));
  if(format==='gif')args.push('-t',String(Math.min(duration??10,10)));else if(duration!==null)args.push('-t',String(duration));
  const scale='scale=w=min(1280\\,iw):h=min(720\\,ih):force_original_aspect_ratio=decrease:force_divisible_by=2';
  if(format==='mp4')args.push('-map','0:v:0','-map','0:a:0?','-vf',scale,'-c:v','libx264','-preset','ultrafast','-crf','25','-pix_fmt','yuv420p','-c:a','aac','-movflags','+faststart');
  else if(format==='webm')args.push('-map','0:v:0','-map','0:a:0?','-vf',scale,'-c:v','libvpx','-threads','1','-deadline','realtime','-cpu-used','8','-crf','10','-b:v','1M','-c:a','libopus','-ar','48000');
  else if(format==='gif')args.push('-map','0:v:0','-an','-vf','fps=12,scale=480:-1:flags=lanczos','-loop','0');
  else{args.push('-map','0:a:0','-vn');if(format==='mp3')args.push('-c:a','libmp3lame','-b:a','192k');if(format==='wav')args.push('-c:a','pcm_s16le');if(format==='m4a')args.push('-c:a','aac','-b:a','192k');if(format==='flac')args.push('-c:a','flac');}
  return [...args,`output.${format}`];
}
