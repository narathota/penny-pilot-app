// FILE: src/components/app/UploadDataComponent/ProcessingDataComponent.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { getFirebase, onAuthChangedSafe } from "../../../../utils/firebase/firebaseController";
import { fetchAccountTypes } from "../../../../utils/firebase/dataFetchers";
import { writeProcessedData } from "../../../../utils/firebase/dataWriters";
import { userScopedId } from "../../../../utils/firebase/collections";
import { processUploadedData } from "../utils/processUploadedData";
import ProcessedDataComponent from "../ProcessedDataComponent/ProcessedDataComponent";

export default function ProcessingDataComponent({ headers, rows }) {
  const [{ db, auth }, setFb] = useState({ db: null, auth: null });
  const [user, setUser] = useState(null);

  const [accountTypes, setAccountTypes] = useState([]); // [{id, name, desc}]
  const [loadingTypes, setLoadingTypes] = useState(false);

  const [processed, setProcessed] = useState(null);
  const [accountMapping, setAccountMapping] = useState({});

  const [writing, setWriting] = useState(false);
  const [writeMsg, setWriteMsg] = useState("");

  // init firebase + auth observer
  useEffect(() => {
    const { db, auth } = getFirebase();
    setFb({ db, auth });
    const unsub = onAuthChangedSafe((u) => setUser(u));
    return () => unsub && unsub();
  }, []);

  const canProcess = useMemo(() => headers?.length && rows?.length, [headers, rows]);

  const handleProcess = useCallback(() => {
    const out = processUploadedData({ headers, rows, user });
    setProcessed(out);
    const map = {};
    for (const acc of out.accounts) map[acc.slug] = null;
    setAccountMapping(map);
  }, [headers, rows, user]);

  // Load system account types (don’t gate on local db state; fetcher will handle readiness)
  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoadingTypes(true);
      try {
        const types = await fetchAccountTypes();
        if (!ignore) setAccountTypes(types);
        if (!types.length) {
          console.warn("[ProcessingData] No system account types found in collection 'pp_account_type'.");
        }
      } catch (e) {
        console.error("[ProcessingData] Failed to fetch account types:", e);
      } finally {
        if (!ignore) setLoadingTypes(false);
      }
    })();
    return () => { ignore = true; };
  }, []);

  const allAccountsMapped = useMemo(() => {
    if (!processed) return false;
    return processed.accounts.every((acc) => !!accountMapping[acc.slug]?.id);
  }, [processed, accountMapping]);

  const writeAll = useCallback(async () => {
    if (!user || !processed) return;
    setWriting(true);
    setWriteMsg("Starting…");
    try {
      await writeProcessedData({
        processed,
        accountMapping,
        user,
        status: (msg) => setWriteMsg(msg),
      });
      setWriteMsg("Done.");
    } catch (e) {
      setWriteMsg(e?.message || "Failed.");
    } finally {
      setWriting(false);
    }
  }, [user, processed, accountMapping]);

  return (
    <div className="mt-3">
      <button
        type="button"
        className="btn btn-primary"
        onClick={handleProcess}
        disabled={!canProcess || !user}
        title={!user ? "Please sign in first" : "Analyze current table data"}
      >
        Process uploaded data
      </button>

      {processed && (
        <ProcessedDataComponent
          processed={processed}
          accountTypes={accountTypes}
          accountMapping={accountMapping}
          onMapAccount={(slug, typeObj) => setAccountMapping((m) => ({ ...m, [slug]: typeObj }))}
          loadingTypes={loadingTypes}
          jsonSummary={{
            // trimmed previews (no id)
            user_accounts: processed.accounts.map((a) => ({
              name: a.name,
              currencyCode: a.currencyCode,
              systemTypeId: accountMapping[a.slug]?.id ?? null,
            })),
            user_tags: processed.tags.nodes.map((t) => ({
              name: t.name,
              parentSlug: t.parentSlug ?? null,
            })),
            user_transactions: processed.transactions.map((tx) => ({
              date: tx.date,
              amount: tx.amount,
              accountName: tx.accountName,
              accountId: tx.accountId,
              tagLeafId: tx.tagLeafId,
            })),
          }}
          canWrite={allAccountsMapped && !writing}
          onWrite={writeAll}
          writeState={{ writing, writeMsg }}
        />
      )}
    </div>
  );
}
