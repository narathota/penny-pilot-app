// utils/tagUtils.js

// We treat hierarchy paths like "Parent / Child / Grand Child"
// but each segment becomes a flat tag.
export const TAG_SEP = " / ";

/**
 * Split a single cell value (string) into an array of trimmed tag path segments.
 * e.g. "Parent Tag 2 / Child 1 / Grand Child 1" -> ["Parent Tag 2","Child 1","Grand Child 1"]
 */
export function splitTagPath(cellValue) {
  if (cellValue == null) return [];
  const raw = String(cellValue).trim();
  if (!raw) return [];
  return raw
    .split(TAG_SEP)
    .map(s => s.trim())
    .filter(Boolean);
}

/**
 * Given one CSV row (array of cells) and the index of the Tags column,
 * return a Set of all flat tags present in the row.
 * (If you allow multiple tag paths per row separated by "|" or ";", you can
 * split first and then call splitTagPath on each chunk. For now we assume one path per row.)
 */
export function extractFlatTagsFromRow(row, tagColIndex) {
  const out = new Set();
  if (!Array.isArray(row) || tagColIndex == null || tagColIndex < 0) return out;

  const cell = row[tagColIndex];
  // Support multiple paths per row separated by "|" or ";"
  const paths = String(cell ?? "")
    .split(/\s*(?:\||;)\s*/g)
    .filter(Boolean);

  for (const p of paths) {
    splitTagPath(p).forEach(seg => out.add(seg));
  }
  return out;
}

/**
 * Build a unique tag vocabulary (sorted array) across all rows.
 * @param {Array<Array<string>>} rows  - data rows (no header row)
 * @param {number} tagColIndex         - index of the "Tags" column
 * @returns {Array<string>}            - sorted unique tag names
 */
export function buildUniqueTagList(rows, tagColIndex) {
  const vocab = new Set();
  rows.forEach(r => extractFlatTagsFromRow(r, tagColIndex).forEach(t => vocab.add(t)));
  return Array.from(vocab).sort((a, b) => a.localeCompare(b));
}

/**
 * Build an inverted index: tag -> array of transaction IDs
 * @param {Array<Array<string>>} rows         - data rows (no header row)
 * @param {number} tagColIndex                - index of "Tags"
 * @param {number} idColIndex                 - index of "ID" (or whatever uniquely identifies the row)
 * @returns {{ index: Record<string, string[]>, uniqueTags: string[] }}
 */
export function buildTagIndex(rows, tagColIndex, idColIndex) {
  const index = Object.create(null);

  for (const row of rows) {
    const id = String(row?.[idColIndex] ?? "").trim();
    if (!id) continue;

    const tags = extractFlatTagsFromRow(row, tagColIndex);
    for (const tag of tags) {
      if (!index[tag]) index[tag] = [];
      index[tag].push(id);
    }
  }

  // Sort ID lists for stability
  for (const t of Object.keys(index)) {
    index[t].sort((a, b) => {
      // numeric-ish comparison if both are numbers
      const na = Number(a), nb = Number(b);
      if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
      return a.localeCompare(b);
    });
  }

  const uniqueTags = Object.keys(index).sort((a, b) => a.localeCompare(b));
  return { index, uniqueTags };
}
