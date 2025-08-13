import React, { useState, useCallback } from "react";
import UploadArea from "./UploadArea/UploadArea";
import DataTable from "./DataTable/DataTable";
import { buildTagIndex } from "./utils/tagUtils";
import styles from "./UploadDataComponent.module.css";

export default function UploadDataComponent() {
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  // Tag structures for future search/filter
  const [tagIndex, setTagIndex] = useState(null);       // { [tag]: [ids] }
  const [tagVocabulary, setTagVocabulary] = useState([]); // ["Parent Tag 1", "Child 3", ...]

  // Simple CSV parser (kept local so no external deps)
  const parseCSV = useCallback((text, delimiter = ",") => {
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
            field += '"'; // escaped quote
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

    // strip final empty row if present
    if (out.length && out[out.length - 1].every((c) => String(c ?? "").trim() === "")) {
      out.pop();
    }
    return out;
  }, []);

  const recomputeTags = useCallback((hdrs, dataRows) => {
    const idColIndex = hdrs.indexOf("ID");
    const tagColIndex = hdrs.indexOf("Tags");
    if (idColIndex >= 0 && tagColIndex >= 0) {
      const { index, uniqueTags } = buildTagIndex(dataRows, tagColIndex, idColIndex);
      setTagIndex(index);
      setTagVocabulary(uniqueTags);
    } else {
      setTagIndex(null);
      setTagVocabulary([]);
    }
  }, []);

  const handleFileSelect = useCallback(
    async (file) => {
      setError("");
      setHeaders([]);
      setRows([]);
      setTagIndex(null);
      setTagVocabulary([]);

      if (!file) return;
      if (!file.type.includes("csv") && !/\.csv$/i.test(file.name)) {
        setError("Please choose a .csv file.");
        return;
      }

      try {
        const text = await file.text();
        const matrix = parseCSV(text, ",");
        if (!matrix.length) {
          setError("The file appears to be empty.");
          return;
        }

        const hdrs = matrix[0];
        const dataRows = matrix
          .slice(1)
          .filter((r) => Array.isArray(r) && r.some((c) => String(c ?? "").trim() !== ""));

        setHeaders(hdrs);
        setRows(dataRows);
        recomputeTags(hdrs, dataRows);
      } catch (e) {
        console.error(e);
        setError("Failed to read file.");
      }
    },
    [parseCSV, recomputeTags]
  );

  const handleDeleteRow = useCallback((rowIndex) => {
    setRows((prev) => {
      const next = prev.filter((_, i) => i !== rowIndex);
      // keep tag index in sync
      if (headers.length) recomputeTags(headers, next);
      return next;
    });
  }, [headers, recomputeTags]);

  return (
    <div className="p-3 p-lg-4">
      <h1 className="h4 fw-bold mb-3">Upload Data</h1>
      <p className="text-secondary">
        Upload a <code>.csv</code> export of your transactions. The first row should be headers.
      </p>

      <UploadArea onFileSelect={handleFileSelect} />

      {error && <div className="alert alert-danger mt-3">{error}</div>}

      {headers.length > 0 && rows.length > 0 && (
        <div className="mt-4">
          <DataTable headers={headers} rows={rows} onDeleteRow={handleDeleteRow} />

          {/* Optional: tiny debug / visibility for tag logic; safe to remove */}
          {/* <div className="mt-3 small text-secondary">
            <div><strong>Unique Tags:</strong> {tagVocabulary.join(", ")}</div>
            <div><strong>Index Example (Parent Tag 2):</strong> {JSON.stringify(tagIndex?.["Parent Tag 2"] || [])}</div>
          </div> */}
        </div>
      )}
    </div>
  );
}
