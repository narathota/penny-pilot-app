import React from "react";
import styles from "./AppFooter.module.css";

export default function AppFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className={`border-top ${styles.footer}`}>
      <div className="container-fluid py-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div className="text-secondary small">© {year} Pocket Penny</div>
        <div className="text-secondary small">Built with ❤️ for better finances</div>
      </div>
    </footer>
  );
}
