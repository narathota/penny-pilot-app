import React, { useRef, useState, useCallback } from "react";
import styles from "./UploadArea.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileCsv, faUpload } from "@fortawesome/free-solid-svg-icons";

export default function UploadArea({ onFileSelect }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file && onFileSelect) {
        setFileName(file.name);
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleBrowse = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (file && onFileSelect) {
        setFileName(file.name);
        onFileSelect(file);
      }
      e.target.value = "";
    },
    [onFileSelect]
  );

  return (
    <div
      className={`card ${styles.uploadCard} ${dragOver ? styles.dragOver : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        if (!dragOver) setDragOver(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setDragOver(false);
      }}
      onDrop={handleDrop}
      onClick={(e) => {
        if (!e.target.closest("input[type=file]")) inputRef.current?.click();
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      aria-label="Upload CSV file"
    >
      <div className="card-body">
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-3">
            <FontAwesomeIcon icon={faFileCsv} size="2x" className={styles.csvIcon} />
            <div>
              <div className="fw-semibold">Drag & drop your file here</div>
              <div className="text-secondary small">or click to browse</div>
            </div>
          </div>

          <div>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="form-control"
              onChange={handleBrowse}
            />
          </div>
        </div>

        {fileName ? (
          <div className="mt-3 text-secondary small">
            Selected: <code>{fileName}</code>
          </div>
        ) : null}
      </div>
    </div>
  );
}
