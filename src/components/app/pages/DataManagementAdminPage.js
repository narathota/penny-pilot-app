// FILE: src/components/app/pages/DataManagementAdminPage.js
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  collectionGroup, // (not used for listing roots; kept for future)
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  limit,
  query,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { getApp } from "firebase/app";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRotateLeft,
  faCircleCheck,
  faCircleExclamation,
  faCloudArrowUp,
  faDatabase,
  faFileArrowUp,
  faFolderPlus,
  faListUl,
  faMagnifyingGlassChart,
  faTableList,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";

// -------------------------------------------------------------
// Firestore access (reuse initialized app/db if controller exports getFirebase)
// -------------------------------------------------------------
let getDb;
try {
  // eslint-disable-next-line
  const mod = require("../../utils/firebase/firebaseController");
  if (mod && typeof mod.getFirebase === "function") {
    getDb = () => mod.getFirebase().db;
  }
} catch (_) {}
if (!getDb) getDb = () => getFirestore(getApp());

// -------------------------------------------------------------
// NOTE ON EXISTING COLLECTION DROPDOWN:
// Web Firestore SDK cannot list root collections directly.
// This component looks for a metadata doc at: _meta/collections/root
// with shape: { names: ["transactions","budgets", ...] }.
// Maintain it manually, or generate it in your admin flows.
// If not found, the dropdown will show "No collections found" and you
// can still type a name via the "New collection" option.
// -------------------------------------------------------------
const META_COLLECTIONS_DOC = { col: "_meta", id: "collections" };

const EXAMPLE = `[
  { "id": "tx_1", "date": "2025-07-01", "amount": -12.34, "merchant": "CoffeeCo", "tags": ["Food","Coffee"] },
  { "id": "tx_2", "date": "2025-07-02", "amount": 1200, "merchant": "Acme Payroll", "type": "income" }
]`;

function summarizeArray(arr) {
  const count = arr.length;
  const sample = arr.slice(0, 3);
  const keysCounter = new Map();
  const typeMap = {};
  for (const item of arr) {
    if (item && typeof item === "object" && !Array.isArray(item)) {
      for (const k of Object.keys(item)) {
        keysCounter.set(k, (keysCounter.get(k) || 0) + 1);
        const v = item[k];
        const t =
          v === null ? "null" :
          Array.isArray(v) ? "array" :
          typeof v === "object" ? "object" : typeof v;
        if (!typeMap[k]) typeMap[k] = {};
        typeMap[k][t] = (typeMap[k][t] || 0) + 1;
      }
    }
  }
  const keys = Array.from(keysCounter.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([key, occ]) => ({ key, occurrences: occ, coveragePct: Math.round((occ / count) * 100) }));
  return { count, sample, keys, typeMap };
}

function isPlainObject(v) {
  return v && typeof v === "object" && !Array.isArray(v);
}

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

export default function DataManagementAdminPage() {
  // --- Destination mode: new vs existing ---
  const [mode, setMode] = useState("new"); // "new" | "existing"
  const [newCollectionName, setNewCollectionName] = useState("");
  const [existingCollections, setExistingCollections] = useState([]);
  const [selectedExisting, setSelectedExisting] = useState("");
  const [existingWriteMode, setExistingWriteMode] = useState("append"); // "append" | "override"

  // --- Data input: paste vs file ---
  const [inputMode, setInputMode] = useState("paste"); // "paste" | "file"
  const [raw, setRaw] = useState("");
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef(null);

  // --- Analysis state ---
  const [parsed, setParsed] = useState(null);
  const [summary, setSummary] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  // --- Write state (delete + write phases) ---
  const [writing, setWriting] = useState(false);
  const [written, setWritten] = useState(0);
  const [totalToWrite, setTotalToWrite] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(0);
  const [totalToDelete, setTotalToDelete] = useState(0);
  const [writeError, setWriteError] = useState("");
  const [writeDone, setWriteDone] = useState(false);

  // Load existing collection names from metadata
  useEffect(() => {
    (async () => {
      try {
        const db = getDb();
        const ref = doc(collection(db, META_COLLECTIONS_DOC.col), META_COLLECTIONS_DOC.id);
        const snap = await getDocs(query(collection(db, `${META_COLLECTIONS_DOC.col}/${META_COLLECTIONS_DOC.id}/names`), limit(1)));
        // Prefer a subcollection of names as documents (scales better), else try a flat doc.
        if (!snap.empty) {
          // names subcollection, each doc = { name: "transactions" }
          const namesSnap = await getDocs(collection(db, `${META_COLLECTIONS_DOC.col}/${META_COLLECTIONS_DOC.id}/names`));
          const names = namesSnap.docs.map((d) => (d.data()?.name || d.id)).filter(Boolean);
          setExistingCollections(names.sort());
          if (names.length) setSelectedExisting(names[0]);
        } else {
          // fallback: flat doc with array property "names"
          const docSnap = await (await import("firebase/firestore")).getDoc(ref);
          if (docSnap.exists()) {
            const names = Array.isArray(docSnap.data()?.names) ? docSnap.data().names : [];
            setExistingCollections(names.sort());
            if (names.length) setSelectedExisting(names[0]);
          } else {
            setExistingCollections([]);
          }
        }
      } catch {
        setExistingCollections([]);
      }
    })();
  }, []);

  const targetCollectionName = useMemo(() => {
    return mode === "new" ? newCollectionName.trim() : selectedExisting.trim();
  }, [mode, newCollectionName, selectedExisting]);

  const canAnalyze = useMemo(() => !!targetCollectionName && (
    (inputMode === "paste" && raw.trim().length > 0) ||
    (inputMode === "file" && raw.trim().length > 0)
  ), [targetCollectionName, inputMode, raw]);

  const canWrite = useMemo(() => !!parsed && parsed.length > 0 && !!targetCollectionName, [parsed, targetCollectionName]);

  const resetAll = useCallback(() => {
    setMode("new");
    setNewCollectionName("");
    setSelectedExisting("");
    setExistingWriteMode("append");
    setInputMode("paste");
    setRaw("");
    setFileName("");
    setParsed(null);
    setSummary(null);
    setAnalyzing(false);
    setError("");
    setWriting(false);
    setWritten(0);
    setTotalToWrite(0);
    setDeleting(false);
    setDeleted(0);
    setTotalToDelete(0);
    setWriteError("");
    setWriteDone(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  // ----- Parse helpers -----
  const parseMaybeArray = (text) => {
    let data;
    // Try JSON first
    try {
      data = JSON.parse(text);
    } catch (e) {
      // Try NDJSON
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      if (lines.length > 1) {
        const arr = [];
        for (const line of lines) {
          try {
            arr.push(JSON.parse(line));
          } catch {
            throw new Error("Invalid JSON or NDJSON. Parsing failed near a line.");
          }
        }
        data = arr;
      } else {
        throw e;
      }
    }
    // If object that contains an array field, unwrap the first array
    if (!Array.isArray(data) && isPlainObject(data)) {
      const firstArrayKey = Object.keys(data).find((k) => Array.isArray(data[k]));
      if (firstArrayKey) data = data[firstArrayKey];
    }
    if (!Array.isArray(data)) throw new Error("Expected an array of objects.");
    return data;
  };

  const analyze = useCallback(() => {
    setError("");
    setWriteError("");
    setWriteDone(false);
    setAnalyzing(true);
    setSummary(null);
    setParsed(null);
    try {
      const arr = parseMaybeArray(raw);
      const bad = arr.find((x) => !isPlainObject(x));
      if (bad) throw new Error("All items must be plain objects (key → value).");
      const s = summarizeArray(arr);
      setParsed(arr);
      setSummary(s);
    } catch (e) {
      setError(e?.message || "Failed to analyze dataset.");
    } finally {
      setAnalyzing(false);
    }
  }, [raw]);

  // ----- File selection -----
  const onSelectFile = async (file) => {
    setError("");
    setWriteError("");
    setWriteDone(false);
    setParsed(null);
    setSummary(null);
    setFileName("");
    if (!file) return;
    const okType = file.type === "application/json" || /\.json$/i.test(file.name);
    if (!okType) {
      setError("Please select a .json file.");
      return;
    }
    try {
      const text = await file.text();
      setRaw(text);
      setFileName(file.name);
    } catch (e) {
      setError("Could not read the file.");
    }
  };

  // ----- Delete all docs in a collection (batched) -----
  const deleteAllInCollection = async (db, colPath, reportEvery = 400) => {
    const colRef = collection(db, colPath);
    const BATCH = 400;
    let total = 0;
    let loopGuard = 0;

    // First, estimate total by fetching first page then counting pages as we delete
    // (we also update totalToDelete lazily).
    setDeleting(true);
    setDeleted(0);
    setTotalToDelete(0);

    while (true) {
      // limit-only query to fetch some docs; no order ensures server default order
      const snap = await getDocs(query(colRef, limit(BATCH)));
      if (snap.empty) break;

      if (loopGuard++ > 10000) throw new Error("Aborting: too many delete iterations.");
      const batch = writeBatch(db);
      snap.docs.forEach((d) => {
        batch.delete(d.ref);
      });
      await batch.commit();

      total += snap.size;
      setDeleted((d) => d + snap.size);
      setTotalToDelete((t) => Math.max(t, total)); // grow estimate

      // yield to UI
      await sleep(0);
    }

    setTotalToDelete(total);
    setDeleting(false);
    return total;
  };

  // ----- Write to Firestore (batched) -----
  const writeToFirebase = useCallback(async () => {
    setWriteError("");
    setWriteDone(false);
    setWriting(true);
    setWritten(0);
    setDeleting(false);
    setDeleted(0);
    setTotalToDelete(0);

    try {
      const db = getDb();
      const colPath = targetCollectionName;
      if (!colPath) throw new Error("Missing collection name.");

      // If override on existing, delete all docs first
      if (mode === "existing" && existingWriteMode === "override") {
        await deleteAllInCollection(db, colPath);
      }

      const items = parsed || [];
      setTotalToWrite(items.length);

      const colRef = collection(db, colPath);
      const BATCH_SIZE = 400;

      for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const slice = items.slice(i, i + BATCH_SIZE);
        for (const item of slice) {
          // prefer id/uid if present
          const id = item.id || item.uid || undefined;
          const ref = id ? doc(colRef, String(id)) : doc(colRef);
          batch.set(
            ref,
            {
              ...item,
              createdAt: serverTimestamp(),
              source: item?.source || "admin-import",
            },
            { merge: true }
          );
        }
        await batch.commit();
        setWritten((w) => w + slice.length);
        // yield to UI to stay responsive
        await sleep(0);
      }

      setWriteDone(true);
    } catch (e) {
      setWriteError(e?.message || "Failed to write to Firestore.");
    } finally {
      setWriting(false);
    }
  }, [mode, existingWriteMode, parsed, targetCollectionName]);

  // -------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------
  return (
    <div className="container py-3 py-lg-4">
      <div className="d-flex align-items-center mb-3">
        <FontAwesomeIcon icon={faDatabase} className="me-2" />
        <h1 className="h4 fw-bold mb-0">Data Management – Admin</h1>
        <span className="ms-2 badge text-bg-warning">Restricted</span>
      </div>
      <p className="text-muted mb-4">
        Upload or paste JSON/NDJSON and write to a Firestore collection. Supports append or full override for existing collections.
      </p>

      {/* Destination selector */}
      <div className="card shadow-sm mb-4">
        <div className="card-header fw-semibold">
          Destination
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-12 col-lg-6">
              <div className="form-check">
                <input
                  id="mode-new"
                  className="form-check-input"
                  type="radio"
                  name="destMode"
                  value="new"
                  checked={mode === "new"}
                  onChange={() => setMode("new")}
                />
                <label htmlFor="mode-new" className="form-check-label">
                  <FontAwesomeIcon icon={faFolderPlus} className="me-2" />
                  New collection
                </label>
              </div>
              {mode === "new" && (
                <div className="mt-2">
                  <label className="form-label fw-semibold">Collection name</label>
                  <input
                    className="form-control"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    placeholder='e.g., "transactions"'
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                </div>
              )}
            </div>

            <div className="col-12 col-lg-6">
              <div className="form-check">
                <input
                  id="mode-existing"
                  className="form-check-input"
                  type="radio"
                  name="destMode"
                  value="existing"
                  checked={mode === "existing"}
                  onChange={() => setMode("existing")}
                />
                <label htmlFor="mode-existing" className="form-check-label">
                  <FontAwesomeIcon icon={faListUl} className="me-2" />
                  Existing collection
                </label>
              </div>

              {mode === "existing" && (
                <div className="mt-2">
                  <label className="form-label fw-semibold">Select collection</label>
                  <select
                    className="form-select"
                    value={selectedExisting}
                    onChange={(e) => setSelectedExisting(e.target.value)}
                  >
                    {existingCollections.length === 0 ? (
                      <option value="" disabled>
                        No collections found in metadata
                      </option>
                    ) : (
                      existingCollections.map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))
                    )}
                  </select>

                  <div className="mt-3">
                    <div className="form-check form-check-inline">
                      <input
                        id="write-append"
                        className="form-check-input"
                        type="radio"
                        name="existingWriteMode"
                        value="append"
                        checked={existingWriteMode === "append"}
                        onChange={() => setExistingWriteMode("append")}
                      />
                      <label htmlFor="write-append" className="form-check-label">
                        Append
                      </label>
                    </div>
                    <div className="form-check form-check-inline">
                      <input
                        id="write-override"
                        className="form-check-input"
                        type="radio"
                        name="existingWriteMode"
                        value="override"
                        checked={existingWriteMode === "override"}
                        onChange={() => setExistingWriteMode("override")}
                      />
                      <label htmlFor="write-override" className="form-check-label">
                        <FontAwesomeIcon icon={faTrashCan} className="me-2" />
                        Override (delete all first)
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Input source */}
      <div className="card shadow-sm mb-4">
        <div className="card-header fw-semibold">
          Data Source
        </div>
        <div className="card-body">
          <div className="d-flex gap-3 mb-3">
            <div className="form-check">
              <input
                id="input-paste"
                className="form-check-input"
                type="radio"
                name="inputMode"
                value="paste"
                checked={inputMode === "paste"}
                onChange={() => setInputMode("paste")}
              />
              <label htmlFor="input-paste" className="form-check-label">
                Paste JSON / NDJSON
              </label>
            </div>
            <div className="form-check">
              <input
                id="input-file"
                className="form-check-input"
                type="radio"
                name="inputMode"
                value="file"
                checked={inputMode === "file"}
                onChange={() => setInputMode("file")}
              />
              <label htmlFor="input-file" className="form-check-label">
                Upload .json file
              </label>
            </div>
          </div>

          {inputMode === "paste" ? (
            <div>
              <label className="form-label fw-semibold d-flex align-items-center">
                <FontAwesomeIcon icon={faTableList} className="me-2" />
                Dataset (JSON array or NDJSON)
              </label>
              <textarea
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                className="form-control"
                placeholder={EXAMPLE}
                rows={12}
                style={{ fontFamily: "var(--pp-font-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace)" }}
              />
              <div className="form-text">
                Tip: NDJSON is supported (one JSON object per line). You can also paste an object that contains a single array field.
              </div>
            </div>
          ) : (
            <div>
              <label className="form-label fw-semibold d-flex align-items-center">
                <FontAwesomeIcon icon={faFileArrowUp} className="me-2" />
                Select a .json file
              </label>
              <input
                ref={fileInputRef}
                className="form-control"
                type="file"
                accept=".json,application/json"
                onChange={(e) => onSelectFile(e.target.files?.[0] || null)}
              />
              {fileName && (
                <div className="form-text">
                  Selected: <code>{fileName}</code>
                </div>
              )}
              {!!raw && (
                <div className="mt-3">
                  <label className="form-label fw-semibold">Preview (first 2000 chars)</label>
                  <pre className="small border rounded p-2" style={{ maxHeight: 200, overflow: "auto", whiteSpace: "pre-wrap" }}>
                    {raw.slice(0, 2000)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="d-flex flex-wrap gap-2 mt-3">
            <button
              className="btn btn-outline-secondary"
              type="button"
              onClick={() => setRaw(EXAMPLE)}
            >
              Load example
            </button>

            <button
              className="btn btn-primary"
              type="button"
              onClick={analyze}
              disabled={!canAnalyze || analyzing}
            >
              <FontAwesomeIcon icon={faMagnifyingGlassChart} className="me-2" />
              {analyzing ? "Analyzing…" : "Analyze dataset"}
            </button>

            <button
              className="btn btn-outline-danger ms-auto"
              type="button"
              onClick={resetAll}
            >
              <FontAwesomeIcon icon={faArrowRotateLeft} className="me-2" />
              Start again
            </button>
          </div>

          {error && (
            <div className="alert alert-danger mt-3 d-flex">
              <FontAwesomeIcon icon={faCircleExclamation} className="me-2 mt-1" />
              <div>
                <div className="fw-semibold">Analysis failed</div>
                <div className="small">{error}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary + Write */}
      {summary && (
        <div className="card shadow-sm mb-4">
          <div className="card-header d-flex align-items-center">
            <FontAwesomeIcon icon={faMagnifyingGlassChart} className="me-2" />
            <span className="fw-semibold">Dataset Summary</span>
          </div>
          <div className="card-body">
            <div className="row gy-3">
              <div className="col-12 col-md-4">
                <div className="border rounded p-3">
                  <div className="text-muted small">Items</div>
                  <div className="fs-4 fw-semibold">{summary.count}</div>
                </div>
              </div>
              <div className="col-12 col-md-8">
                <div className="border rounded p-3">
                  <div className="text-muted small mb-2">Top keys (coverage)</div>
                  {summary.keys.length === 0 ? (
                    <div className="text-muted">No keys detected.</div>
                  ) : (
                    <div className="small">
                      {summary.keys.slice(0, 14).map((k) => (
                        <span key={k.key} className="badge text-bg-light me-2 mb-2">
                          <code className="me-1">{k.key}</code>
                          <span className="text-muted">({k.coveragePct}%)</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="col-12">
                <div className="border rounded p-3">
                  <div className="text-muted small mb-2">Sample (first 3 rows)</div>
                  <pre className="small mb-0" style={{ whiteSpace: "pre-wrap" }}>
                    {JSON.stringify(summary.sample, null, 2)}
                  </pre>
                </div>
              </div>
            </div>

            {/* Delete + Write progress */}
            {(deleting || totalToDelete > 0) && (
              <div className="mt-3">
                <div className="text-muted small mb-1">Deleting existing docs (override)</div>
                <div className="progress" role="progressbar" aria-valuemin="0" aria-valuemax={Math.max(totalToDelete, 1)} aria-valuenow={deleted}>
                  <div
                    className="progress-bar"
                    style={{ width: totalToDelete ? `${Math.round((deleted / totalToDelete) * 100)}%` : "0%" }}
                  >
                    {deleted}/{totalToDelete || "?"}
                  </div>
                </div>
              </div>
            )}

            {(writing || writeDone || writeError) && (
              <div className="mt-3">
                <div className="text-muted small mb-1">Writing new docs</div>
                <div className="progress" role="progressbar" aria-valuemin="0" aria-valuemax={Math.max(totalToWrite, 1)} aria-valuenow={written}>
                  <div
                    className="progress-bar"
                    style={{ width: totalToWrite ? `${Math.round((written / totalToWrite) * 100)}%` : "0%" }}
                  >
                    {written}/{totalToWrite}
                  </div>
                </div>
              </div>
            )}

            {writeDone && !writeError && (
              <div className="alert alert-success d-flex align-items-start mt-3">
                <FontAwesomeIcon icon={faCircleCheck} className="me-2 mt-1" />
                <div>
                  <div className="fw-semibold">Import complete</div>
                  <div className="small">
                    Imported {written} documents into <code>{targetCollectionName}</code>.
                  </div>
                </div>
              </div>
            )}

            {writeError && (
              <div className="alert alert-danger d-flex align-items-start mt-3">
                <FontAwesomeIcon icon={faCircleExclamation} className="me-2 mt-1" />
                <div>
                  <div className="fw-semibold">Import failed</div>
                  <div className="small">{writeError}</div>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="d-flex flex-wrap gap-2 mt-3">
              <button
                className="btn btn-success"
                type="button"
                onClick={writeToFirebase}
                disabled={!canWrite || writing || deleting}
              >
                <FontAwesomeIcon icon={faCloudArrowUp} className="me-2" />
                {writing ? "Writing…" : `Write to Firebase (${summary.count})`}
              </button>

              <button
                className="btn btn-outline-danger ms-auto"
                type="button"
                onClick={resetAll}
                disabled={writing || deleting}
              >
                <FontAwesomeIcon icon={faArrowRotateLeft} className="me-2" />
                Start again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
