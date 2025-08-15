// FILE: src/components/app/UploadDataComponent/ProcessedDataComponent/ProcessedDataComponent.jsx
import React from "react";
import styles from "./ProcessedDataComponent.module.css";

export default function ProcessedDataComponent({
  processed,
  accountTypes,
  accountMapping,
  onMapAccount,
  loadingTypes,
  jsonSummary,
  jsonExamples,
  canWrite,
  onWrite,
  writeState,
}) {
  const { accounts, tags, transactions, counts } = processed;

  return (
    <>
      {/* Accounts card */}
      <div className="card shadow-sm my-3">
        <div className="card-header fw-semibold">Accounts ({counts.accounts})</div>
        <div className="card-body">
          {!loadingTypes && accountTypes.length === 0 && (
            <div className="alert alert-warning py-2 small">
              No system account types found. Check collection <code>pp_account_type</code> and Firestore rules.
            </div>
          )}

          {accounts.length === 0 ? (
            <div className="text-muted">No accounts detected.</div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Account name</th>
                    <th>Currency</th>
                    <th style={{ width: 360 }}>Map to system account type</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((a) => {
                    const mapped = accountMapping[a.slug] || null;
                    return (
                      <tr key={a.slug}>
                        <td><code>{a.name}</code></td>
                        <td>{a.currencyCode || <span className="text-secondary">—</span>}</td>
                        <td>
                          <select
                            className="form-select form-select-sm"
                            value={mapped?.id || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              const obj = accountTypes.find((t) => t.id === val) || null;
                              onMapAccount(a.slug, obj);
                            }}
                          >
                            <option value="">{loadingTypes ? "Loading..." : "Select a type…"}</option>
                            {accountTypes.map((t) => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="small text-muted">
                          {mapped?.desc || <span className="text-secondary">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Tags card */}
      <div className="card shadow-sm mb-3">
        <div className="card-header fw-semibold">Tags ({counts.tags})</div>
        <div className="card-body">
          {tags.nodes.length === 0 ? (
            <div className="text-muted">No tags detected.</div>
          ) : (
            <>
              <div className="mb-3">
                <div className="fw-semibold">Unique Tag Nodes</div>
                <div className="small text-muted">Each tag is unique regardless of hierarchy.</div>
                <div className="mt-2">
                  {tags.nodes.map((n) => (
                    <span key={n.slug} className="badge text-bg-light me-2 mb-2">
                      <code>{n.name}</code>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="fw-semibold">Hierarchy Preview</div>
                <div className="small text-muted">Relationships preserved (parent → child).</div>
                <TagTree roots={tags.tree} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Transactions (preview) */}
      <div className="card shadow-sm mb-3">
        <div className="card-header fw-semibold">Transactions (sample)</div>
        <div className="card-body">
          {transactions.length === 0 ? (
            <div className="text-muted">No transactions detected.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-sm align-middle">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Account</th>
                    <th className="text-end">Amount</th>
                    <th>Leaf Tag</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 10).map((t, i) => (
                    <tr key={t.id || i}>
                      <td><code>{t.date}</code></td>
                      <td>{t.description}</td>
                      <td>{t.accountName}</td>
                      <td className="text-end">{t.amount}</td>
                      <td><code>{t.tagLeafId || "—"}</code></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* JSON summary (tabs + collapsible samples + scrollable previews) */}
      <div className="card shadow-sm mb-3">
        <div className="card-header d-flex align-items-center justify-content-between">
          <span className="fw-semibold">JSON summary (preview)</span>
        </div>
        <div className="card-body">
          <SummaryTabs jsonSummary={jsonSummary} jsonExamples={jsonExamples} />
        </div>
      </div>

      {/* Write button */}
      <div className="d-flex gap-2">
        <button className="btn btn-success" onClick={onWrite} disabled={!canWrite}>
          {writeState?.writing ? "Writing…" : `Write to Firebase (${counts.transactions})`}
        </button>
        {writeState?.writeMsg && (
          <div className="small text-secondary d-flex align-items-center">{writeState.writeMsg}</div>
        )}
      </div>
    </>
  );
}

function TagTree({ roots }) {
  if (!roots || roots.length === 0) return <div className="text-muted">No tags</div>;
  return (
    <ul className="mb-0">
      {roots.map((n) => (
        <li key={n.slug}>
          <code>{n.name}</code>
          {n.children?.length ? <TagTree roots={n.children} /> : null}
        </li>
      ))}
    </ul>
  );
}

function SummaryTabs({ jsonSummary, jsonExamples }) {
  const [tab, setTab] = React.useState("accounts");
  const ua = jsonSummary?.user_accounts || [];
  const ut = jsonSummary?.user_tags || [];
  const ux = jsonSummary?.user_transactions || [];

  const exampleAccounts = jsonExamples?.user_accounts || null;
  const exampleTags = jsonExamples?.user_tags || null;
  const exampleTx = jsonExamples?.user_transactions || null;

  const PREVIEW = 200; // first N rows per tab

  const dataFor = (key) => {
    switch (key) {
      case "accounts": return { all: ua, show: ua.slice(0, PREVIEW), example: exampleAccounts };
      case "tags": return { all: ut, show: ut.slice(0, PREVIEW), example: exampleTags };
      case "transactions": return { all: ux, show: ux.slice(0, PREVIEW), example: exampleTx };
      default: return { all: [], show: [], example: null };
    }
  };
  const { all, show, example } = dataFor(tab);

  return (
    <div>
      <div className={`nav nav-tabs ${styles.tabNav}`} role="tablist">
        <button className={`nav-link ${tab === "accounts" ? "active" : ""}`} onClick={() => setTab("accounts")} type="button">
          user_accounts <span className="text-muted">({ua.length})</span>
        </button>
        <button className={`nav-link ${tab === "tags" ? "active" : ""}`} onClick={() => setTab("tags")} type="button">
          user_tags <span className="text-muted">({ut.length})</span>
        </button>
        <button className={`nav-link ${tab === "transactions" ? "active" : ""}`} onClick={() => setTab("transactions")} type="button">
          user_transactions <span className="text-muted">({ux.length})</span>
        </button>
      </div>

      {/* Collapsible: full object example (no id fields) */}
      <CollapsibleSample
        title="Sample document (full shape)"
        json={example}
        emptyText="No sample available."
      />

      {/* Scrollable preview of trimmed info */}
      <div className={styles.jsonPane}>
        <div className="d-flex justify-content-between small text-secondary mb-2">
          <span>Showing {show.length} of {all.length}</span>
        </div>
        <JsonPretty className={`${styles.jsonPre} small mb-0`} value={show} />
      </div>
    </div>
  );
}

function CollapsibleSample({ title, json, emptyText = "No content." }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className={styles.collapseCard}>
      <button
        type="button"
        className={styles.collapseHeader}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="sample-json"
      >
        <span className={styles.chevron} data-open={open ? "1" : "0"}>▸</span>
        <span className="fw-semibold">{title}</span>
        <span className="ms-auto small text-secondary">{open ? "Hide" : "Show"}</span>
      </button>
      {open && (
        <div className={styles.collapseBody} id="sample-json">
          {json ? (
            <JsonPretty className={`${styles.jsonPre} small mb-0`} value={json} />
          ) : (
            <pre className={`${styles.jsonPre} small mb-0`}>{emptyText}</pre>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* JSON pretty renderer (DOM-based, no innerHTML)                      */
/* ------------------------------------------------------------------ */

function JsonPretty({ value, className = "" }) {
  return (
    <pre className={className}>
      <JsonNode value={value} />
    </pre>
  );
}

function JsonNode({ value, depth = 0, isLast = true }) {
  const indent = "  ".repeat(depth);
  const nextIndent = "  ".repeat(depth + 1);

  if (value === null) {
    return <span className="jsonNull">null</span>;
  }
  const t = typeof value;
  if (t === "string") {
    return <span className="jsonString">{JSON.stringify(value)}</span>;
  }
  if (t === "number") {
    return <span className="jsonNumber">{String(value)}</span>;
  }
  if (t === "boolean") {
    return <span className="jsonBoolean">{value ? "true" : "false"}</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return <span>[]</span>;
    return (
      <>
        [{"\n"}
        {value.map((v, i) => (
          <React.Fragment key={i}>
            {nextIndent}
            <JsonNode value={v} depth={depth + 1} isLast={i === value.length - 1} />
            {i === value.length - 1 ? "" : ","}
            {"\n"}
          </React.Fragment>
        ))}
        {indent}]
      </>
    );
  }

  // object
  const keys = Object.keys(value || {});
  if (keys.length === 0) return <span>{{} && "{}"}</span>; // show {}

  return (
    <>
      {"{"}{"\n"}
      {keys.map((k, i) => (
        <React.Fragment key={k}>
          {nextIndent}
          <span className="jsonKey">{JSON.stringify(k)}</span>
          {": "}
          <JsonNode value={value[k]} depth={depth + 1} isLast={i === keys.length - 1} />
          {i === keys.length - 1 ? "" : ","}
          {"\n"}
        </React.Fragment>
      ))}
      {indent}{"}"}
    </>
  );
}
