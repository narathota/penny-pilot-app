import { initializeApp } from "firebase/app";
import {
  getAuth, setPersistence, browserLocalPersistence, GoogleAuthProvider,
  signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged,
} from "firebase/auth";
import { getFirestore, setDoc, doc, serverTimestamp } from "firebase/firestore";

let _app = null, _auth = null, _db = null;
let _ready = false, _reason = "";
let _persistReady = null;

function env(k) { return process.env[k]; }

function validateEnv() {
  const req = ["REACT_APP_FB_API_KEY","REACT_APP_FB_AUTH_DOMAIN","REACT_APP_FB_PROJECT_ID","REACT_APP_FB_APP_ID"];
  const missing = req.filter(k => !env(k) || String(env(k)).trim() === "");
  if (missing.length) { _reason = `Missing env vars: ${missing.join(", ")}`; return false; }
  return true;
}

function initIfNeeded() {
  if (_ready) return true;
  if (!validateEnv()) return false;

  const cfg = {
    apiKey: env("REACT_APP_FB_API_KEY"),
    authDomain: env("REACT_APP_FB_AUTH_DOMAIN"),
    projectId: env("REACT_APP_FB_PROJECT_ID"),
    storageBucket: env("REACT_APP_FB_STORAGE_BUCKET"),
    messagingSenderId: env("REACT_APP_FB_MESSAGING_SENDER_ID"),
    appId: env("REACT_APP_FB_APP_ID"),
    measurementId: env("REACT_APP_FB_MEASUREMENT_ID"),
  };

  // Warn if authDomain is not a Firebase-managed domain (redirect flow needs __/auth/handler there)
  if (cfg.authDomain && !/(\.firebaseapp\.com|\.web\.app)$/i.test(cfg.authDomain)) {
    console.warn(
      `[PocketPenny] authDomain "${cfg.authDomain}" is not a Firebase domain. 
       Mobile Google sign-in via redirect will fail unless that domain is hosted on Firebase with __/auth/handler. 
       Use <project-id>.firebaseapp.com or <project-id>.web.app and add your site to Authorized domains.`
    );
  }

  try {
    _app = initializeApp(cfg);
    _auth = getAuth(_app);
    _db = getFirestore(_app);

    _persistReady = setPersistence(_auth, browserLocalPersistence).catch((e) => {
      console.warn("Auth persistence warning:", e?.code || e?.message);
    });

    _ready = true; _reason = "";
    return true;
  } catch (e) {
    _reason = e?.message || "Firebase init failed";
    _ready = false; _app = _auth = _db = null;
    return false;
  }
}

async function waitPersistence() { try { if (_persistReady) await _persistReady; } catch {} }

export function getFirebase() { return { app: _app, auth: _auth, db: _db, ready: initIfNeeded(), reason: _reason }; }

function isMobileUA() { return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent); }

export async function loginWithGoogle() {
  const { auth, ready, reason } = getFirebase();
  if (!ready) throw new Error(`Firebase not configured: ${reason}`);
  await waitPersistence();

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
  await waitPersistence();

  try {
    const res = await getRedirectResult(auth);
    if (res?.user) { await writeAppUser(res.user); return res.user; }
  } catch (e) {
    console.warn("getRedirectResult warning:", e?.code || e?.message);
  }
  return null;
}

export function onAuthChangedSafe(cb) {
  const { auth, ready } = getFirebase();
  if (!ready) { setTimeout(() => cb(null), 0); return () => {}; }
  return onAuthStateChanged(auth, cb);
}

export async function logoutUser() { const { auth, ready } = getFirebase(); if (ready) await signOut(auth); }

export async function writeAppUser(user) {
  const { db, ready } = getFirebase();
  if (!ready || !user?.uid) return;
  await setDoc(doc(db, "app_users", user.uid), {
    uid: user.uid, email: user.email || null, displayName: user.displayName || null,
    photoURL: user.photoURL || null, providerId: user.providerData?.[0]?.providerId || "google.com",
    lastLoginAt: serverTimestamp(), createdAt: serverTimestamp(),
  }, { merge: true });
}

export function isFirebaseReady() { return initIfNeeded(); }
export function notReadyReason() { return _reason; }
