import React, { useState, useCallback } from "react";
import UploadArea from "./UploadArea/UploadArea";
import DataTable from "./DataTable/DataTable";
import ProcessingDataComponent from "./ProcessingDataComponent/ProcessingDataComponent";
import styles from "./UploadDataComponent.module.css";
import { buildSegmentIndexFromRows } from "./utils/tagUtils";

export default function UploadDataComponent() {
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  // Segment-level index for future searching; e.g., "Child 1" -> ["3","4"]
  const [segmentIndex, setSegmentIndex] = useState(null);
  const [segmentVocab, setSegmentVocab] = useState([]);

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
          if (text[i + 1] === '"') { field += '"'; i += 2; }
          else { inQuotes = false; i++; }
        } else { field += ch; i++; }
        continue;
      }

      if (ch === '"') { inQuotes = true; i++; continue; }
      if (ch === delimiter) { row.push(field); field = ""; i++; continue; }
      if (ch === "\n") { row.push(field); out.push(row); row = []; field = ""; i++; continue; }
      if (ch === "\r") { i++; continue; }
      field += ch; i++;
    }

    row.push(field);
    out.push(row);

    // strip final empty row if present
    if (out.length && out[out.length - 1].every((c) => String(c ?? "").trim() === "")) {
      out.pop();
    }
    return out;
  }, []);

  const recomputeSegmentIndex = useCallback((hdrs, dataRows) => {
    const idColIndex = hdrs.indexOf("ID");
    const tagsColIndex = hdrs.indexOf("Tags");
    if (idColIndex >= 0 && tagsColIndex >= 0) {
      const { index, uniqueSegments } = buildSegmentIndexFromRows(dataRows, idColIndex, tagsColIndex);
      setSegmentIndex(index);
      setSegmentVocab(uniqueSegments);
    } else {
      setSegmentIndex(null);
      setSegmentVocab([]);
    }
  }, []);

  const handleFileSelect = useCallback(
    async (file) => {
      setError("");
      setHeaders([]);
      setRows([]);
      setSegmentIndex(null);
      setSegmentVocab([]);

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
        recomputeSegmentIndex(hdrs, dataRows);
      } catch (e) {
        console.error(e);
        setError("Failed to read file.");
      }
    },
    [parseCSV, recomputeSegmentIndex]
  );

  const handleDeleteRow = useCallback((rowIndex) => {
    setRows((prev) => {
      const next = prev.filter((_, i) => i !== rowIndex);
      if (headers.length) recomputeSegmentIndex(headers, next);
      return next;
    });
  }, [headers, recomputeSegmentIndex]);

  // Remove ONE full path from the row’s Tags cell
  const handleRemoveTagPath = useCallback((rowIndex, path) => {
    setRows((prev) => {
      const next = [...prev];
      const tagsColIndex = headers.indexOf("Tags");
      if (tagsColIndex < 0) return prev;

      const current = String(next[rowIndex]?.[tagsColIndex] ?? "");
      const parts = current.split(/\s*(?:\||;)\s*/g).map(s => s.trim()).filter(Boolean);

      const filtered = parts.filter((p) => p !== path);

      next[rowIndex] = [...next[rowIndex]];
      // save as pipe-separated paths
      next[rowIndex][tagsColIndex] = filtered.join(" | ");

      if (headers.length) recomputeSegmentIndex(headers, next);
      return next;
    });
  }, [headers, recomputeSegmentIndex]);

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
          <DataTable
            headers={headers}
            rows={rows}
            onDeleteRow={handleDeleteRow}
            onRemoveTagPath={handleRemoveTagPath}
          />

          <ProcessingDataComponent headers={headers} rows={rows} />

          {/* Optional debug info; remove when not needed */}
          {/* <div className="mt-3 small text-secondary">
            <div><strong>Unique tag segments:</strong> {segmentVocab.join(", ")}</div>
            <div><strong>Parent Tag 2 →</strong> {JSON.stringify(segmentIndex?.["Parent Tag 2"] || [])}</div>
          </div> */}
        </div>
      )}
    </div>
  );
}
