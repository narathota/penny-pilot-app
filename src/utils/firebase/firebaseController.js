// FILE: src/utils/firebase/firebaseController.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

let _app = null;
let _db = null;
let _auth = null;
let _ready = false;
let _reason = "";

function env(name) {
  return process.env[name];
}

function validateEnv() {
  const needed = [
    "REACT_APP_FIREBASE_API_KEY",
    "REACT_APP_FIREBASE_AUTH_DOMAIN",
    "REACT_APP_FIREBASE_PROJECT_ID",
    "REACT_APP_FIREBASE_STORAGE_BUCKET",
    "REACT_APP_FIREBASE_MESSAGING_SENDER_ID",
    "REACT_APP_FIREBASE_APP_ID",
  ];

  const missing = needed.filter((k) => !env(k));
  if (missing.length) {
    _reason = `Missing env vars: ${missing.join(", ")}`;
    return false;
  }

  const key = env("REACT_APP_FIREBASE_API_KEY");
  // Quick sanity check; real keys start with AIza and length ~39
  const looksRight = typeof key === "string" && /^AIza[0-9A-Za-z_\-]{35}$/.test(key);
  if (!looksRight) {
    _reason = "Invalid REACT_APP_FIREBASE_API_KEY format (looks missing or placeholder).";
    return false;
  }
  return true;
}

export function getFirebase() {
  if (_ready) return { app: _app, db: _db, auth: _auth, ready: true };

  if (!validateEnv()) {
    console.warn(`[PocketPenny] Firebase not ready: ${_reason}`);
    return { ready: false, reason: _reason };
  }

  const firebaseConfig = {
    apiKey: env("REACT_APP_FIREBASE_API_KEY"),
    authDomain: env("REACT_APP_FIREBASE_AUTH_DOMAIN"),
    projectId: env("REACT_APP_FIREBASE_PROJECT_ID"),
    storageBucket: env("REACT_APP_FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: env("REACT_APP_FIREBASE_MESSAGING_SENDER_ID"),
    appId: env("REACT_APP_FIREBASE_APP_ID"),
    measurementId: env("REACT_APP_FIREBASE_MEASUREMENT_ID"),
  };

  _app = initializeApp(firebaseConfig);
  _db = getFirestore(_app);
  _auth = getAuth(_app);
  _ready = true;

  return { app: _app, db: _db, auth: _auth, ready: true };
}
