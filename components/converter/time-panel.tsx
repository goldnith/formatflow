"use client";
import { useMemo, useState } from "react";
import { Clock3, Copy, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Choice, copyText, ErrorNote } from "./shared";
import { dateFormats, parseDateValue, type DateInputMode } from "@/lib/developer-tools";

const modeOptions = [
  { value: "iso", label: "Date or ISO 8601" },
  { value: "seconds", label: "Unix timestamp (seconds)" },
  { value: "milliseconds", label: "Unix timestamp (milliseconds)" },
];

export default function TimePanel() {
  const [mode, setMode] = useState<DateInputMode>("iso");
  const [value, setValue] = useState(() => new Date().toISOString());
  const result = useMemo(() => {
    try { return { values: dateFormats(parseDateValue(value, mode)), error: "" }; }
    catch (error) { return { values: null, error: (error as Error).message }; }
  }, [mode, value]);
  const setNow = () => { setMode("iso"); setValue(new Date().toISOString()); };
  const rows = result.values ? [
    ["ISO 8601", result.values.iso],
    ["UTC", result.values.utc],
    ["Your local time", result.values.local],
    ["Unix seconds", result.values.seconds],
    ["Unix milliseconds", result.values.milliseconds],
  ] : [];
  return <Card className="panel">
    <h2><Clock3 aria-hidden="true"/>Date and timestamp converter</h2>
    <p className="help-note">Convert a readable date, ISO value or Unix timestamp into the most common date formats.</p>
    <div className="controls-grid">
      <Choice label="Input format" value={mode} onChange={value=>setMode(value as DateInputMode)} options={modeOptions}/>
      <div className="field"><Label htmlFor="time-value">Date or timestamp</Label><Input id="time-value" value={value} onChange={event=>setValue(event.target.value)} spellCheck={false}/></div>
    </div>
    <div className="action-row"><span className="help-note">Dates without a timezone use your device timezone.</span><Button variant="outline" onClick={setNow}><RotateCcw/>Use current time</Button></div>
    <ErrorNote error={result.error}/>
    {!!rows.length&&<dl className="time-results">{rows.map(([label,text])=><div key={label}><dt>{label}</dt><dd><code>{text}</code><Button size="icon" variant="ghost" aria-label={`Copy ${label}`} onClick={()=>copyText(text)}><Copy/></Button></dd></div>)}</dl>}
  </Card>;
}
