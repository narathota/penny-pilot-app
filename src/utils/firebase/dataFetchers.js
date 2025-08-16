// FILE: src/utils/firebase/dataFetchers.js

import { getFirebase } from "./firebaseController";
import { COLLECTIONS } from "./collections";
import {
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
  limit,
  // orderBy, // add when you’re ready for sorted feeds
} from "firebase/firestore";

/* ------------------------------------------------------------------ */
/* Internals                                                          */
/* ------------------------------------------------------------------ */

function getDbOrThrow() {
  const { db, ready, reason } = getFirebase();
  if (!ready || !db) throw new Error(`Firebase not ready: ${reason || "no db"}`);
  return db;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function assertCollection(colName, label = "collection") {
  if (!colName || typeof colName !== "string") {
    throw new Error(`Invalid ${label} name`);
  }
  return colName;
}

function mapDocs(snap) {
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
}

/**
 * Generic: one-shot fetch by userEmail for any flat collection.
 * @param {string} colName - Firestore collection name
 * @param {string} userEmail
 * @param {{ cap?: number, extra?: any[] }} options
 */
export async function fetchByEmailOnce(colName, userEmail, { cap = 500, extra = [] } = {}) {
  const db = getDbOrThrow();
  const email = normalizeEmail(userEmail);
  assertCollection(colName);
  if (!email) throw new Error("fetchByEmailOnce: missing userEmail");

  const base = collection(db, colName);
  const q = query(base, where("userEmail", "==", email), ...(extra || []), limit(cap));
  const snap = await getDocs(q);
  return mapDocs(snap);
}

/**
 * Generic: subscribe by userEmail for any flat collection.
 * @param {{ colName: string, userEmail: string, cap?: number, extra?: any[], onData: Function, onError?: Function }} args
 * @returns {() => void} unsubscribe
 */
export function subscribeByEmail({ colName, userEmail, cap = 500, extra = [], onData, onError }) {
  const db = getDbOrThrow();
  const email = normalizeEmail(userEmail);
  assertCollection(colName);
  if (!email) throw new Error("subscribeByEmail: missing userEmail");
  if (typeof onData !== "function") throw new Error("subscribeByEmail: onData must be a function");

  const base = collection(db, colName);
  const q = query(base, where("userEmail", "==", email), ...(extra || []), limit(cap));

  return onSnapshot(
    q,
    (snap) => onData(mapDocs(snap)),
    (err) => onError?.(err)
  );
}

/* ------------------------------------------------------------------ */
/* System collections (read-only, non-tenant)                          */
/* ------------------------------------------------------------------ */

// ===================== CURRENCIES =====================
// Collection: pp_currency_list
export async function fetchCurrencyList() {
  const db = getDbOrThrow();
  const snap = await getDocs(collection(db, COLLECTIONS.systemCurrencyList));
  return snap.docs.map((d) => d.data() || {});
}

// ===================== TRANSACTION TYPES =====================
// Collection: pp_transaction_types
export async function fetchTransactionTypes() {
  const db = getDbOrThrow();
  const snap = await getDocs(collection(db, COLLECTIONS.systemTransactionTypes));
  return snap.docs.map((d) => d.data() || {}); // raw (back-compat)
}

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
// Collection: pp_account_types
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

/* ------------------------------------------------------------------ */
/* Tenant data (email-scoped wrappers)                                 */
/* ------------------------------------------------------------------ */
/** You can add orderBy/date indexing later by supplying `extra` constraints in these wrappers. */

// ---- Transactions ----
export function subscribeUserTransactions({ userEmail, cap = 500, onData, onError }) {
  const colName = COLLECTIONS?.userTransactions;
  if (!colName) throw new Error("subscribeUserTransactions: COLLECTIONS.userTransactions not defined");
  return subscribeByEmail({ colName, userEmail, cap, extra: [], onData, onError });
}

export function fetchUserTransactionsOnce(userEmail, opts) {
  const colName = COLLECTIONS?.userTransactions;
  if (!colName) throw new Error("fetchUserTransactionsOnce: COLLECTIONS.userTransactions not defined");
  return fetchByEmailOnce(colName, userEmail, opts);
}

// ---- Tags ----
export function subscribeUserTags({ userEmail, cap = 1000, onData, onError }) {
  const colName = COLLECTIONS?.userTags;
  if (!colName) throw new Error("subscribeUserTags: COLLECTIONS.userTags not defined");
  return subscribeByEmail({ colName, userEmail, cap, extra: [], onData, onError });
}

export function fetchUserTagsOnce(userEmail, opts) {
  const colName = COLLECTIONS?.userTags;
  if (!colName) throw new Error("fetchUserTagsOnce: COLLECTIONS.userTags not defined");
  return fetchByEmailOnce(colName, userEmail, opts);
}

// ---- Accounts ----
export function subscribeUserAccounts({ userEmail, cap = 500, onData, onError }) {
  const colName = COLLECTIONS?.userAccounts;
  if (!colName) throw new Error("subscribeUserAccounts: COLLECTIONS.userAccounts not defined");
  return subscribeByEmail({ colName, userEmail, cap, extra: [], onData, onError });
}

export function fetchUserAccountsOnce(userEmail, opts) {
  const colName = COLLECTIONS?.userAccounts;
  if (!colName) throw new Error("fetchUserAccountsOnce: COLLECTIONS.userAccounts not defined");
  return fetchByEmailOnce(colName, userEmail, opts);
}

// ---- Rules ----
export function subscribeUserRules({ userEmail, cap = 500, onData, onError }) {
  const colName = COLLECTIONS?.userRules;
  if (!colName) throw new Error("subscribeUserRules: COLLECTIONS.userRules not defined");
  return subscribeByEmail({ colName, userEmail, cap, extra: [], onData, onError });
}

export function fetchUserRulesOnce(userEmail, opts) {
  const colName = COLLECTIONS?.userRules;
  if (!colName) throw new Error("fetchUserRulesOnce: COLLECTIONS.userRules not defined");
  return fetchByEmailOnce(colName, userEmail, opts);
}

/* ------------------------------------------------------------------ */
/* Notes & future improvements                                         */
/* ------------------------------------------------------------------ */
/**
 * 1) Sorting & indexes:
 *    - When ready, add `orderBy("date","desc")` (or any other fields) to the
 *      `extra` array in the specific wrapper (e.g., subscribeUserTransactions).
 *    - Firestore will suggest a composite index; create it once, and you’re done.
 *
 * 2) Pagination:
 *    - Expose cursor-based helpers (startAfter/limit) here centrally:
 *        export function pageUserTransactions({ userEmail, pageSize, after }) { ... }
 *
 * 3) Type normalization:
 *    - If you want strong typing / normalization (e.g., convert timestamps),
 *      add a map step in the wrapper so components always receive normalized shapes.
 *
 * 4) Security rules (recommended):
 *    - Enforce tenant isolation at the DB level too, e.g.:
 *
 *      match /{colName}/{docId} where colName in [
 *        'user_accounts','user_tags','user_transactions','user_rules'
 *      ] {
 *        allow read, write: if request.auth != null
 *          && request.auth.token.email != null
 *          && request.resource.data.userEmail == request.auth.token.email.toLowerCase();
 *      }
 *
 *    - Keep client filtering + server rules aligned for defense-in-depth.
 */
