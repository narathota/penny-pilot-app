// FILE: src/components/common/AuthMenu/AuthMenu.js
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import styles from "./AuthMenu.module.css";

export default function AuthMenu() {
  const { user, loginWithGoogle, logout, isFirebaseReady, firebaseError } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <button
        className="btn btn-primary"
        onClick={loginWithGoogle}
        disabled={!isFirebaseReady}
        title={!isFirebaseReady ? (firebaseError || "Firebase not configured") : undefined}
      >
        Login with Google
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
          <button className="dropdown-item" onClick={() => navigate("/ppapp/dashboard")}>Go to App</button>
        </li>
        <li><hr className="dropdown-divider" /></li>
        <li>
          <button className="dropdown-item" onClick={logout}>Logout</button>
        </li>
      </ul>
    </div>
  );
}
