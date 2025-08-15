import React, { useMemo, useState, useEffect } from "react";
import TableRow from "../TableRow/TableRow";
import styles from "./DataTable.module.css";

const HIDDEN_COLUMNS = ["ID", "Memo", "IOU"];
const DEFAULT_ROWS_PER_PAGE = 25;
const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 250];

export default function DataTable({
  headers,
  rows,
  onDeleteRow,
  onRemoveTagPath,
  initialRowsPerPage = DEFAULT_ROWS_PER_PAGE,
}) {
  const visibleHeaders = useMemo(
    () => headers.filter((h) => !HIDDEN_COLUMNS.includes(h)),
    [headers]
  );

  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(rows.length / rowsPerPage));
  useEffect(() => {
    if (page > totalPages - 1) setPage(totalPages - 1);
  }, [page, totalPages]);

  const start = page * rowsPerPage;
  const end = Math.min(start + rowsPerPage, rows.length);
  const pageRows = rows.slice(start, end);

  const handlePrev = () => setPage((p) => Math.max(0, p - 1));
  const handleNext = () => setPage((p) => Math.min(totalPages - 1, p + 1));
  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setPage(0);
  };

  return (
    <div className={styles.wrapper}>
      <div className="table-responsive">
        <table className={`table table-striped table-hover align-middle ${styles.dataTable}`}>
          <thead className="table-dark">
            <tr>
              {visibleHeaders.map((header) => (
                <th key={header}>{header}</th>
              ))}
              <th style={{ width: 50 }} />
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, i) => {
              const globalIndex = start + i;
              return (
                <TableRow
                  key={globalIndex}
                  rowIndex={globalIndex}
                  row={row}
                  headers={headers}
                  hiddenColumns={HIDDEN_COLUMNS}
                  onDelete={() => onDeleteRow(globalIndex)}
                  onRemoveTagPath={onRemoveTagPath}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className={`${styles.controls} mt-2`}>
        <div className="small text-secondary">
          {rows.length > 0 ? (
            <>Showing <strong>{start + 1}</strong>–<strong>{end}</strong> of <strong>{rows.length}</strong></>
          ) : (
            <>No rows</>
          )}
        </div>

        <div className={`d-flex align-items-center gap-3 flex-nowrap ${styles.paginationGroup}`}>
          <label className="small text-secondary mb-0" style={{ minWidth: "2.5rem" }}>Rows</label>
          <select
            className="form-select form-select-sm"
            value={rowsPerPage}
            onChange={handleRowsPerPageChange}
          >
            {ROWS_PER_PAGE_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>

          <div className="d-flex align-items-center gap-2 flex-nowrap">
            <button
              type="button"
              className={`btn btn-sm ${page === 0 ? "btn-outline-secondary" : "btn-primary"}`}
              onClick={handlePrev}
              disabled={page === 0}
              aria-label="Previous page"
            >
              ‹
            </button>
            <span className="small text-secondary">
              Page {page + 1} / {totalPages}
            </span>
            <button
              type="button"
              className={`btn btn-sm ${page >= totalPages - 1 ? "btn-outline-secondary" : "btn-primary"}`}
              onClick={handleNext}
              disabled={page >= totalPages - 1}
              aria-label="Next page"
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
