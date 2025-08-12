// FILE: src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { getFirebase } from "../utils/firebase/firebaseController";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  const [firebaseError, setFirebaseError] = useState("");

  useEffect(() => {
    const fb = getFirebase();
    if (!fb.ready) {
      setIsFirebaseReady(false);
      setFirebaseError(fb.reason || "Firebase not configured");
      setInitializing(false);
      return;
    }

    setIsFirebaseReady(true);
    const unsub = onAuthStateChanged(fb.auth, (u) => {
      setUser(u || null);
      setInitializing(false);
    });
    return () => unsub();
  }, []);

  const loginWithGoogle = async () => {
    const fb = getFirebase();
    if (!fb.ready) throw new Error(`Firebase not configured: ${fb.reason || ""}`);
    const provider = new GoogleAuthProvider();
    await signInWithPopup(fb.auth, provider);
  };

  const logout = async () => {
    const fb = getFirebase();
    if (!fb.ready) return;
    await signOut(fb.auth);
  };

  const value = useMemo(
    () => ({ user, initializing, loginWithGoogle, logout, isFirebaseReady, firebaseError }),
    [user, initializing, isFirebaseReady, firebaseError]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return useContext(AuthCtx);
}
