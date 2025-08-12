import { initializeApp } from "firebase/app";
import {
  getAuth, setPersistence, browserLocalPersistence, GoogleAuthProvider,
  signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged,
} from "firebase/auth";
import { getFirestore, setDoc, doc, serverTimestamp } from "firebase/firestore";

let _app = null, _auth = null, _db = null;
let _ready = false;
let _reason = "";

/* ------------ Read ONLY REACT_APP_FB_* vars ------------ */
function env(k) {
  const v = process.env[k];
  return v && String(v).trim() !== "" ? String(v).trim() : "";
}
function cfgVal(name) {
  return env(`REACT_APP_FB_${name}`);
}
function validateEnv() {
  const required = ["API_KEY", "AUTH_DOMAIN", "PROJECT_ID", "APP_ID"];
  const missing = required.filter(n => !cfgVal(n)).map(n => `REACT_APP_FB_${n}`);
  if (missing.length) {
    _reason = `Missing env vars: ${missing.join(", ")}`;
    return false;
  }
  return true;
}

/* ------------ Lazy/safe init ------------ */
function initIfNeeded() {
  if (_ready) return true;
  if (!validateEnv()) return false;

  const cfg = {
    apiKey: cfgVal("API_KEY"),
    authDomain: cfgVal("AUTH_DOMAIN"),
    projectId: cfgVal("PROJECT_ID"),
    storageBucket: cfgVal("STORAGE_BUCKET") || undefined,
    messagingSenderId: cfgVal("MESSAGING_SENDER_ID") || undefined,
    appId: cfgVal("APP_ID"),
    measurementId: cfgVal("MEASUREMENT_ID") || undefined,
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

/* ------------ Public API ------------ */
export function getFirebase() {
  return { app: _app, auth: _auth, db: _db, ready: initIfNeeded(), reason: _reason };
}

function isMobileUA() { return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent); }

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

export async function handleAuthRedirect() {
  const { auth, ready } = getFirebase();
  if (!ready) return null;
  const res = await getRedirectResult(auth);
  if (res?.user) { await writeAppUser(res.user); return res.user; }
  return null;
}

export function onAuthChangedSafe(cb) {
  const { auth, ready } = getFirebase();
  if (!ready) { setTimeout(() => cb(null), 0); return () => {}; }
  return onAuthStateChanged(auth, cb);
}

export async function logoutUser() {
  const { auth, ready } = getFirebase();
  if (!ready) return;
  await signOut(auth);
}

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
