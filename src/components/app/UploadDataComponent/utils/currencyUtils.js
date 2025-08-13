import { getFirebase } from '../../../../utils/firebase/firebaseController';
import { getFirestore, collection, getDocs } from "firebase/firestore";

export async function fetchCurrencyList() {
  const app = getFirebase();
  const firestore = getFirestore(app);
  const colRef = collection(firestore, "pp_currency_list");
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map(doc => doc.data());
}
