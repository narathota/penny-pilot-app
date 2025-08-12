// FILE: src/components/common/AuthMenu/AuthMenu.js
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import styles from "./AuthMenu.module.css";

export default function AuthMenu() {
  const { user, loginWithGoogle, logout, isFirebaseReady, firebaseError } = useAuth();
  const navigate = useNavigate();

  // After login (popup or redirect), go to /app/dashboard
  useEffect(() => {
    const target = sessionStorage.getItem("pp:postLogin");
    if (user && target) {
      sessionStorage.removeItem("pp:postLogin");
      navigate(target, { replace: true });
    }
  }, [user, navigate]);

  if (!user) {
    return (
      <button
        className="btn btn-primary d-inline-flex align-items-center gap-2"
        onClick={async () => {
          try {
            await loginWithGoogle();
          } catch (e) {
            alert(e?.message || firebaseError || "Sign-in is not configured.");
          }
        }}
        // NOTE: no disabled prop — always clickable
      >
        {/* Google G (inline) */}
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48" aria-hidden>
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.5 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.7 3l5.7-5.7C33.7 6 29.1 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c10 0 19-7.3 19-20 0-1.2-.1-2.3-.4-3.5z"/>
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.9 16.5 19.1 14 24 14c3 0 5.7 1.1 7.7 3l5.7-5.7C33.7 6 29.1 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.2-5.3l-6.1-5c-1.8 1.2-4.1 1.9-7.1 1.9-5.3 0-9.7-3.5-11.3-8.3l-6.5 5c3.3 6.6 10.1 11.7 17.8 11.7z"/>
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.3 3.7-4.8 6.4-9.3 6.4-5.3 0-9.7-3.5-11.3-8.3l-6.5 5C10.4 37.9 17.2 43 24 43c10 0 19-7.3 19-20 0-1.2-.1-2.3-.4-3.5z"/>
        </svg>
        <span>Continue with Google</span>
      </button>
    );
  }

  return (
    <div className="dropdown">
      <button className="btn btn-outline-secondary dropdown-toggle d-flex align-items-center gap-2" data-bs-toggle="dropdown">
        <img src={user.photoURL || "https://placehold.co/28x28"} alt="profile" className={styles.avatar} />
        <span className="d-none d-sm-inline">{user.displayName || user.email}</span>
      </button>
      <ul className="dropdown-menu dropdown-menu-end">
        <li>
          <button className="dropdown-item" onClick={() => navigate("/app/dashboard")}>Go to App</button>
        </li>
        <li><hr className="dropdown-divider" /></li>
        <li>
          <button
            className="dropdown-item"
            onClick={async () => {
              await logout();
              navigate("/", { replace: true });
            }}
          >
            Logout
          </button>
        </li>
      </ul>
    </div>
  );
}
