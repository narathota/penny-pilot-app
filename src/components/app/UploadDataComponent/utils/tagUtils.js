// utils/tagUtils.js

export const TAG_PATH_SEP = " / ";

// Split a cell value into path strings (support multiple paths via "|" or ";")
export function splitTagPathsCell(cellValue) {
  if (cellValue == null) return [];
  return String(cellValue)
    .split(/\s*(?:\||;)\s*/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

// Break a single path into its segments
export function segmentsFromPath(path) {
  return String(path)
    .split(TAG_PATH_SEP)
    .map((s) => s.trim())
    .filter(Boolean);
}

// Build an index: SEGMENT (e.g., "Child 1") -> [transaction IDs]
export function buildSegmentIndexFromRows(rows, idColIndex, tagsColIndex) {
  const index = Object.create(null);

  for (const row of rows) {
    const id = String(row?.[idColIndex] ?? "").trim();
    if (!id) continue;

    const paths = splitTagPathsCell(row?.[tagsColIndex]);
    for (const p of paths) {
      for (const seg of segmentsFromPath(p)) {
        if (!index[seg]) index[seg] = [];
        index[seg].push(id);
      }
    }
  }

  // Dedup & sort IDs per segment
  for (const seg of Object.keys(index)) {
    const set = new Set(index[seg]);
    const arr = Array.from(set);
    arr.sort((a, b) => {
      const na = Number(a), nb = Number(b);
      if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
      return a.localeCompare(b);
    });
    index[seg] = arr;
  }

  const uniqueSegments = Object.keys(index).sort((a, b) => a.localeCompare(b));
  return { index, uniqueSegments };
}
