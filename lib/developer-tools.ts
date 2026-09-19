export type DateInputMode = "iso" | "seconds" | "milliseconds";

export function parseDateValue(value: string, mode: DateInputMode): Date {
  const text = value.trim();
  if (!text) throw new Error("Enter a date or timestamp.");
  const numeric = Number(text);
  const date = mode === "iso" ? new Date(text) : new Date(numeric * (mode === "seconds" ? 1000 : 1));
  if (!Number.isFinite(date.getTime())) throw new Error("Enter a valid date or timestamp.");
  return date;
}

export function dateFormats(date: Date) {
  return {
    iso: date.toISOString(),
    utc: date.toUTCString(),
    local: date.toLocaleString(),
    seconds: Math.floor(date.getTime() / 1000).toString(),
    milliseconds: date.getTime().toString(),
  };
}

export function generatePassword(length: number, useSymbols: boolean, random: (max: number) => number) {
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const digits = "23456789";
  const symbols = "!@#$%^&*_-+=";
  const required = [lower, upper, digits, ...(useSymbols ? [symbols] : [])];
  if (!Number.isInteger(length) || length < required.length) throw new Error("Password length is too short.");
  const all = required.join("");
  const result = required.map(chars => chars[random(chars.length)]);
  while (result.length < length) result.push(all[random(all.length)]);
  for (let i = result.length - 1; i > 0; i--) {
    const j = random(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result.join("");
}
