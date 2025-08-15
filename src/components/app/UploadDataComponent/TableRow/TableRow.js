import React, { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faTrash, faPen, faSave, faXmark } from "@fortawesome/free-solid-svg-icons";
import styles from "./TableRow.module.css";
import { splitTagPathsCell } from "../utils/tagUtils";

// Fetch utils (use your existing firebaseController wrapper)
import { fetchCurrencyList, fetchTransactionTypes } from "../utils/dataFetchers";

export default function TableRow({
  row,
  headers,
  hiddenColumns = [],
  onDelete,
  onRemoveTagPath, // (rowIndex, pathString) -> void
  rowIndex,
  onSaveRow, // (rowIndex, updatedRowArray) -> void
  currencies: currenciesProp = [], // optional pre-fetched
  tagOptions = [], // array of existing tag strings for typeahead
  accountOptions = [], // array of existing account strings for typeahead
}) {
  // Always hide the Status column for this view
  const effectiveHidden = useMemo(() => {
    const set = new Set(["Status", ...hiddenColumns]);
    return Array.from(set);
  }, [hiddenColumns]);

  const tagsColIndex = useMemo(() => headers.indexOf("Tags"), [headers]);
  const dateColIndex = useMemo(() => headers.indexOf("Date"), [headers]);
  const descColIndex = useMemo(() => headers.indexOf("Description"), [headers]);
  const currColIndex = useMemo(() => headers.indexOf("Currency"), [headers]);
  const typeColIndex = useMemo(() => headers.indexOf("Type"), [headers]);
  const acctColIndex = useMemo(() => headers.indexOf("Account"), [headers]);
  const amountColIndex = useMemo(() => headers.indexOf("Amount"), [headers]);

  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState(() => rowToValues(row, headers));

  const [currencies, setCurrencies] = useState([]);
  const [txnTypes, setTxnTypes] = useState([]);
  const [loading, setLoading] = useState({ currencies: false, types: false });
  const [errors, setErrors] = useState({ currencies: "", types: "" });
  const [currencySymbol, setCurrencySymbol] = useState("");

  // Optimistic display row (array) used after Save until parent props update
  const [optimisticRow, setOptimisticRow] = useState(null);

  // ---------- helpers ----------
  const deepEqual = (a, b) => {
    try { return JSON.stringify(a) === JSON.stringify(b); } catch { return false; }
  };

  function rowToValues(r, hdrs) {
    const obj = {};
    hdrs.forEach((h, i) => (obj[h] = r[i]));
    // Normalize certain fields
    if (obj.Date) obj.Date = toISODate(obj.Date);
    if (obj.Tags && Array.isArray(obj.Tags)) obj.Tags = obj.Tags.join(", ");
    return obj;
  }

  function toISODate(v) {
    if (!v) return "";
    try {
      const d = v instanceof Date ? v : new Date(v);
      if (isNaN(d.getTime())) return "";
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    } catch {
      return "";
    }
  }

  function valuesToRowArray(values, hdrs) {
    return hdrs.map((h) => {
      if (h === "Tags") {
        return (values[h] || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .join("; ");
      }
      return values[h];
    });
  }

  // STRICT normalize: require currencyCode; trim & uppercase; de-dupe by code
  function normalizeCurrencies(items) {
    const out = [];
    const seen = new Set();
    (items || []).forEach((raw) => {
      const codeRaw =
        raw?.currencyCode ?? raw?.code ?? raw?.iso ?? ""; // do NOT use doc id fallback
      const code = String(codeRaw || "").trim().toUpperCase();
      if (!code) return; // drop entries without a true code
      if (seen.has(code)) return; // de-dupe
      seen.add(code);
      out.push({
        currencyCode: code,
        currencyName: String(raw?.currencyName || raw?.name || "").trim(),
        symbol: String(raw?.symbol || raw?.sym || "").trim(),
      });
    });
    return out;
  }

  function normalizeTxnTypes(items) {
    return (items || [])
      .map((x) => ({ name: x?.name ? String(x.name) : "" }))
      .filter((x) => x.name)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  // ---------- state syncing & fetching (loop-safe) ----------

  // Use the optimistic row (if present) as the source of truth for base values
  const sourceRow = optimisticRow || row;

  // Derive once per real change in sourceRow/headers
  const baseValues = useMemo(() => rowToValues(sourceRow, headers), [sourceRow, headers]);

  // Keep local state in sync when *not* editing and values truly changed
  useEffect(() => {
    if (!isEditing && !deepEqual(editValues, baseValues)) {
      setEditValues(baseValues);
    }
  }, [baseValues, isEditing, editValues]);

  // When parent row updates to match our optimisticRow, clear the optimistic override
  useEffect(() => {
    if (optimisticRow && deepEqual(optimisticRow, row)) {
      setOptimisticRow(null);
    }
  }, [row, optimisticRow]);

  // Sync external currencies prop if provided (avoid resetting on equal arrays)
  useEffect(() => {
    if (!currenciesProp?.length) return;
    const normalized = normalizeCurrencies(currenciesProp);
    if (!deepEqual(normalized, currencies)) {
      setCurrencies(normalized);
    }
  }, [currenciesProp, currencies]);

  // Fetch lists only once on mount (guarded against prop-provided data)
  useEffect(() => {
    let ignore = false;

    async function loadCurrencies() {
      // if (currenciesProp?.length) return; // parent already provided
      setLoading((s) => ({ ...s, currencies: true }));
      setErrors((e) => ({ ...e, currencies: "" }));
      try {
        const list = await fetchCurrencyList();
        if (!ignore) {
          const normalized = normalizeCurrencies(list);
          if (!deepEqual(normalized, currencies)) setCurrencies(normalized);
        }
      } catch {
        if (!ignore) setErrors((er) => ({ ...er, currencies: "Failed to load currencies" }));
      } finally {
        if (!ignore) setLoading((s) => ({ ...s, currencies: false }));
      }
    }

    async function loadTypes() {
      setLoading((s) => ({ ...s, types: true }));
      setErrors((e) => ({ ...e, types: "" }));
      try {
        const list = await fetchTransactionTypes();
        if (!ignore) {
          const normalized = normalizeTxnTypes(list);
          if (!deepEqual(normalized, txnTypes)) setTxnTypes(normalized);
        }
      } catch {
        if (!ignore) setErrors((er) => ({ ...er, types: "Failed to load types" }));
      } finally {
        if (!ignore) setLoading((s) => ({ ...s, types: false }));
      }
    }

    loadCurrencies();
    loadTypes();
    return () => { ignore = true; };
  }, []); // run once

  // Update currency symbol whenever the selected currency changes
  useEffect(() => {
    const selectedCode = (editValues.Currency || "").toString().toUpperCase();
    const currencyData = currencies.find(
      (c) => c.currencyCode === selectedCode
    );
    setCurrencySymbol(currencyData?.symbol || "");
  }, [editValues.Currency, currencies]);

  // ---------- handlers ----------
  const handleEditClick = () => {
    // Start from what's on screen (optimistic or props)
    setEditValues(baseValues);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditValues(baseValues);
    setIsEditing(false);
  };

  const handleSave = () => {
    const updated = valuesToRowArray(editValues, headers);
    // Optimistically show the updated values until parent updates props
    setOptimisticRow(updated);
    onSaveRow?.(rowIndex, updated);
    setIsEditing(false);
  };

  const handleChange = (field, value) => {
    setEditValues((prev) => ({ ...prev, [field]: value }));
  };

  // ---------- render helpers ----------
  const renderTagsDisplayCell = (cell, i) => {
    const paths = splitTagPathsCell(cell);
    return (
      <td key={i} className={styles.cell}>
        <div className={styles.tagWrap}>
          {paths.length === 0 ? (
            <span className="text-secondary small">—</span>
          ) : (
            paths.map((p, idx) => (
              <span key={`${p}-${idx}`} className={`badge rounded-pill ${styles.tag}`}>
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
  };

  const renderEditableCell = (header, i) => {
    // Date
    if (i === dateColIndex || header === "Date") {
      return (
        <td key={i} className={styles.cell}>
          <input
            type="date"
            className={`form-control form-control-sm ${styles.dateInput}`}
            value={editValues.Date || ""}
            onChange={(e) => handleChange("Date", e.target.value)}
          />
        </td>
      );
    }
    // Description
    if (i === descColIndex || header === "Description") {
      return (
        <td key={i} className={styles.cell}>
          <input
            type="text"
            className="form-control form-control-sm"
            value={editValues.Description || ""}
            onChange={(e) => handleChange("Description", e.target.value)}
          />
        </td>
      );
    }
    // Amount (prefix with symbol of selected currency)
    if (i === amountColIndex || header === "Amount") {
      return (
        <td key={i} className={styles.cell}>
          <div className="input-group input-group-sm">
            {/* {currencySymbol && <span className="input-group-text">{currencySymbol}</span>} */}
            <input
              type="number"
              className="form-control"
              value={editValues.Amount ?? ""}
              onChange={(e) => handleChange("Amount", e.target.value)}
            />
          </div>
        </td>
      );
    }
    // Currency (dropdown shows currencyCode; value is currencyCode)
    if (i === currColIndex || header === "Currency") {
      const selected = currencies.find(x => x.currencyCode === (editValues.Currency || "").toString().toUpperCase());
      const title = selected ? `${selected.currencyName}${selected.symbol ? ` - ${selected.symbol}` : ""}` : "";
      return (
        <td key={i} className={styles.cell}>
          <select
            className="form-select form-select-sm"
            value={(editValues.Currency || "").toString().toUpperCase()}
            onChange={(e) => handleChange("Currency", e.target.value.toUpperCase())}
            disabled={loading.currencies}
            title={title} // hover shows "currencyName - symbol"
          >
            <option value="">{loading.currencies ? "Loading…" : "Select…"}</option>
            {currencies.map((c) => (
              <option key={`cc-${c.currencyCode}`} value={c.currencyCode}>
                {c.currencyCode}
              </option>
            ))}
          </select>
          {errors.currencies && <div className="form-text text-danger">{errors.currencies}</div>}
        </td>
      );
    }
    // Type (dropdown from pp_transaction_types, display by "name")
    if (i === typeColIndex || header === "Type") {
      return (
        <td key={i} className={styles.cell}>
          <select
            className="form-select form-select-sm"
            value={editValues.Type || ""}
            onChange={(e) => handleChange("Type", e.target.value)}
            disabled={loading.types}
          >
            <option value="">{loading.types ? "Loading…" : "Select…"}</option>
            {txnTypes.map((t, idx) => (
              <option key={`tx-${t.name}-${idx}`} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>
          {errors.types && <div className="form-text text-danger">{errors.types}</div>}
        </td>
      );
    }
    // Tags (typeahead; users can add new)
    if (i === tagsColIndex || header === "Tags") {
      const listId = `tags-list-${rowIndex}`;
      return (
        <td key={i} className={styles.cell}>
          <input
            type="text"
            className="form-control form-control-sm"
            list={listId}
            placeholder="Comma-separated tags"
            value={editValues.Tags || ""}
            onChange={(e) => handleChange("Tags", e.target.value)}
          />
          <datalist id={listId}>
            {tagOptions.filter(Boolean).map((t, idx) => (
              <option key={`tag-${t}-${idx}`} value={t} />
            ))}
          </datalist>
        </td>
      );
    }
    // Account (typeahead; users can add new)
    if (i === acctColIndex || header === "Account") {
      const listId = `acct-list-${rowIndex}`;
      return (
        <td key={i} className={styles.cell}>
          <input
            type="text"
            className="form-control form-control-sm"
            list={listId}
            value={editValues.Account || ""}
            onChange={(e) => handleChange("Account", e.target.value)}
          />
          <datalist id={listId}>
            {accountOptions.filter(Boolean).map((a, idx) => (
              <option key={`acct-${a}-${idx}`} value={a} />
            ))}
          </datalist>
        </td>
      );
    }

    // Default: simple text input
    return (
      <td key={i} className={styles.cell}>
        <input
          type="text"
          className="form-control form-control-sm"
          value={editValues[header] ?? ""}
          onChange={(e) => handleChange(header, e.target.value)}
        />
      </td>
    );
  };

  // ---------- render ----------
  const displayRow = optimisticRow || row;

  return (
    <tr>
      {displayRow.map((cell, i) => {
        const headerName = headers[i];
        if (effectiveHidden.includes(headerName)) return null;

        if (isEditing) {
          return renderEditableCell(headerName, i);
        }

        // Non-edit mode
        if (i === tagsColIndex) {
          return renderTagsDisplayCell(cell, i);
        }

        return (
          <td key={i} className={styles.cell}>
            {cell ?? <span className="text-secondary small">—</span>}
          </td>
        );
      })}

      {/* Action column */}
      <td className={`text-center ${styles.actions}`}>
        {!isEditing ? (
          <div className="d-inline-flex gap-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={handleEditClick}
              aria-label="Edit row"
              title="Edit row"
            >
              <FontAwesomeIcon icon={faPen} />
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              onClick={onDelete}
              aria-label="Delete row"
              title="Delete row"
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        ) : (
          <div className="d-inline-flex gap-2">
            {/* Icon-only, but still accessible */}
            <button
              type="button"
              className="btn btn-sm btn-success"
              onClick={handleSave}
              aria-label="Save row"
              title="Save row"
            >
              <FontAwesomeIcon icon={faSave} />
              <span className="visually-hidden"> Save</span>
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={handleCancel}
              aria-label="Cancel edit"
              title="Cancel edit"
            >
              <FontAwesomeIcon icon={faXmark} />
              <span className="visually-hidden"> Cancel</span>
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
