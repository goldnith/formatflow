"use client";
import { useState } from "react";
import { Copy, Fingerprint, KeyRound, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { copyText, ErrorNote } from "./shared";
import { generatePassword } from "@/lib/developer-tools";

function randomIndex(max:number){const ceiling=Math.floor(0x100000000/max)*max;const values=new Uint32Array(1);do{crypto.getRandomValues(values)}while(values[0]>=ceiling);return values[0]%max}

export default function DeveloperPanel(){
  return <div className="utility-grid"><PasswordTool/><UuidTool/><HashTool/></div>;
}

function PasswordTool(){
  const [length,setLength]=useState(18);const [symbols,setSymbols]=useState(true);const [password,setPassword]=useState(()=>generatePassword(18,true,randomIndex));let error="";if(length<8||length>128)error="Choose a length from 8 to 128.";
  const create=()=>{if(!error)setPassword(generatePassword(length,symbols,randomIndex))};
  return <Card className="panel"><h2><KeyRound aria-hidden="true"/>Secure password generator</h2><div className="field"><Label htmlFor="password-length">Password length</Label><Input id="password-length" type="number" min={8} max={128} value={length} onChange={event=>setLength(Number(event.target.value))}/></div><label className="check-row"><Checkbox checked={symbols} onCheckedChange={value=>setSymbols(value===true)}/><span>Include symbols</span></label><ErrorNote error={error}/><div className="field"><Label htmlFor="generated-password">Generated password</Label><Input id="generated-password" value={password} readOnly/></div><div className="action-row"><Button variant="outline" onClick={create} disabled={!!error}><RefreshCw/>Generate</Button><Button onClick={()=>copyText(password)}><Copy/>Copy password</Button></div></Card>
}

function UuidTool(){
  const [uuid,setUuid]=useState(()=>crypto.randomUUID());const create=()=>setUuid(crypto.randomUUID());
  return <Card className="panel"><h2><Fingerprint aria-hidden="true"/>UUID generator</h2><p className="help-note">Create a random RFC 4122 version 4 identifier using your browser’s secure random generator.</p><div className="field"><Label htmlFor="generated-uuid">UUID v4</Label><Input id="generated-uuid" value={uuid} readOnly/></div><div className="action-row"><Button variant="outline" onClick={create}><RefreshCw/>Generate new</Button><Button onClick={()=>copyText(uuid)}><Copy/>Copy UUID</Button></div></Card>
}

function HashTool(){
  const [input,setInput]=useState("");const [hash,setHash]=useState("");const [busy,setBusy]=useState(false);
  const calculate=async()=>{setBusy(true);try{const bytes=new TextEncoder().encode(input);const digest=await crypto.subtle.digest("SHA-256",bytes);setHash(Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,"0")).join(""))}finally{setBusy(false)}};
  return <Card className="panel full-span"><h2>SHA-256 text fingerprint</h2><p className="help-note">Create a consistent fingerprint for text. The original text cannot be recovered from the hash.</p><div className="field"><Label htmlFor="hash-text">Text</Label><Textarea id="hash-text" value={input} onChange={event=>{setInput(event.target.value);setHash("")}} placeholder="Enter text to hash…"/></div>{hash&&<div className="field"><Label htmlFor="text-hash">SHA-256</Label><Textarea id="text-hash" className="hash-output" value={hash} readOnly rows={2}/></div>}<div className="action-row"><span className="help-note">{input.length.toLocaleString()} characters</span><div>{hash&&<Button variant="outline" onClick={()=>copyText(hash)}><Copy/>Copy hash</Button>}<Button disabled={!input||busy} onClick={calculate}>{busy?"Calculating…":"Generate fingerprint"}</Button></div></div></Card>
}
