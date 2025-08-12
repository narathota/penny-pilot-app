import React from "react";
import { Link } from "react-router-dom";
import styles from "./MarketingFooter.module.css";

export default function MarketingFooter(){
  const year = new Date().getFullYear();
  return (
    <footer className="border-top py-4 mt-auto">
      <div className="container d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div className="d-flex align-items-center gap-2">
          <span className={styles.logoDot} aria-hidden>●</span>
          <strong>Pocket Penny</strong>
        </div>
        <div className="text-secondary small">© {year} All rights reserved.</div>
        <ul className="nav gap-3">
          <li className="nav-item"><Link className="nav-link p-0" to="/privacy">Privacy</Link></li>
          <li className="nav-item"><Link className="nav-link p-0" to="/terms">Terms</Link></li>
          <li className="nav-item"><a className="nav-link p-0" href="https://nara.example" target="_blank" rel="noreferrer">A project by nara</a></li>
        </ul>
      </div>
    </footer>
  );
}