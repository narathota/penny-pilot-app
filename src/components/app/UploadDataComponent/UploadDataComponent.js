import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import styles from "./UploadDataComponent.module.css";

function normKey(k){ return (k||"").toString().trim().toLowerCase().replace(/[^a-z0-9]+/g,""); }
function isTagsKey(k){ return /^tags?$/.test(normKey(k)); }
function isAmountKey(k){ return /^(amount|amt)$/.test(normKey(k)); }
function isTypeKey(k){ return /^(type|transactiontype|trxtype|txntype)$/.test(normKey(k)); }
function isDateKey(k){ return /^date/.test(normKey(k)); }
function isCurrencyKey(k){ return /^(currency|curr|fx)$/.test(normKey(k)); }
function isDescKey(k){ return /^(description|merchant|details?|narration)$/.test(normKey(k)); }
function isHiddenKey(k){ return /^(id|status|memo|iou)$/.test(normKey(k)); }

const TAG_SEP = " / ";
const MULTI_TAG_SEP_RE = /\s*(?:\||;)\s*/; // allow " | " or " ; " between multiple tag paths
const NBSP = /\u00a0/g;
const COMMON_CURRENCIES = ["USD","CAD","EUR","GBP","AUD","NZD","JPY","INR","CHF","SEK","NOK","DKK","SGD","HKD"];

export default function UploadDataComponent() {
  const inputRef = useRef(null);
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [tagDrafts, setTagDrafts] = useState({}); // { [absRowIndex]: string }

  // Pagination
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  // ---- CSV parsing ----
  const parseCSV = useCallback((text, delimiter = ",") => {
    const out = []; let row = []; let field = ""; let i = 0; let inQuotes = false;
    while (i < text.length) {
      const ch = text[i];
      if (inQuotes) {
        if (ch === '"') { if (text[i+1] === '"') { field += '"'; i += 2; } else { inQuotes = false; i++; } }
        else { field += ch; i++; }
        continue;
      }
      if (ch === '"') { inQuotes = true; i++; continue; }
      if (ch === delimiter) { row.push(field); field = ""; i++; continue; }
      if (ch === "\n") { row.push(field); out.push(row); row = []; field = ""; i++; continue; }
      if (ch === "\r") { i++; continue; }
      field += ch; i++;
    }
    row.push(field); out.push(row);
    if (out.length && out[out.length - 1].every((c) => c === "")) out.pop();
    return out;
  }, []);

  const ensureUniqueHeaders = useCallback((arr) => {
    const seen = new Map();
    return arr.map((h) => {
      const key = (h || "").toString().replace(NBSP, " ").trim() || "column";
      const base = key.replace(/\s+/g, "_").toLowerCase();
      const count = (seen.get(base) || 0) + 1;
      seen.set(base, count);
      return count === 1 ? base : `${base}_${count}`;
    });
  }, []);

  const parseTagPaths = useCallback((v) => {
    const raw = (v || "").toString().replace(NBSP," ").trim();
    if (!raw) return [];
    const paths = raw.split(MULTI_TAG_SEP_RE);
    return paths.filter(Boolean).map((p) => {
      const segs = p.split(TAG_SEP).map(s => s.trim()).filter(Boolean);
      const path = segs.join(TAG_SEP);
      return { path, segments: segs };
    });
  }, []);

  const readFileTextSmart = useCallback(async (file) => {
    try { return await file.text(); }
    catch { const ab = await file.arrayBuffer(); return new TextDecoder("windows-1252").decode(ab); }
  }, []);

  const onFilesSelected = useCallback(async (file) => {
    setError(""); setHeaders([]); setRows([]); setFileName(""); setTagDrafts({});
    setPage(1); // reset pagination
    if (!file) return;
    const isCsv = file.type.includes("csv") || /\.csv$/i.test(file.name);
    if (!isCsv) { setError("Please choose a .csv file."); return; }

    try {
      const raw = await readFileTextSmart(file);
      const text = raw.replace(NBSP, " ");
      const matrix = parseCSV(text, ",");
      if (!matrix.length) { setError("The file appears to be empty."); return; }

      const headerRow = matrix[0] || [];
      const maxCols = matrix.reduce((m, r) => Math.max(m, r.length || 0), headerRow.length);
      let hdrs = ensureUniqueHeaders(headerRow);
      if (hdrs.length < maxCols) for (let i = hdrs.length; i < maxCols; i++) hdrs.push(`column_${i+1}`);

      const tagKey = hdrs.find(isTagsKey);

      const dataRows = matrix.slice(1).map((vals = []) => {
        const obj = {};
        for (let i = 0; i < maxCols; i++) {
          const k = hdrs[i];
          let v = (vals[i] ?? "").toString().replace(NBSP, " ").trim();
          if (k === tagKey) obj[k] = parseTagPaths(v);
          else obj[k] = v;
        }
        return obj;
      });

      setHeaders(hdrs);
      setRows(dataRows);
      setFileName(file.name);
    } catch (e) {
      setError(e?.message || "Failed to read CSV file.");
    }
  }, [ensureUniqueHeaders, parseCSV, readFileTextSmart, parseTagPaths]);

  // Drag & drop
  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files?.[0]; onFilesSelected(f);
  }, [onFilesSelected]);
  const onBrowse = useCallback((e) => {
    const f = e.target.files?.[0]; onFilesSelected(f); e.target.value = "";
  }, [onFilesSelected]);

  const clearAll = useCallback(() => {
    setHeaders([]); setRows([]); setFileName(""); setError(""); setTagDrafts({});
    setPage(1);
    inputRef.current?.focus();
  }, []);

  // Helpers
  const parseAmountNum = (v) => {
    const s = (v ?? "").toString().replace(/[,\s]/g,"");
    const n = Number(s.replace(/[^0-9.\-+]/g,""));
    return Number.isFinite(n) ? n : NaN;
  };
  const toISODateInput = (v) => {
    if (!v) return "";
    const s = v.toString().trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    let m;
    if ((m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/))) {
      const [_, mm, dd, yyyy] = m; return `${yyyy}-${mm.padStart(2,"0")}-${dd.padStart(2,"0")}`;
    }
    if ((m = s.match(/^(\d{4})[\/.](\d{1,2})[\/.](\d{1,2})$/))) {
      const [_, yyyy, mm, dd] = m; return `${yyyy}-${mm.padStart(2,"0")}-${dd.padStart(2,"0")}`;
    }
    const d = new Date(s); if (!isNaN(d)) return d.toISOString().slice(0,10);
    return "";
  };

  // Update cells by absolute row index
  const updateCell = useCallback((absIdx, key, value) => {
    setRows((prev) => {
      const next = [...prev]; next[absIdx] = { ...next[absIdx], [key]: value }; return next;
    });
  }, []);
  const addTag = useCallback((absIdx, tagKey, draft) => {
    const trimmed = (draft||"").trim();
    if (!trimmed) return;
    const segs = trimmed.split(TAG_SEP).map(s=>s.trim()).filter(Boolean);
    if (!segs.length) return;
    const path = segs.join(TAG_SEP);
    setRows(prev => {
      const next = [...prev];
      const cur = Array.isArray(next[absIdx][tagKey]) ? next[absIdx][tagKey] : [];
      if (!cur.some(t => t.path === path)) {
        next[absIdx] = { ...next[absIdx], [tagKey]: [...cur, { path, segments: segs }] };
      }
      return next;
    });
    setTagDrafts(prev => ({ ...prev, [absIdx]: "" }));
  }, []);
  const removeTag = useCallback((absIdx, tagKey, path) => {
    setRows(prev => {
      const next = [...prev];
      const cur = Array.isArray(next[absIdx][tagKey]) ? next[absIdx][tagKey] : [];
      next[absIdx] = { ...next[absIdx], [tagKey]: cur.filter(t => t.path !== path) };
      return next;
    });
  }, []);

  // Sanity hint for amount/type mismatch
  const violatesTypeAmount = useCallback((row) => {
    const aKey = headers.find(isAmountKey);
    const tKey = headers.find(isTypeKey);
    if (!aKey || !tKey) return false;
    const amt = parseAmountNum(row[aKey]);
    if (!isFinite(amt)) return false;
    const t = (row[tKey] ?? "").toString().trim().toLowerCase();
    if (t === "expense" || t === "refund") return amt > 0;
    if (t === "income") return amt < 0;
    if (t === "transfer") return false;
    return false;
  }, [headers]);

  // Column keys
  const tagKey   = useMemo(() => headers.find(isTagsKey), [headers]);
  const dateKey  = useMemo(() => headers.find(isDateKey), [headers]);
  const currKey  = useMemo(() => headers.find(isCurrencyKey), [headers]);
  const amountKey= useMemo(() => headers.find(isAmountKey), [headers]);
  const descKey  = useMemo(() => headers.find(isDescKey), [headers]);

  // UI headers (hide id/status/memo/iou)
  const uiHeaders = useMemo(() => headers.filter((h) => !isHiddenKey(h)), [headers]);

  // Suggestions
  const currencyOptions = useMemo(() => {
    const found = new Set(rows.map(r => (r[currKey] || "").toString().trim().toUpperCase()).filter(Boolean));
    COMMON_CURRENCIES.forEach(c => found.add(c));
    return Array.from(found).sort();
  }, [rows, currKey]);

  const allTagSuggestions = useMemo(() => {
    if (!tagKey) return [];
    const s = new Set();
    rows.forEach(r => (Array.isArray(r[tagKey]) ? r[tagKey] : []).forEach(t => t?.path && s.add(t.path)));
    return Array.from(s).sort((a,b)=>a.localeCompare(b));
  }, [rows, tagKey]);

  // Pagination derived values
  const totalRows = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);
  const start = (page - 1) * pageSize;
  const end = Math.min(start + pageSize, totalRows);
  const pageRows = rows.slice(start, end);

  const buildPageList = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    if (page > 3) pages.push("…");
    const from = Math.max(2, page - 1);
    const to = Math.min(totalPages - 1, page + 1);
    for (let i = from; i <= to; i++) pages.push(i);
    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);
    return pages;
  };

  // --- Render ---
  const tablePreview = useMemo(() => {
    if (!uiHeaders.length) return null;

    return (
      <div className="card mt-3">
        <div className="card-header d-flex flex-wrap gap-2 justify-content-between align-items-center">
          <strong>Preview</strong>

          {/* Page-size selector */}
          <div className="d-flex align-items-center gap-2">
            <label className="text-secondary small">Rows per page</label>
            <select
              className="form-select form-select-sm"
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              style={{ width: 90 }}
            >
              {[10,25,50,100].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        <div className={`card-body ${styles.tableBody}`}>
          <div className={styles.tableWrap}>
            <table className={`table table-sm table-hover align-middle ${styles.table}`}>
              <thead>
                <tr>
                  {uiHeaders.map((h) => (<th key={h} scope="col">{h}</th>))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row, localIdx) => {
                  const absIdx = start + localIdx;
                  const warn = violatesTypeAmount(row);
                  const amtVal = amountKey ? rows[absIdx][amountKey] : "";
                  const amtNum = Number.isFinite(parseAmountNum(amtVal)) ? parseAmountNum(amtVal) : NaN;

                  return (
                    <tr key={absIdx} className={warn ? styles.rowWarn : ""}>
                      {uiHeaders.map((h) => {
                        // Tags
                        if (tagKey && h === tagKey) {
                          const draft = tagDrafts[absIdx] || "";
                          const listId = draft ? `pp-tag-suggestions-${absIdx}` : undefined;
                          const sug = draft
                            ? allTagSuggestions
                                .filter(p => p.toLowerCase().includes(draft.toLowerCase()))
                                .slice(0, 5)
                            : [];
                          const tags = Array.isArray(rows[absIdx][h]) ? rows[absIdx][h] : [];
                          return (
                            <td key={h}>
                              <div className={styles.tagCell}>
                                <div className={styles.chips}>
                                  {tags.map((t) => (
                                    <span key={t.path} className={`badge rounded-pill ${styles.chip}`}>
                                      {t.path}
                                      <button
                                        type="button"
                                        className={styles.chipX}
                                        aria-label={`Remove ${t.path}`}
                                        onClick={() => removeTag(absIdx, h, t.path)}
                                      >×</button>
                                    </span>
                                  ))}
                                </div>

                                <div className="d-flex gap-2 mt-1">
                                  {draft ? (
                                    <datalist id={listId}>
                                      {sug.map((p) => <option key={p} value={p} />)}
                                    </datalist>
                                  ) : null}
                                  <input
                                    list={listId}
                                    className="form-control form-control-sm"
                                    placeholder="Add tag (Parent / Child / …)"
                                    value={draft}
                                    onChange={(e) => setTagDrafts(prev => ({ ...prev, [absIdx]: e.target.value }))}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") { e.preventDefault(); addTag(absIdx, h, draft); }
                                    }}
                                  />
                                  <button
                                    className="btn btn-outline-secondary btn-sm"
                                    disabled={!draft.trim()}
                                    onClick={() => addTag(absIdx, h, draft)}
                                  >
                                    Add
                                  </button>
                                </div>
                              </div>
                            </td>
                          );
                        }

                        // Date
                        if (dateKey && h === dateKey) {
                          return (
                            <td key={h}>
                              <input
                                type="date"
                                className="form-control form-control-sm"
                                value={toISODateInput(rows[absIdx][h])}
                                onChange={(e) => updateCell(absIdx, h, e.target.value)}
                              />
                            </td>
                          );
                        }

                        // Currency
                        if (currKey && h === currKey) {
                          const cur = (rows[absIdx][h] || "").toString().toUpperCase();
                          return (
                            <td key={h}>
                              <select
                                className="form-select form-select-sm"
                                value={cur}
                                onChange={(e) => updateCell(absIdx, h, e.target.value.toUpperCase())}
                              >
                                <option value="">—</option>
                                {currencyOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                              </select>
                            </td>
                          );
                        }

                        // Amount
                        if (amountKey && h === amountKey) {
                          const cls =
                            Number.isFinite(amtNum)
                              ? (amtNum > 0 ? styles.amtPos : (amtNum < 0 ? styles.amtNeg : ""))
                              : "";
                          const invalid = violatesTypeAmount(rows[absIdx]);
                          return (
                            <td key={h}>
                              <input
                                type="number"
                                inputMode="decimal"
                                step="any"
                                className={`form-control form-control-sm text-end ${cls} ${invalid ? "is-invalid" : ""}`}
                                value={(rows[absIdx][h] ?? "").toString()}
                                onChange={(e) => updateCell(absIdx, h, e.target.value)}
                              />
                            </td>
                          );
                        }

                        // Description (plain text; compact layout)
                        if (descKey && h === descKey) {
                          return (
                            <td key={h}>
                              <input
                                className="form-control form-control-sm"
                                value={rows[absIdx][h] ?? ""}
                                onChange={(e) => updateCell(absIdx, h, e.target.value)}
                              />
                            </td>
                          );
                        }

                        // Default
                        return (
                          <td key={h}>
                            <input
                              className="form-control form-control-sm"
                              value={rows[absIdx][h] ?? ""}
                              onChange={(e) => updateCell(absIdx, h, e.target.value)}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-2">
            <div className="text-secondary small">
              {totalRows
                ? <>Showing <strong>{start + 1}</strong>–<strong>{end}</strong> of <strong>{totalRows}</strong></>
                : <>No rows</>}
            </div>

            <nav aria-label="Table pagination">
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
                  <button className="page-link" onClick={() => setPage((p) => Math.max(1, p - 1))} aria-label="Previous">
                    ‹
                  </button>
                </li>
                {buildPageList().map((p, i) =>
                  p === "…" ? (
                    <li key={`e${i}`} className="page-item disabled"><span className="page-link">…</span></li>
                  ) : (
                    <li key={p} className={`page-item ${page === p ? "active" : ""}`}>
                      <button className="page-link" onClick={() => setPage(p)}>{p}</button>
                    </li>
                  )
                )}
                <li className={`page-item ${page >= totalPages ? "disabled" : ""}`}>
                  <button className="page-link" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} aria-label="Next">
                    ›
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    uiHeaders, rows, headers, tagDrafts, amountKey, dateKey, currKey, descKey,
    currencyOptions, allTagSuggestions, page, pageSize, totalRows, totalPages, start, end
  ]);

  return (
    <div className="p-3 p-lg-4">
      <h1 className="h4 fw-bold mb-3">Upload Data</h1>
      <p className="text-secondary">
        Upload a <code>.csv</code> export of your transactions. The first row should be headers.
      </p>

      <div
        className={`card ${styles.uploadCard} ${dragOver ? styles.dragOver : ""}`}
        onDragOver={(e) => { e.preventDefault(); if (!dragOver) setDragOver(true); }}
        onDragLeave={(e) => { if (e.currentTarget === e.target) setDragOver(false); }}
        onDrop={onDrop}
        onClick={(e) => { if (!e.target.closest("input[type=file]")) inputRef.current?.click(); }}
        role="button" tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
        aria-label="Upload CSV file"
      >
        <div className="card-body">
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
            <div className="d-flex align-items-center gap-3">
              <div className={styles.dropBadge}>CSV</div>
              <div>
                <div className="fw-semibold">Drag & drop your file here</div>
                <div className="text-secondary small">or click to browse</div>
              </div>
            </div>

            <div>
              <input
                ref={inputRef}
                id="uploadCsvInput"
                type="file"
                accept=".csv,text/csv"
                className="form-control"
                onChange={onBrowse}
              />
            </div>
          </div>

          {fileName ? (
            <div className="mt-3 text-secondary small">Selected: <code>{fileName}</code></div>
          ) : null}

          {error ? (
            <div className="alert alert-danger mt-3 mb-0" role="alert">{error}</div>
          ) : null}
        </div>
      </div>

      {tablePreview}
    </div>
  );
}
