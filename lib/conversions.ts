export type DataFormat = 'json' | 'csv' | 'tsv' | 'xml';

export const fileStem = (name: string) => name.replace(/\.[^.]+$/, '') || 'converted';
export const extension = (name: string) => name.split('.').pop()?.toLowerCase() || '';
export function bytesLabel(value: number) {
  if (!value) return '0 B';
  const level = Math.min(3, Math.floor(Math.log(value) / Math.log(1024)));
  return `${(value / 1024 ** level).toFixed(level ? 1 : 0)} ${['B','KB','MB','GB'][level]}`;
}
export function uniqueName(name: string, used: Set<string>) {
  const safe = name.replaceAll('\\', '/').split('/').pop()?.replace(/[\u0000-\u001f]/g, '') || 'file';
  let result = safe; let i = 2;
  while (used.has(result)) {
    const dot = safe.lastIndexOf('.');
    result = dot > 0 ? `${safe.slice(0, dot)} (${i++})${safe.slice(dot)}` : `${safe} (${i++})`;
  }
  used.add(result); return result;
}
export function pageSelection(value: string, count: number) {
  if (!value.trim()) return Array.from({length: count}, (_, i) => i);
  const pages = new Set<number>();
  for (const term of value.split(',')) {
    if (!/^\s*\d+(\s*-\s*\d+)?\s*$/.test(term)) throw new Error('Use page numbers like 1, 3-5.');
    const [start, end = start] = term.split('-').map(Number);
    if (start < 1 || end > count || end < start) throw new Error(`Choose pages between 1 and ${count}, with ranges in ascending order.`);
    for (let page = start; page <= end; page++) pages.add(page - 1);
  }
  return [...pages];
}
export async function readData(input: string, format: DataFormat): Promise<unknown> {
  if (!input.trim()) throw new Error('Add some data first.');
  if (format === 'json') {
    try { return JSON.parse(input); } catch { throw new Error('Invalid JSON. Check quotation marks, brackets and commas.'); }
  }
  if (format === 'xml') {
    const { XMLParser, XMLValidator } = await import('fast-xml-parser');
    if (/<!DOCTYPE|<!ENTITY/i.test(input)) throw new Error('XML declarations containing DTDs or entities are not supported.');
    const valid = XMLValidator.validate(input);
    if (valid !== true) throw new Error(`Invalid XML: ${valid.err.msg}`);
    return new XMLParser({ignoreAttributes: false, parseTagValue: false, parseAttributeValue: false}).parse(input);
  }
  const Papa = (await import('papaparse')).default;
  const parsed = Papa.parse<string[]>(input, {delimiter: format === 'csv' ? ',' : '\t', skipEmptyLines: 'greedy'});
  if (parsed.errors.length) throw new Error(`Invalid ${format.toUpperCase()}: ${parsed.errors[0].message}`);
  const [headers, ...rows] = parsed.data;
  if (!headers?.length || headers.some(x => !x.trim()) || new Set(headers).size !== headers.length) throw new Error('Every column needs a unique, nonempty header.');
  return rows.map((row, index) => {
    if (row.length !== headers.length) throw new Error(`Row ${index + 2} has ${row.length} cells; expected ${headers.length}.`);
    return Object.fromEntries(headers.map((header, i) => [header, row[i]]));
  });
}
export async function writeData(data: unknown, format: DataFormat): Promise<string> {
  if (format === 'json') return JSON.stringify(data, null, 2);
  if (format === 'xml') {
    const { XMLBuilder, XMLValidator } = await import('fast-xml-parser');
    const xmlValue = Array.isArray(data) ? {row: data} : data;
    const xml = new XMLBuilder({ignoreAttributes: false, format: true}).build({data: xmlValue});
    if (XMLValidator.validate(xml) !== true) throw new Error('These JSON keys cannot become XML tags. Use letters, numbers, underscores and hyphens in keys.');
    return xml;
  }
  const rows = Array.isArray(data) ? data : [data];
  if (rows.some(x => x === null || typeof x !== 'object' || Array.isArray(x))) throw new Error('CSV and TSV need an object or an array of objects with column names.');
  const headers = [...new Set(rows.flatMap(x => Object.keys(x)))];
  if (!headers.length) throw new Error('No columns found in this data.');
  const Papa = (await import('papaparse')).default;
  return Papa.unparse({fields: headers, data: rows.map(row => headers.map(h => {
    const v = row[h]; return v != null && typeof v === 'object' ? JSON.stringify(v) : v ?? '';
  }))}, {delimiter: format === 'csv' ? ',' : '\t', newline: '\n'});
}
export function baseNumber(input: string, radix: number): bigint {
  const source = input.trim();
  const pattern = {2: /^-?[01]+$/, 8: /^-?[0-7]+$/, 10: /^-?\d+$/, 16: /^-?[0-9a-f]+$/i}[radix];
  if (!pattern?.test(source)) throw new Error('Enter only valid digits for the selected number base.');
  if (source.length > 1024) throw new Error('Use up to 1,024 digits.');
  const positive = source.replace(/^-/, '');
  const n = BigInt(({2:'0b',8:'0o',10:'',16:'0x'}[radix] || '') + positive);
  return source.startsWith('-') ? -n : n;
}
export const unitGroups: Record<string, Record<string, number>> = {
  Length: {'Metres (m)':1,'Kilometres (km)':1000,'Centimetres (cm)':.01,'Millimetres (mm)':.001,'Miles (mi)':1609.344,'Yards (yd)':.9144,'Feet (ft)':.3048,'Inches (in)':.0254},
  Weight: {'Kilograms (kg)':1,'Grams (g)':.001,'Milligrams (mg)':.000001,'Pounds (lb)':.45359237,'Ounces (oz)':.028349523125},
  Temperature: {'Celsius (°C)':1,'Fahrenheit (°F)':1,'Kelvin (K)':1},
  Area: {'Square metres (m²)':1,'Square kilometres (km²)':1e6,'Square feet (ft²)':.09290304,'Acres':4046.8564224,'Hectares':10000},
  Volume: {'Litres (L)':1,'Millilitres (mL)':.001,'Cubic metres (m³)':1000,'US gallons':3.785411784,'Imperial gallons':4.54609},
  Speed: {'Metres/second':1,'Kilometres/hour':1/3.6,'Miles/hour':.44704,'Knots':.5144444444},
  Time: {'Seconds':1,'Minutes':60,'Hours':3600,'Days':86400,'Weeks':604800},
  Data: {'Bytes (B)':1,'Kilobytes (KB)':1000,'Megabytes (MB)':1e6,'Gigabytes (GB)':1e9,'Kibibytes (KiB)':1024,'Mebibytes (MiB)':1048576,'Gibibytes (GiB)':1073741824},
};
export function convertUnit(value: number, group: string, from: string, to: string) {
  if (!Number.isFinite(value)) throw new Error('Enter a valid number.');
  if (group !== 'Temperature') return value * unitGroups[group][from] / unitGroups[group][to];
  const c = from.startsWith('Fahrenheit') ? (value - 32) * 5 / 9 : from.startsWith('Kelvin') ? value - 273.15 : value;
  if (c < -273.15 - 1e-10) throw new Error('Temperature cannot be below absolute zero.');
  return to.startsWith('Fahrenheit') ? c * 9 / 5 + 32 : to.startsWith('Kelvin') ? c + 273.15 : c;
}
export function qrPayload(kind: string, text: string, ssid: string, password: string, security: string) {
  if (kind !== 'wifi') { if (!text.trim()) throw new Error('Enter a link or some text.'); return text; }
  if (!ssid.trim()) throw new Error('Enter the Wi-Fi network name.');
  const escape = (v: string) => v.replace(/[\\;,:\"]/g, '\\$&');
  return `WIFI:T:${security};S:${escape(ssid)};P:${security === 'nopass' ? '' : escape(password)};;`;
}
export function inspectZip(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = bytes.length - 22;
  while (end >= Math.max(0, bytes.length - 65557) && view.getUint32(end, true) !== 0x06054b50) end--;
  if (end < 0 || end < bytes.length - 65557) throw new Error('This is not a supported ZIP file.');
  const count = view.getUint16(end + 10, true); let offset = view.getUint32(end + 16, true); let total = 0;
  if (view.getUint16(end + 4, true) !== 0 || count === 65535 || count > 500) throw new Error('Use a standard ZIP with no more than 500 entries. ZIP64 and multipart archives are not supported.');
  for (let i = 0; i < count; i++) {
    if (offset + 46 > bytes.length || view.getUint32(offset, true) !== 0x02014b50) throw new Error('The ZIP directory is damaged.');
    if (view.getUint16(offset + 8, true) & 1) throw new Error('Password-protected ZIP files are not supported.');
    const size = view.getUint32(offset + 24, true); total += size;
    if (total > 128 * 1024 * 1024) throw new Error('This ZIP expands beyond the 128 MB extraction limit.');
    offset += 46 + view.getUint16(offset + 28, true) + view.getUint16(offset + 30, true) + view.getUint16(offset + 32, true);
  }
  return {count, total};
}
