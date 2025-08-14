import React, { useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faTrash } from "@fortawesome/free-solid-svg-icons";
import styles from "./TableRow.module.css";
import { splitTagPathsCell } from "../utils/tagUtils";

export default function TableRow({
  row,
  headers,
  hiddenColumns,
  onDelete,
  onRemoveTagPath, // (rowIndex, pathString) -> void
  rowIndex,
}) {
  const tagsColIndex = useMemo(() => headers.indexOf("Tags"), [headers]);

  return (
    <tr>
      {row.map((cell, i) => {
        const headerName = headers[i];
        if (hiddenColumns.includes(headerName)) return null;

        // Tags column renders full-path chips
        if (i === tagsColIndex) {
          const paths = splitTagPathsCell(cell);
          return (
            <td key={i} className={styles.cell}>
              <div className={styles.tagWrap}>
                {paths.length === 0 ? (
                  <span className="text-secondary small">—</span>
                ) : (
                  paths.map((p) => (
                    <span key={p} className={`badge rounded-pill ${styles.tag}`}>
                      <span className={styles.tagText}>{p}</span>
                      <button
                        type="button"
                        className={styles.tagRemove}
                        aria-label={`Remove ${p}`}
                        title={`Remove ${p}`}
                        onClick={() => onRemoveTagPath?.(rowIndex, p)}
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </td>
          );
        }

        // Default cell
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
 