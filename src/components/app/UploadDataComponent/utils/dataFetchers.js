import { getFirebase } from "../../../../utils/firebase/firebaseController";
import { getFirestore, collection, getDocs } from "firebase/firestore";

// CURRENCIES
// Collection: pp_currency_list
// Expected fields per doc: { currencyName: string, symbol: string, code?: string }
export async function fetchCurrencyList() {
  const { app } = getFirebase(); // Fixed: Destructuring to get the 'app' instance
  if (!app) {
    console.error("Firebase app not initialized. Cannot fetch currency list.");
    return [];
  }
  const firestore = getFirestore(app);
  const colRef = collection(firestore, "pp_currency_list");
  const snapshot = await getDocs(colRef);

  // Return array of plain objects; tolerate varied shapes
  return snapshot.docs.map((doc) => {
    return doc.data() || {};;
  });
}

// TRANSACTION TYPES
// Collection: pp_transaction_types
// Expected fields per doc: { name: string }
export async function fetchTransactionTypes() {
  const { app } = getFirebase(); // Fixed: Destructuring to get the 'app' instance
  if (!app) {
    console.error("Firebase app not initialized. Cannot fetch transaction types.");
    return [];
  }
  const firestore = getFirestore(app);
  const colRef = collection(firestore, "pp_transaction_types");
  const snapshot = await getDocs(colRef);

  return snapshot.docs.map((doc) => {
    return doc.data() || {};
  });
}