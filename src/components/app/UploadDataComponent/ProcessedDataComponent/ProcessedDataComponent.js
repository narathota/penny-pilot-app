// FILE: src/components/app/UploadDataComponent/ProcessedDataComponent/ProcessedDataComponent.jsx
import React from "react";
import styles from "./ProcessedDataComponent.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWandMagicSparkles } from "@fortawesome/free-solid-svg-icons";

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

  // ------------------------ Auto-map helpers ------------------------
  const norm = React.useCallback((s) => {
    return String(s || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }, []);

  const ALIAS_GROUPS = React.useMemo(
    () => [
      ["checking", "chequing", "current"],
      ["savings", "save", "hisave", "high interest", "highinterest"],
      ["credit card", "credit", "visa", "mastercard", "mc", "amex", "american express"],
      ["cash", "wallet"],
      ["loan", "personal loan", "student loan", "auto loan", "car loan"],
      ["mortgage", "home loan"],
      ["investment", "brokerage", "tfsa", "rrsp", "401k", "ira", "stocks"],
    ],
    []
  );

  const typeIndex = React.useMemo(() => {
    return (accountTypes || []).map((t) => {
      const name = t?.name || t?.id || "";
      const idStr = t?.id || "";
      const combined = `${name} ${idStr}`;
      const n = norm(combined);
      const tokens = n.split(" ").filter(Boolean);
      const head = tokens[0] || "";
      const groups = ALIAS_GROUPS.map((group, gi) => {
        const hit = group.some((alias) => n.includes(norm(alias)));
        return hit ? gi : -1;
      }).filter((gi) => gi >= 0);
      return { t, n, tokens, head, groups };
    });
  }, [accountTypes, norm, ALIAS_GROUPS]);

  const scoreTypeForAccount = React.useCallback(
    (accName, typeRec) => {
      const a = norm(accName);
      if (!a) return 0;
      const aTokens = a.split(" ").filter(Boolean);
      const aHead = aTokens[0] || "";

      let score = 0;

      // Head prefix overlap
      if (aHead && typeRec.head) {
        if (typeRec.head.startsWith(aHead) || aHead.startsWith(typeRec.head)) {
          score += 5;
        } else {
          const ah3 = aHead.slice(0, 3);
          const th3 = typeRec.head.slice(0, 3);
          if (ah3 && th3 && ah3 === th3) score += 2;
        }
      }

      // Substring containment
      if (aHead && typeRec.n.includes(aHead)) score += 2;
      if (typeRec.head && a.includes(typeRec.head)) score += 2;

      // Alias group overlap
      for (const gi of typeRec.groups) {
        const group = ALIAS_GROUPS[gi];
        if (group.some((alias) => a.includes(norm(alias)))) {
          score += 4;
        }
      }

      // Token overlaps (cap at 3)
      const shared = typeRec.tokens.filter((t) => aTokens.includes(t)).length;
      score += Math.min(shared, 3);

      return score;
    },
    [norm, ALIAS_GROUPS]
  );

  const guessTypeForAccount = React.useCallback(
    (accName) => {
      if (!typeIndex.length) return null;
      let best = null;
      let bestScore = 0;
      for (const rec of typeIndex) {
        const s = scoreTypeForAccount(accName, rec);
        if (s > bestScore) {
          bestScore = s;
          best = rec.t;
        }
      }
      return bestScore >= 5 ? best : null;
    },
    [typeIndex, scoreTypeForAccount]
  );

  const autoFilledRef = React.useRef(new Set());
  const attemptedRef = React.useRef(new Set());

  React.useEffect(() => {
    if (!accounts?.length || !accountTypes?.length) return;

    for (const acc of accounts) {
      const slug = acc.slug;
      if (accountMapping?.[slug]?.id) continue;
      if (attemptedRef.current.has(slug)) continue;

      const suggestion = guessTypeForAccount(acc.name);
      attemptedRef.current.add(slug);

      if (suggestion) {
        autoFilledRef.current.add(slug);
        onMapAccount?.(slug, suggestion);
      }
    }
  }, [accounts, accountTypes, accountMapping, guessTypeForAccount, onMapAccount]);

  // ------------------------ Write success → show + redirect ------------------------
  const [justWrote, setJustWrote] = React.useState(false);

  React.useEffect(() => {
    if (!writeState) return;
    const done = !writeState.writing && /done/i.test(writeState.writeMsg || "");
    if (done) {
      setJustWrote(true);
      const t = setTimeout(() => {
        window.location.assign("/app/dashboard");
      }, 1200);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [writeState]);

  // ------------------------ Render helpers ------------------------

  // Strip disallowed keys (like id, userId) from example JSON before rendering
  const stripKeys = React.useCallback((val, deny = ["id", "userId"]) => {
    if (Array.isArray(val)) return val.map((v) => stripKeys(v, deny));
    if (val && typeof val === "object") {
      const out = {};
      for (const k of Object.keys(val)) {
        if (deny.includes(k)) continue;
        out[k] = stripKeys(val[k], deny);
      }
      return out;
    }
    return val;
  }, []);

  return (
    <>
      {/* Accounts card */}
      <div className="card shadow-sm my-3">
        <div className="card-header fw-semibold d-flex align-items-center gap-2">
          <span>Accounts ({counts.accounts})</span>
          <span className="small text-secondary">
            (auto-suggests a type from name; please review)
          </span>
        </div>
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
                    const wasSuggested = autoFilledRef.current.has(a.slug);
                    return (
                      <tr key={a.slug}>
                        <td>
                          <code>{a.name}</code>
                          {wasSuggested && (
                            <FontAwesomeIcon
                              icon={faWandMagicSparkles}
                              className="ms-2"
                              title="Auto-suggested"
                              style={{ opacity: 0.7 }}
                            />
                          )}
                        </td>
                        <td>{a.currencyCode || <span className="text-secondary">—</span>}</td>
                        <td>
                          <select
                            className="form-select form-select-sm"
                            value={mapped?.id || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              const obj = accountTypes.find((t) => t.id === val) || null;
                              autoFilledRef.current.delete(a.slug);
                              onMapAccount(a.slug, obj);
                            }}
                          >
                            <option value="">{loadingTypes ? "Loading..." : "Select a type…"}</option>
                            {accountTypes.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name}
                              </option>
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
                      <td>
                        <code>{t.date}</code>
                      </td>
                      <td>{t.description}</td>
                      <td>{t.accountName}</td>
                      <td className="text-end">{t.amount}</td>
                      <td>
                        <code>{t.tagLeafId || "—"}</code>
                      </td>
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
          <SummaryTabs
            jsonSummary={jsonSummary}
            jsonExamples={{
              user_accounts: stripKeys(jsonExamples?.user_accounts),
              user_tags: stripKeys(jsonExamples?.user_tags),
              user_transactions: stripKeys(jsonExamples?.user_transactions),
            }}
          />
        </div>
      </div>

      {/* Write + status */}
      <div className="d-flex gap-2 align-items-center">
        <button className="btn btn-success" onClick={onWrite} disabled={!canWrite}>
          {writeState?.writing ? "Writing…" : `Write to Firebase (${counts.transactions})`}
        </button>
        {writeState?.writeMsg && (
          <div className="small text-secondary">{writeState.writeMsg}</div>
        )}
      </div>

      {justWrote && (
        <div className="alert alert-success d-inline-flex align-items-center gap-2 mt-3 py-2">
          <span className="fw-semibold">Import complete.</span>
          <span className="small">Redirecting to your dashboard…</span>
        </div>
      )}
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

  const PREVIEW = 200;

  const dataFor = (key) => {
    switch (key) {
      case "accounts":
        return { all: ua, show: ua.slice(0, PREVIEW), example: exampleAccounts };
      case "tags":
        return { all: ut, show: ut.slice(0, PREVIEW), example: exampleTags };
      case "transactions":
        return { all: ux, show: ux.slice(0, PREVIEW), example: exampleTx };
      default:
        return { all: [], show: [], example: null };
    }
  };
  const { all, show, example } = dataFor(tab);

  return (
    <div>
      <div className={`nav nav-tabs ${styles.tabNav}`} role="tablist">
        <button
          className={`nav-link ${tab === "accounts" ? "active" : ""}`}
          onClick={() => setTab("accounts")}
          type="button"
        >
          user_accounts <span className="text-muted">({ua.length})</span>
        </button>
        <button
          className={`nav-link ${tab === "tags" ? "active" : ""}`}
          onClick={() => setTab("tags")}
          type="button"
        >
          user_tags <span className="text-muted">({ut.length})</span>
        </button>
        <button
          className={`nav-link ${tab === "transactions" ? "active" : ""}`}
          onClick={() => setTab("transactions")}
          type="button"
        >
          user_transactions <span className="text-muted">({ux.length})</span>
        </button>
      </div>

      {/* Collapsible: full object example (id/userId stripped) */}
      <CollapsibleSample
        title="Sample document (full shape)"
        json={example}
        emptyText="No sample available."
      />

      {/* Scrollable preview of trimmed info */}
      <div className={styles.jsonPane}>
        <div className="d-flex justify-content-between small text-secondary mb-2">
          <span>
            Showing {show.length} of {all.length}
          </span>
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
        <span className={styles.chevron} data-open={open ? "1" : "0"}>
          ▸
        </span>
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

function JsonNode({ value, depth = 0 }) {
  const indent = "  ".repeat(depth);
  const nextIndent = "  ".repeat(depth + 1);

  if (value === null) return <span className="jsonNull">null</span>;

  const t = typeof value;
  if (t === "string") return <span className="jsonString">{JSON.stringify(value)}</span>;
  if (t === "number") return <span className="jsonNumber">{String(value)}</span>;
  if (t === "boolean") return <span className="jsonBoolean">{value ? "true" : "false"}</span>;

  if (Array.isArray(value)) {
    if (value.length === 0) return <span>[]</span>;
    return (
      <>
        [{"\n"}
        {value.map((v, i) => (
          <React.Fragment key={i}>
            {nextIndent}
            <JsonNode value={v} depth={depth + 1} />
            {i === value.length - 1 ? "" : ","}
            {"\n"}
          </React.Fragment>
        ))}
        {indent}]
      </>
    );
  }

  const keys = Object.keys(value || {});
  if (keys.length === 0) return <span>{{} && "{}"}</span>;

  return (
    <>
      {"{"}
      {"\n"}
      {keys.map((k, i) => (
        <React.Fragment key={k}>
          {nextIndent}
          <span className="jsonKey">{JSON.stringify(k)}</span>
          {": "}
          <JsonNode value={value[k]} depth={depth + 1} />
          {i === keys.length - 1 ? "" : ","}
          {"\n"}
        </React.Fragment>
      ))}
      {indent}
      {"}"}
    </>
  );
}
