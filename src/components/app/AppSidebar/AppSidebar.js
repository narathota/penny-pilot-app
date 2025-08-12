import React from "react";
import styles from "./AppSidebar.module.css";

export default function AppSidebar() {
  return (
    <aside className={`${styles.wrap} bg-body`}>
      <div className="p-3">
        <div className="text-uppercase text-secondary small fw-bold mb-2">Navigation</div>
        <ul className="nav nav-pills flex-column gap-1">
          <li className="nav-item"><span className="nav-link active">Dashboard</span></li>
          <li className="nav-item"><span className="nav-link">Insights</span></li>
          <li className="nav-item"><span className="nav-link">Budgets</span></li>
          <li className="nav-item"><span className="nav-link">Forecast</span></li>
          <li className="nav-item"><span className="nav-link">Rules</span></li>
          <li className="nav-item"><span className="nav-link">Accounts</span></li>
          <li className="nav-item"><span className="nav-link">Tags</span></li>
        </ul>
      </div>
    </aside>
  );
}
