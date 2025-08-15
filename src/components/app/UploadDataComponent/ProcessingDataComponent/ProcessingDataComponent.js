// FILE: src/components/app/UploadDataComponent/ProcessingDataComponent.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { getFirebase, onAuthChangedSafe } from "../../../../utils/firebase/firebaseController";
import { fetchAccountTypes } from "../../../../utils/firebase/dataFetchers";
import { writeProcessedData } from "../../../../utils/firebase/dataWriters";
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

  // Load system account types
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

  // -------- Build JSON previews (trimmed) and samples (full shapes w/o `id`) --------
  const uid = user?.uid || "nouid";
  const email = (user?.email || "").toLowerCase();

  const jsonSummary = useMemo(() => {
    if (!processed) return null;
    return {
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
    };
  }, [processed, accountMapping]);

  const jsonExamples = useMemo(() => {
    if (!processed) return null;

    // Accounts example (NO id field)
    const a0 = processed.accounts[0] || null;
    const a0Map = a0 ? accountMapping[a0.slug] : null;
    const accountExample = a0 ? {
      userId: uid,
      userEmail: email,
      name: a0.name,
      slug: a0.slug,
      currencyCode: a0.currencyCode || null,
      systemTypeId: a0Map?.id || "asset.cash",      // placeholder if unmapped
      systemTypeName: a0Map?.name || "Cash",        // placeholder if unmapped
      systemTypeDesc: a0Map?.desc || "Cash and cash equivalents.",
      createdAt: "<serverTimestamp>",
      updatedAt: "<serverTimestamp>",
      source: "csv-upload",
    } : null;

    // Tags example (NO id field)
    const t0 = processed.tags.nodes[0] || null;
    const tagExample = t0 ? {
      userId: uid,
      userEmail: email,
      name: t0.name,
      slug: t0.slug,
      parentSlug: t0.parentSlug || null,
      ancestors: t0.ancestors || [],
      depth: t0.depth || 1,
      children: Array.isArray(t0.children) ? t0.children : [],
      createdAt: "<serverTimestamp>",
      updatedAt: "<serverTimestamp>",
      source: "csv-upload",
    } : null;

    // Transactions example (NO id field)
    const x0 = processed.transactions[0] || null;
    const txSymbol = x0 ? (Number(x0.amount) >= 0 ? "+" : "-") : "+";
    const txExample = x0 ? {
      userId: uid,
      userEmail: email,
      date: x0.date,
      description: x0.description,
      currencyCode: x0.currencyCode,
      type: x0.typeName,
      typeSymbol: txSymbol,                        // ideally from pp_transaction_types
      accountName: x0.accountName,
      accountId: `${uid}:${x0.accountId}`,         // FK to user_accounts (uid + slug)
      amount: x0.amount,
      tagPath: x0.tagPath,
      tagPathIds: x0.tagPathIds,
      tagLeafId: x0.tagLeafId,
      tagAncestorIds: x0.tagAncestorIds,
      source: "csv-upload",
      sourceRowIndex: x0.sourceRowIndex,
      createdAt: "<serverTimestamp>",
    } : null;

    return {
      user_accounts: accountExample,
      user_tags: tagExample,
      user_transactions: txExample,
    };
  }, [processed, accountMapping, uid, email]);

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
          jsonSummary={jsonSummary}
          jsonExamples={jsonExamples}
          canWrite={allAccountsMapped && !writing}
          onWrite={writeAll}
          writeState={{ writing, writeMsg }}
        />
      )}
    </div>
  );
}
