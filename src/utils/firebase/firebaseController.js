
import { initializeApp } from "firebase/app";
import { getFirestore, addDoc, collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Firebase configuration from environment variables
const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- Firestore Utility Functions ---


/**
 * Fetches real-time data from a Firestore collection.
 * @param {string} collectionName - Name of the Firestore collection.
 * @param {function} setDataCallback - Callback to set data in state.
 * @param {string|null} orderByField - Field to order by (optional).
 * @param {string|null} filterByField - Field to filter by (optional, expects boolean true).
 * @returns {function} Unsubscribe function for the snapshot listener.
 */
export const fetchFirestoreData = (collectionName, setDataCallback, orderByField = null, filterByField = null) => {
    let dataQuery = collection(db, collectionName);
    if (orderByField) {
        dataQuery = query(dataQuery, orderBy(orderByField));
    }
    return onSnapshot(
        dataQuery,
        (snapshot) => {
            const data = snapshot.docs
                .map((doc) => ({ id: doc.id, ...doc.data() }))
                .filter((item) => (filterByField ? item[filterByField] === true : true));
            setDataCallback(data);
        },
        (error) => {
            console.error(`Firestore Error [${collectionName}]:`, error);
        }
    );
};

/**
 * Uploads an array of data to a Firestore collection.
 * @param {string} collectionName - Name of the Firestore collection.
 * @param {Array<Object>} data - Array of objects to upload.
 */
export const uploadCSVDataToFirestore = async (collectionName, data) => {
    try {
        const collectionRef = collection(db, collectionName);
        await Promise.all(data.map((item) => addDoc(collectionRef, item)));
        console.log(`✅ Data successfully uploaded to Firestore (${collectionName}).`);
    } catch (error) {
        console.error("🔥 Firestore Upload Error:", error);
        throw error;
    }
};

// --- Export Firebase App, Auth, and DB ---
export { app, db, auth };