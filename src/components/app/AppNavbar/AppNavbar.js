import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import ThemeToggle from "../../common/ThemeToggle/ThemeToggle";
import styles from "./AppNavbar.module.css";

export default function AppNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const name = user?.displayName || user?.email || "Account";
  const photo = user?.photoURL || "";

  return (
    <nav className={`navbar bg-body-tertiary border-bottom ${styles.nav}`}>
      <div className="container-fluid">
        {/* Hamburger shows only on <lg (opens offcanvas sidebar if you use it) */}
        <button
          className="btn btn-outline-secondary d-lg-none me-2"
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target="#appSidebar"
          aria-controls="appSidebar"
          aria-label="Open navigation"
        >
          ☰
        </button>

        <span className="navbar-brand fw-bold d-flex align-items-center gap-2">
          <img src="/pp-logo.png" alt="" height="20" width="20" aria-hidden />
          <span>Pocket Penny</span>
        </span>

        <div className="d-flex align-items-center gap-2">
          {/* Theme picker lives in app navbar too */}
          <ThemeToggle />

          {/* Profile dropdown */}
          <div className="dropdown">
            <button
              className={`btn btn-outline-secondary dropdown-toggle d-flex align-items-center gap-2 ${styles.profileBtn}`}
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              {photo ? (
                <img src={photo} alt="Profile" className={styles.avatar} />
              ) : (
                <span className={styles.avatarFallback} aria-hidden>
                  {name?.[0]?.toUpperCase() || "U"}
                </span>
              )}
              <span className="d-none d-sm-inline">{name}</span>
            </button>

            <ul className="dropdown-menu dropdown-menu-end">
              <li>
                <button
                  className="dropdown-item"
                  onClick={() => navigate("/app/profile")}
                >
                  Manage profile
                </button>
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
        </div>
      </div>
    </nav>
  );
}
