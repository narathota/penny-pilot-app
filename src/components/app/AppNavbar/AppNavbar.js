import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import styles from "./AppNavbar.module.css";

export default function AppNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className={`navbar bg-body-tertiary border-bottom ${styles.nav}`}>
      <div className="container-fluid">
        <span className="navbar-brand fw-bold">
          <span className={styles.dot} aria-hidden>●</span> Pocket Penny
        </span>
        <div className="d-flex align-items-center gap-3">
          <span className="text-secondary small d-none d-md-inline">
            {user?.displayName || user?.email}
          </span>
          <button
            className="btn btn-outline-secondary"
            onClick={async () => {
              await logout();
              navigate("/", { replace: true });
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
