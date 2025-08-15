// FILE: src/utils/firebase/dataFetchers.js
import { getFirebase } from "./firebaseController";
import { COLLECTIONS } from "./collections";
import { collection, getDocs } from "firebase/firestore";

// Internal: get db or throw a helpful error
function getDbOrThrow() {
  const { db, ready, reason } = getFirebase();
  if (!ready || !db) throw new Error(`Firebase not ready: ${reason || "no db"}`);
  return db;
}

// ===================== CURRENCIES =====================
// Collection: pp_currency_list
// Expected fields per doc: { currencyName: string, symbol: string, code?: string }
export async function fetchCurrencyList() {
  const db = getDbOrThrow();
  const snap = await getDocs(collection(db, COLLECTIONS.systemCurrencyList));
  return snap.docs.map((d) => d.data() || {});
}

// ===================== TRANSACTION TYPES =====================
// Collection: pp_transaction_types
// Expected fields per doc: { name: string, symbol?: '+'|'-' }
export async function fetchTransactionTypes() {
  const db = getDbOrThrow();
  const snap = await getDocs(collection(db, COLLECTIONS.systemTransactionTypes));
  return snap.docs.map((d) => d.data() || {}); // raw (back-compat)
}

// Normalized helper (optional): { id, name, symbol }
export async function fetchTransactionTypesNormalized() {
  const raw = await fetchTransactionTypes();
  return raw
    .map((t) => ({
      id: t.id || t.name,
      name: String(t.name || t.id || "").trim(),
      symbol: t.symbol === "-" ? "-" : "+",
    }))
    .filter((t) => t.name);
}

// ===================== ACCOUNT TYPES (system) =====================
// Collection: pp_account_type
// Expected fields per doc: { name: string, desc?: string }
export async function fetchAccountTypes() {
  const db = getDbOrThrow();
  const snap = await getDocs(collection(db, COLLECTIONS.systemAccountTypes));
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() || {}) }))
    .map((t) => ({
      id: t.id,
      name: String(t.name || t.id || "").trim(),
      desc: String(t.desc || t.description || "").trim(),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
