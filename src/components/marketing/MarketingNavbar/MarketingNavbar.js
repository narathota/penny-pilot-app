import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ThemeToggle from "../../common/ThemeToggle/ThemeToggle";
import AuthMenu from "../../common/AuthMenu/AuthMenu";
import styles from "./MarketingNavbar.module.css";

export default function MarketingNavbar() {
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Close mobile menu on route change or link click
  useEffect(() => {
    const handler = () => setIsCollapsed(true);
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  return (
    <header className="sticky-top border-bottom">
      <nav className="navbar navbar-expand-lg bg-body-tertiary" aria-label="Main navigation">
        <div className="container">
          <Link
            className={`navbar-brand d-flex align-items-center ${styles.brand}`}
            to="/"
            aria-label="Pocket Penny — Home"
          >
            <img
              src="/pp-logo.png"
              alt=""
              className={styles.logoImg}
              height={28}
              width={28}
              aria-hidden="true"
            />
            <span className="fw-bold">Pocket&nbsp;Penny</span>
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#pp-navbar"
            aria-controls="pp-navbar"
            aria-expanded={!isCollapsed}
            aria-label="Toggle navigation"
            onClick={() => setIsCollapsed((v) => !v)}
          >
            <span className="navbar-toggler-icon" />
          </button>

          <div id="pp-navbar" className={`collapse navbar-collapse ${!isCollapsed ? "show" : ""}`}>
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item"><a className="nav-link" href="#about">About</a></li>
              <li className="nav-item"><a className="nav-link" href="#features">Features</a></li>
              <li className="nav-item"><a className="nav-link" href="#demo">Demo</a></li>
              <li className="nav-item"><Link className="nav-link" to="/privacy">Privacy</Link></li>
              <li className="nav-item"><Link className="nav-link" to="/terms">Terms</Link></li>
            </ul>

            <div className="d-flex align-items-center gap-3">
              <ThemeToggle />
              <AuthMenu />
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
