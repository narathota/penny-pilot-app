// FILE: src/utils/firebase/firebaseController.js
import { initializeApp } from "firebase/app";
import {
  getAuth, setPersistence, browserLocalPersistence, GoogleAuthProvider,
  signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged,
} from "firebase/auth";
import { getFirestore, setDoc, doc, serverTimestamp } from "firebase/firestore";

let _app = null, _auth = null, _db = null;
let _ready = false;
let _reason = "";

/* ------------ Env validation (relaxed) ------------ */
function env(k) { return process.env[k]; }
function validateEnv() {
  const required = [
    "REACT_APP_FIREBASE_API_KEY",
    "REACT_APP_FIREBASE_AUTH_DOMAIN",
    "REACT_APP_FIREBASE_PROJECT_ID",
    "REACT_APP_FIREBASE_APP_ID",
  ];
  const missing = required.filter(k => !env(k) || String(env(k)).trim() === "");
  if (missing.length) {
    _reason = `Missing env vars: ${missing.join(", ")}`;
    return false;
  }
  return true;
}

/* ------------ Init (lazy; safe) ------------ */
function initIfNeeded() {
  if (_ready) return true;
  if (!validateEnv()) return false;

  const cfg = {
    apiKey: env("REACT_APP_FIREBASE_API_KEY"),
    authDomain: env("REACT_APP_FIREBASE_AUTH_DOMAIN"),
    projectId: env("REACT_APP_FIREBASE_PROJECT_ID"),
    storageBucket: env("REACT_APP_FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: env("REACT_APP_FIREBASE_MESSAGING_SENDER_ID"),
    appId: env("REACT_APP_FIREBASE_APP_ID"),
    measurementId: env("REACT_APP_FIREBASE_MEASUREMENT_ID"),
  };

  try {
    _app = initializeApp(cfg);
    _auth = getAuth(_app);
    _db = getFirestore(_app);
    setPersistence(_auth, browserLocalPersistence);
    _ready = true;
    _reason = "";
    return true;
  } catch (e) {
    _reason = e?.message || "Firebase init failed";
    _ready = false;
    _app = _auth = _db = null;
    return false;
  }
}

export function getFirebase() {
  return { app: _app, auth: _auth, db: _db, ready: initIfNeeded(), reason: _reason };
}

function isMobileUA() { return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent); }

/** Login with Google (popup desktop, redirect mobile/popup-block) */
export async function loginWithGoogle() {
  const { auth, ready, reason } = getFirebase();
  if (!ready) throw new Error(`Firebase not configured: ${reason}`);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  if (isMobileUA()) {
    await signInWithRedirect(auth, provider);
    return { method: "redirect" };
  }
  try {
    const cred = await signInWithPopup(auth, provider);
    await writeAppUser(cred.user);
    return { method: "popup", user: cred.user };
  } catch (err) {
    if (err?.code === "auth/popup-blocked" || err?.code === "auth/popup-closed-by-user") {
      await signInWithRedirect(auth, provider);
      return { method: "redirect" };
    }
    throw err;
  }
}

/** Complete redirect flow if present */
export async function handleAuthRedirect() {
  const { auth, ready } = getFirebase();
  if (!ready) return null;
  const res = await getRedirectResult(auth);
  if (res?.user) { await writeAppUser(res.user); return res.user; }
  return null;
}

/** Subscribe to auth state (safe) */
export function onAuthChangedSafe(cb) {
  const { auth, ready } = getFirebase();
  if (!ready) { setTimeout(() => cb(null), 0); return () => {}; }
  return onAuthStateChanged(auth, cb);
}

/** Logout */
export async function logoutUser() {
  const { auth, ready } = getFirebase();
  if (!ready) return;
  await signOut(auth);
}

/** Upsert app_users/{uid} with lastLoginAt */
export async function writeAppUser(user) {
  const { db, ready } = getFirebase();
  if (!ready || !user?.uid) return;
  await setDoc(
    doc(db, "app_users", user.uid),
    {
      uid: user.uid,
      email: user.email || null,
      displayName: user.displayName || null,
      photoURL: user.photoURL || null,
      providerId: user.providerData?.[0]?.providerId || "google.com",
      lastLoginAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export function isFirebaseReady() { return initIfNeeded(); }
export function notReadyReason() { return _reason; }
