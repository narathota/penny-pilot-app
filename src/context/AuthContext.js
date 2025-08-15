import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  loginWithGoogle as fcLoginWithGoogle,
  handleAuthRedirect,
  onAuthChangedSafe,
  logoutUser,
  isFirebaseReady,
  notReadyReason,
} from "../utils/firebase/firebaseController";

const AuthCtx = createContext(null);

// Allow /app/dashboard or /ppapp/dashboard, configurable at build time
const POST_LOGIN_PATH =
  process.env.REACT_APP_POST_LOGIN_PATH ||
  "/app/dashboard"; // change to "/ppapp/dashboard" if that's what prod routes

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [ready, setReady] = useState(undefined);
  const [reason, setReason] = useState("");

  useEffect(() => {
    const ok = isFirebaseReady();
    setReady(ok);
    setReason(ok ? "" : notReadyReason());

    if (!ok) { setInitializing(false); return; }

    // Subscribe FIRST to avoid missing iOS redirect auth event
    let first = true;
    const unsub = onAuthChangedSafe((u) => {
      setUser(u || null);
      if (first) { setInitializing(false); first = false; }
    });

    // Then complete redirect (noop on desktop/popup)
    (async () => {
      try { await handleAuthRedirect(); } catch (e) { /* swallow */ }
    })();

    return () => { try { unsub && unsub(); } catch {} };
  }, []);

  const loginWithGoogle = async () => {
    sessionStorage.setItem("pp:postLogin", POST_LOGIN_PATH);
    await fcLoginWithGoogle();
  };

  const logout = async () => { await logoutUser(); };

  const value = useMemo(() => ({
    user, initializing, loginWithGoogle, logout,
    isFirebaseReady: ready, firebaseError: reason,
  }), [user, initializing, ready, reason]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() { return useContext(AuthCtx); }
