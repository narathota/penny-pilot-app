// FILE: src/utils/firebase/dataWriters.js
import { getFirebase } from "./firebaseController";
import { COLLECTIONS, userScopedId } from "./collections";
import { collection, doc, writeBatch, serverTimestamp } from "firebase/firestore";

// Internal: get db or throw a helpful error
function getDbOrThrow() {
  const { db, ready, reason } = getFirebase();
  if (!ready || !db) throw new Error(`Firebase not ready: ${reason || "no db"}`);
  return db;
}

/**
 * Writes processed data in three phases: accounts → tags → transactions.
 * @param {{ processed: any, accountMapping: Record<string,{id:string,name?:string,desc?:string}>, user: {uid:string,email?:string}, status?: (msg:string)=>void }} args
 */
export async function writeProcessedData({ processed, accountMapping, user, status = () => {} }) {
  if (!processed) throw new Error("Nothing to write.");
  if (!user?.uid) throw new Error("Not signed in.");

  const db = getDbOrThrow();
  const uid = user.uid;
  const email = (user.email || "").toLowerCase();

  // ---------- Phase A: user_accounts ----------
  status("Writing accounts…");
  {
    const batch = writeBatch(db);
    for (const acc of processed.accounts) {
      const m = accountMapping[acc.slug];
      if (!m?.id) throw new Error(`Unmapped account: ${acc.name}`);
      const ref = doc(collection(db, COLLECTIONS.userAccounts), userScopedId(uid, acc.slug));
      batch.set(
        ref,
        {
          userId: uid,
          userEmail: email,
          name: acc.name,
          slug: acc.slug,
          currencyCode: acc.currencyCode || null,
          systemTypeId: m.id,
          systemTypeName: m.name || m.id,
          systemTypeDesc: m.desc || "",
          source: "csv-upload",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
    await batch.commit();
  }

  // ---------- Phase B: user_tags ----------
  status("Writing tags…");
  {
    const batch = writeBatch(db);
    for (const t of processed.tags.nodes) {
      const ref = doc(collection(db, COLLECTIONS.userTags), userScopedId(uid, t.slug));
      batch.set(
        ref,
        {
          userId: uid,
          userEmail: email,
          name: t.name,
          slug: t.slug,
          parentSlug: t.parentSlug || null,
          ancestors: t.ancestors || [],
          depth: t.depth || 1,
          source: "csv-upload",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
    await batch.commit();
  }

  // ---------- Phase C: user_transactions (chunked) ----------
  status("Writing transactions…");
  {
    const BATCH = 400;
    for (let i = 0; i < processed.transactions.length; i += BATCH) {
      const batch = writeBatch(db);
      const slice = processed.transactions.slice(i, i + BATCH);
      for (const tx of slice) {
        const base = tx.id
          ? String(tx.id)
          : `${tx.date}|${tx.description}|${tx.amount}|${tx.accountName}`;
        const ref = doc(
          collection(db, COLLECTIONS.userTransactions),
          userScopedId(uid, base.toLowerCase())
        );
        batch.set(
          ref,
          {
            ...tx,
            userId: uid,
            userEmail: email,
            source: "csv-upload",
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
      await batch.commit();
    }
  }

  status("Done.");
  return {
    accounts: processed.accounts.length,
    tags: processed.tags.nodes.length,
    transactions: processed.transactions.length,
  };
}
