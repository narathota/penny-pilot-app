// utils/csvUtils.js
const NBSP = /\u00a0/g;

export function parseCSV(text, delimiter = ",") {
  const out = [];
  let row = [];
  let field = "";
  let i = 0;
  let inQuotes = false;

  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        field += ch;
        i++;
      }
      continue;
    }
    if (ch === '"') { inQuotes = true; i++; continue; }
    if (ch === delimiter) { row.push(field); field = ""; i++; continue; }
    if (ch === "\n") { row.push(field); out.push(row); row = []; field = ""; i++; continue; }
    if (ch === "\r") { i++; continue; }
    field += ch;
    i++;
  }
  row.push(field);
  out.push(row);
  if (out.length && out[out.length - 1].every((c) => c === "")) out.pop();
  return out;
}

export function ensureUniqueHeaders(arr) {
  const seen = new Map();
  return arr.map((h) => {
    const key = (h || "").toString().replace(NBSP, " ").trim() || "column";
    const base = key.replace(/\s+/g, "_").toLowerCase();
    const count = (seen.get(base) || 0) + 1;
    seen.set(base, count);
    return count === 1 ? base : `${base}_${count}`;
  });
}

export async function readFileTextSmart(file) {
  try {
    return await file.text();
  } catch {
    const ab = await file.arrayBuffer();
    return new TextDecoder("windows-1252").decode(ab);
  }
}
