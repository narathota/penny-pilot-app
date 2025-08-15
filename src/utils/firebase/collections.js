// FILE: src/utils/firebase/collections.js

/**
 * Centralized Firestore collection names for Pocket Penny.
 * If you rename a collection, change it here and nowhere else.
 */
export const COLLECTIONS = {
    userAccounts: "user_accounts",           // per-user accounts
    userTags: "user_tags",                   // per-user unique tags with hierarchy
    userTransactions: "user_transactions",   // per-user transactions
    systemAppUsers: "pp_app_users",     // global: system app users
    systemAccountTypes: "pp_account_types",   // global: account types (id, name, desc)
    systemTransactionTypes: "pp_transaction_types", // global: txn types (name, symbol)
    systemCurrencyList: "pp_currency_list", // global: app currency list
  };
  
  /** Compose a per-user doc id so reimports don't duplicate. */
  export const userScopedId = (uid, slugOrId) => `${uid}:${slugOrId}`;
  
  /** Stable slug used for account/tag ids. */
  export const slugify = (s) => String(s ?? "")
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9 _.-]/g, "")
    .replace(/[ .]+/g, "-")
    .replace(/-+/g, "-");
  