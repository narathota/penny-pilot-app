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

// read from env; fallback to /app/dashboard
const POST_LOGIN_PATH = process.env.REACT_APP_POST_LOGIN_PATH || "/app/dashboard";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [ready, setReady] = useState(undefined);
  const [reason, setReason] = useState("");

  useEffect(() => {
    const ok = isFirebaseReady();   // lazy init
    setReady(ok);
    setReason(ok ? "" : notReadyReason());

    if (ok) {
      handleAuthRedirect().finally(() => {
        const unsub = onAuthChangedSafe((u) => {
          setUser(u || null);
          setInitializing(false);
        });
        return () => unsub();
      });
    } else {
      setInitializing(false);
    }
  }, []);

  const loginWithGoogle = async () => {
    // store the desired landing path for after login
    sessionStorage.setItem("pp:postLogin", POST_LOGIN_PATH);
    await fcLoginWithGoogle();
  };

  const logout = async () => {
    await logoutUser();
  };

  const value = useMemo(
    () => ({
      user,
      initializing,
      loginWithGoogle,
      logout,
      isFirebaseReady: ready,
      firebaseError: reason,
    }),
    [user, initializing, ready, reason]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return useContext(AuthCtx);
}
