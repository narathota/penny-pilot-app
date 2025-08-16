import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import styles from "./TransactionsBaseComponent.module.css";
import Spinner from "../../../common/Spinner/Spinner";

import { useAuth } from "../../../../context/AuthContext";
import { COLLECTIONS } from "../../../../utils/firebase/collections";
import { subscribeUserTransactions } from "../../../../utils/firebase/dataFetchers";

const TransactionsBaseComponent = () => {
  const { user } = useAuth();
  const location = useLocation();

  const [state, setState] = useState({
    loading: true,
    error: null,
    data: [],
    missing: false,
  });

  useEffect(() => {
    // Ensure the collection key exists in the centralized map
    if (!COLLECTIONS?.userTransactions) {
      setState({ loading: false, error: null, data: [], missing: true });
      return;
    }

    const email = (user?.email || "").trim();
    if (!email) {
      setState({ loading: false, error: new Error("No user email."), data: [], missing: false });
      return;
    }

    setState({ loading: true, error: null, data: [], missing: false });

    let unsub = () => {};
    try {
      unsub = subscribeUserTransactions({
        userEmail: email,
        cap: 500,
        onData: (rows) => setState({ loading: false, error: null, data: rows, missing: false }),
        onError: (err) => setState({ loading: false, error: err, data: [], missing: false }),
      });
    } catch (err) {
      // In case dataFetchers throws (e.g., Firebase not ready)
      setState({ loading: false, error: err, data: [], missing: false });
    }

    // Re-subscribe when the route is triggered (sidebar click -> new location.key)
    return () => unsub();
  }, [user?.email, location.key]);

  // ---- UI states ----
  if (state.missing) {
    return (
      <div className={`${styles.TransactionsBaseComponent} container-fluid py-3`}>
        <h1 className="h4 mb-3">Transactions</h1>
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <span className="badge text-bg-secondary mb-2">In progress</span>
            <div className="text-muted">
              <code>COLLECTIONS.userTransactions</code> is not defined. Add it in{" "}
              <code>src/utils/firebase/collections.js</code>.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state.loading) {
    return (
      <div className={`${styles.TransactionsBaseComponent} container-fluid py-5 d-flex justify-content-center`}>
        <Spinner label="Loading transactions..." />
      </div>
    );
  }

  if (state.error) {
    return (
      <div className={`${styles.TransactionsBaseComponent} container-fluid py-3`}>
        <h1 className="h4 mb-3">Transactions</h1>
        <div className="alert alert-danger" role="alert">
          <strong>Failed to load transactions.</strong>
          <div className="small mt-1">{state.error.message}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.TransactionsBaseComponent} container-fluid py-3`}>
      <h1 className="h4 mb-3">Transactions</h1>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {state.data.length === 0 ? (
            <div className="p-3 text-muted">No transactions yet.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped mb-0">
                <thead className="table-light">
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Description</th>
                    <th scope="col" className="text-end">Amount</th>
                    <th scope="col">Account</th>
                  </tr>
                </thead>
                <tbody>
                  {state.data.map((tx) => (
                    <tr key={tx.id}>
                      <td>{formatDate(tx.date)}</td>
                      <td>{tx.description || tx.merchant || "—"}</td>
                      <td className="text-end">{formatAmount(tx.amount, tx.currencyCode)}</td>
                      <td>{tx.accountName || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ---------- helpers (ui-only) ---------- */
function formatDate(v) {
  if (!v) return "—";
  try {
    // v could be ISO string, millis, or firestore timestamp with .seconds
    const d =
      typeof v === "object" && v?.seconds
        ? new Date(v.seconds * 1000)
        : new Date(v);
    const s = d.toISOString().slice(0, 10); // YYYY-MM-DD
    return isNaN(d.getTime()) ? "—" : s;
  } catch {
    return "—";
  }
}

function formatAmount(n, currencyCode) {
  const num = typeof n === "number" ? n : parseFloat(n);
  if (isNaN(num)) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: currencyCode ? "currency" : "decimal",
      currency: currencyCode || undefined,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return num.toFixed(2);
  }
}

export default TransactionsBaseComponent;
