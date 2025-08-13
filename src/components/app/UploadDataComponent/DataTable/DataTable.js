import React from "react";
import TableRow from "../TableRow/TableRow";
import styles from "./DataTable.module.css";

// Columns to hide
const HIDDEN_COLUMNS = ["ID", "Memo", "IOU"];

export default function DataTable({ headers, rows, onDeleteRow }) {
  // Filter visible headers (no whitespace children in <tr>)
  const visibleHeaders = headers.filter((h) => !HIDDEN_COLUMNS.includes(h));

  return (
    <div className="table-responsive">
      <table className={`table table-striped table-hover align-middle ${styles.dataTable}`}>
        <thead className="table-dark">
          <tr>
            {visibleHeaders.map((header) => (
              <th key={header}>{header}</th>
            ))}
            {/* Extra column for delete button */}
            <th style={{ width: 50 }} />
          </tr>
        </thead>

        <tbody>
          {rows.map((row, i) => (
            <TableRow
              key={i}
              row={row}
              headers={headers}
              hiddenColumns={HIDDEN_COLUMNS}
              onDelete={() => onDeleteRow(i)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
