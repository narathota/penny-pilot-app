import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import styles from "./TableRow.module.css";

export default function TableRow({ row, headers, hiddenColumns, onDelete }) {
  return (
    <tr>
      {row.map((cell, i) => {
        const headerName = headers[i];
        if (hiddenColumns.includes(headerName)) return null;
        return (
          <td key={i} className={styles.cell}>
            {cell}
          </td>
        );
      })}
      <td className="text-center">
        <button
          type="button"
          className="btn btn-sm btn-outline-danger"
          onClick={onDelete}
          aria-label="Delete row"
          title="Delete row"
        >
          <FontAwesomeIcon icon={faTrash} />
        </button>
      </td>
    </tr>
  );
}
