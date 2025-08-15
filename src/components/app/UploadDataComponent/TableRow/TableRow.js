import React, { useEffect, useMemo, useState, useRef } from "react";
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
  // Map header names -> indices once
  const idx = useMemo(() => {
    const map = new Map();
    headers?.forEach((h, i) => map.set(h, i));
    return {
      Tags: map.get("Tags"),
      Date: map.get("Date"),
      Description: map.get("Description"),
      Currency: map.get("Currency"),
      Type: map.get("Type"),
      Account: map.get("Account"),
      Amount: map.get("Amount"),
    };
  }, [headers]);

  // Always hide the Status column for this view
  const effectiveHidden = useMemo(() => {
    const set = new Set(["Status", ...hiddenColumns]);
    return Array.from(set);
  }, [hiddenColumns]);

  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState(() => rowToValues(row, headers));

  const [currencies, setCurrencies] = useState([]);
  const [txnTypes, setTxnTypes] = useState([]);
  const [loading, setLoading] = useState({ currencies: false, types: false });
  const [errors, setErrors] = useState({ currencies: "", types: "" });

  // Optimistic display row (array) used after Save until parent props update
  const [optimisticRow, setOptimisticRow] = useState(null);

  // ---------- helpers ----------
  const deepEqual = (a, b) => {
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return false;
    }
  };

  function rowToValues(r, hdrs) {
    const obj = {};
    (hdrs || []).forEach((h, i) => (obj[h] = r?.[i]));
    if (obj.Date) obj.Date = toISODate(obj.Date);
    if (obj.Tags && Array.isArray(obj.Tags)) obj.Tags = obj.Tags.join(", ");
    return obj;
  }

  function toISODate(v) {
    if (!v) return "";
    const d = v instanceof Date ? v : new Date(v);
    if (isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function valuesToRowArray(values, hdrs) {
    return (hdrs || []).map((h) => {
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
      const code = String(raw?.currencyCode ?? raw?.code ?? raw?.iso ?? "")
        .trim()
        .toUpperCase();
      if (!code || seen.has(code)) return;
      seen.add(code);
      out.push({
        currencyCode: code,
        currencyName: String(raw?.currencyName || raw?.name || "").trim(),
        symbol: String(raw?.symbol || raw?.sym || "").trim(),
      });
    });
    return out;
  }

  // Preserve at least { name, symbol, id } for Type↔Amount behavior
  function normalizeTxnTypes(items) {
    return (items || [])
      .map((x) => ({
        name: x?.name ? String(x.name) : "",
        symbol: x?.symbol === "-" ? "-" : "+", // default to +
        id: x?.id ? String(x.id) : undefined,
      }))
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
      // If parent supplied currencies, use those; otherwise fetch
      if (!currenciesProp?.length) {
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
    return () => {
      ignore = true;
    };
  }, []); // run once

  // ---------- handlers ----------
  const handleEditClick = () => {
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
    setEditValues((prev) => {
      if (field === "Type") {
        const selected = txnTypes.find((t) => t.name === value);
        const sym = selected?.symbol === "-" ? "-" : "+";
        const next = { ...prev, Type: value };
        // Normalize sign of amount if numeric
        const asNum = Number(next.Amount);
        if (!Number.isNaN(asNum)) {
          const magnitude = Math.abs(asNum);
          next.Amount = sym === "-" ? -magnitude : magnitude;
        }
        return next;
      }
      return { ...prev, [field]: value };
    });
  };

  // Optimistically remove a tag in-display, then notify parent
  const handleRemoveTag = (pathToRemove) => {
    const tagCol = idx.Tags;
    if (typeof tagCol !== "number") {
      onRemoveTagPath?.(rowIndex, pathToRemove);
      return;
    }
    const current = optimisticRow || row || [];
    const currentCell = current[tagCol] ?? "";
    const parts = splitTagPathsCell(currentCell);
    const nextParts = parts.filter((p) => p !== pathToRemove);
    const nextCell = nextParts.join("; ");
    const nextRow = [...current];
    nextRow[tagCol] = nextCell;
    setOptimisticRow(nextRow);
    onRemoveTagPath?.(rowIndex, pathToRemove);
  };

  // ---------- Tags typeahead (edit mode) ----------
  const tagsInputRef = useRef(null);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [tagsHighlight, setTagsHighlight] = useState(0);

  const tagTokens = useMemo(() => {
    return String(editValues.Tags || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [editValues.Tags]);

  const lastFragment = useMemo(() => {
    const raw = String(editValues.Tags || "");
    const commaIdx = raw.lastIndexOf(",");
    return (commaIdx === -1 ? raw : raw.slice(commaIdx + 1)).trimStart();
  }, [editValues.Tags]);

  const tagSuggestions = useMemo(() => {
    const existing = new Set(tagTokens.map((t) => t.toLowerCase()));
    const base = (tagOptions || []).filter(Boolean);
    // When empty, show all not-yet-used; otherwise prefix-filter
    const pool = base.filter((t) => !existing.has(String(t).toLowerCase()));
    if (!lastFragment) return pool.slice(0, 20);
    const lf = lastFragment.toLowerCase();
    return pool.filter((t) => String(t).toLowerCase().startsWith(lf)).slice(0, 20);
  }, [tagOptions, tagTokens, lastFragment]);

  const replaceLastFragment = (full, replacement) => {
    const raw = String(full || "");
    const idx = raw.lastIndexOf(",");
    const before = idx === -1 ? "" : raw.slice(0, idx + 1) + " ";
    return (before + replacement).replace(/\s+$/g, "");
  };

  const acceptTagSuggestion = (value) => {
    const replaced = replaceLastFragment(editValues.Tags || "", value);
    // Append trailing comma + space to keep adding tags
    const withComma = replaced.length ? `${replaced}, ` : `${value}, `;
    handleChange("Tags", withComma);
    setTagsOpen(true);
    setTagsHighlight(0);
    // focus back to input
    requestAnimationFrame(() => tagsInputRef.current?.focus());
  };

  const onTagsKeyDown = (e) => {
    if (!tagsOpen && ["ArrowDown", "Enter", "Tab"].includes(e.key)) {
      setTagsOpen(true);
    }
    if (!tagsOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setTagsHighlight((i) => Math.min(i + 1, Math.max(tagSuggestions.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setTagsHighlight((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" || e.key === "Tab") {
      if (tagSuggestions.length > 0) {
        e.preventDefault();
        acceptTagSuggestion(tagSuggestions[tagsHighlight] || tagSuggestions[0]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setTagsOpen(false);
    } else if (e.key === ",") {
      // Keep menu open after comma to suggest next tag
      setTagsOpen(true);
      setTagsHighlight(0);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!tagsOpen) return;
    const onDocClick = (ev) => {
      if (!tagsInputRef.current) return;
      if (tagsInputRef.current.contains(ev.target)) return;
      // if click is inside the dropdown container, ignore
      const menu = document.getElementById(`tags-menu-${rowIndex}`);
      if (menu && menu.contains(ev.target)) return;
      setTagsOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [tagsOpen, rowIndex]);

  // ---------- render helpers ----------
  const renderTagsDisplayCell = (cell, i) => {
    const paths = splitTagPathsCell(cell);
    return (
      <td key={i} className={styles.cell}>
        <div className={styles.tagWrap}>
          {paths.length === 0 ? (
            <span className="text-secondary small">—</span>
          ) : (
            paths.map((p, idx2) => (
              <span key={`${p}-${idx2}`} className={`badge rounded-pill ${styles.tag}`}>
                <span className={styles.tagText}>{p}</span>
                <button
                  type="button"
                  className={styles.tagRemove}
                  aria-label={`Remove ${p}`}
                  title={`Remove ${p}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveTag(p);
                  }}
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

  const applyAmountSign = (raw, symbol) => {
    if (raw === "" || raw === null || raw === undefined) return raw;
    const n = Number(raw);
    if (Number.isNaN(n)) return raw;
    const abs = Math.abs(n);
    return symbol === "-" ? -abs : abs;
  };

  const renderEditableCell = (header, i) => {
    // Date
    if (i === idx.Date || header === "Date") {
      return (
        <td key={i} className={`${styles.cell} ${styles.dateCell}`}>
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
    if (i === idx.Description || header === "Description") {
      return (
        <td key={i} className={`${styles.cell} ${styles.descriptionCell}`}>
          <input
            type="text"
            className="form-control form-control-sm"
            value={editValues.Description || ""}
            onChange={(e) => handleChange("Description", e.target.value)}
          />
        </td>
      );
    }
    // Amount (with operator prefix derived from selected Type)
    if (i === idx.Amount || header === "Amount") {
      const selectedType = txnTypes.find((t) => t.name === editValues.Type);
      const typeSymbol = selectedType?.symbol === "-" ? "-" : "+";
      const amountNum = Number(editValues.Amount);
      const magnitude =
        editValues.Amount === "" || Number.isNaN(amountNum) ? (editValues.Amount ?? "") : Math.abs(amountNum);

      return (
        <td key={i} className={`${styles.cell} ${styles.amountCell}`}>
          <div className={`input-group input-group-sm ${styles.amountGroup}`}>
            <span className={`input-group-text ${styles.amountPrefix}`} aria-label="Amount sign">
              {typeSymbol}
            </span>
            <input
              type="number"
              className={`form-control ${styles.amountInput}`}
              value={magnitude}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "") {
                  handleChange("Amount", "");
                  return;
                }
                const n = Number(val);
                if (Number.isNaN(n)) {
                  handleChange("Amount", val);
                } else {
                  handleChange("Amount", applyAmountSign(n, typeSymbol));
                }
              }}
            />
          </div>
        </td>
      );
    }
    // Currency (dropdown shows currencyCode; value is currencyCode)
    if (i === idx.Currency || header === "Currency") {
      const selectedCode = String(editValues.Currency || "").toUpperCase();
      const selected = currencies.find((x) => x.currencyCode === selectedCode);
      const title = selected ? `${selected.currencyName}${selected.symbol ? ` - ${selected.symbol}` : ""}` : "";
      return (
        <td key={i} className={styles.cell}>
          <select
            className="form-select form-select-sm"
            value={selectedCode}
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
    if (i === idx.Type || header === "Type") {
      return (
        <td key={i} className={styles.cell}>
          <select
            className="form-select form-select-sm"
            value={editValues.Type || ""}
            onChange={(e) => handleChange("Type", e.target.value)}
            disabled={loading.types}
          >
            <option value="">{loading.types ? "Loading…" : "Select…"}</option>
            {txnTypes.map((t) => (
              <option key={`tx-${t.id || t.name}`} value={t.name}>
                {t.name} {t.symbol ? `(${t.symbol})` : ""}
              </option>
            ))}
          </select>
          {errors.types && <div className="form-text text-danger">{errors.types}</div>}
        </td>
      );
    }
    // Tags (custom typeahead; users can add new, comma-separated)
    if (i === idx.Tags || header === "Tags") {
      const menuId = `tags-menu-${rowIndex}`;
      return (
        <td key={i} className={`${styles.cell} ${styles.tagsCell}`}>
          <div className={styles.tagsTypeaheadWrap}>
            <input
              ref={tagsInputRef}
              type="text"
              className="form-control form-control-sm"
              placeholder="Comma-separated tags"
              value={editValues.Tags || ""}
              onFocus={() => setTagsOpen(true)}
              onChange={(e) => {
                handleChange("Tags", e.target.value);
                setTagsOpen(true);
                setTagsHighlight(0);
              }}
              onKeyDown={onTagsKeyDown}
            />
            {tagsOpen && (
              <div id={menuId} role="listbox" className={styles.tagMenu}>
                {tagSuggestions.length === 0 ? (
                  <div className={`${styles.tagMenuItem} ${styles.tagMenuEmpty}`}>No suggestions</div>
                ) : (
                  tagSuggestions.map((s, k) => (
                    <button
                      type="button"
                      key={`sugg-${s}-${k}`}
                      className={`${styles.tagMenuItem} ${k === tagsHighlight ? styles.active : ""}`}
                      onMouseEnter={() => setTagsHighlight(k)}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        acceptTagSuggestion(s);
                      }}
                    >
                      {s}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </td>
      );
    }
    // Account (typeahead; users can add new)
    if (i === idx.Account || header === "Account") {
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
            {accountOptions.filter(Boolean).map((a, k) => (
              <option key={`acct-${a}-${k}`} value={a} />
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

        if (isEditing) return renderEditableCell(headerName, i);

        // Non-edit mode
        if (i === idx.Tags) return renderTagsDisplayCell(cell, i);

        const extraClass =
          i === idx.Date
            ? styles.dateCell
            : i === idx.Description
            ? styles.descriptionCell
            : "";

        return (
          <td key={i} className={`${styles.cell} ${extraClass}`}>
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

/* Tag chip colors use app theme first, then Bootstrap as fallback
   If pp-theme.css defines:
     --pp-chip-bg, --pp-chip-fg, --pp-chip-border, --pp-chip-hover,
     --pp-chip-remove, --pp-chip-remove-hover
   they will be used automatically. Otherwise Bootstrap vars adapt to light/dark. */
