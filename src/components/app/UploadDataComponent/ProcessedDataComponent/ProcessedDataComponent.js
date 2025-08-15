// FILE: src/components/app/UploadDataComponent/ProcessedDataComponent.jsx
import React from "react";

export default function ProcessedDataComponent({
  processed,
  accountTypes,
  accountMapping,
  onMapAccount,
  loadingTypes,
  jsonSummary,
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
          {accounts.length === 0 ? (
            <div className="text-muted">No accounts detected.</div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Account name</th>
                    <th>Currency</th>
                    <th style={{ width: 340 }}>Map to system account type</th>
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

      {/* JSON summary */}
      <div className="card shadow-sm mb-3">
        <div className="card-header fw-semibold">JSON summary (preview)</div>
        <div className="card-body">
          <pre className="small mb-0" style={{ whiteSpace: "pre-wrap" }}>
            {JSON.stringify(jsonSummary, null, 2)}
          </pre>
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
