import React from "react";

import styles from "./DashboardBaseComponent.module.css";

export default function DashboardBaseComponent() {
  return (
    <div className="p-3 p-lg-4">
      <div className="row g-3">
        <div className="col-12 col-lg-8">
          <div className={`card ${styles.card}`}>
            <div className="card-body">
              <h2 className="h5 fw-bold mb-2">Welcome to your dashboard</h2>
              <p className="text-secondary mb-0">
                Placeholder content. We’ll add Insights, Budgets, and Forecast widgets here.
              </p>
            </div>
          </div>
        </div>
        <div className="col-12 col-lg-4">
          <div className={`card ${styles.card}`}>
            <div className="card-body">
              <h3 className="h6 fw-bold mb-2">Next steps</h3>
              <ul className="mb-0">
                <li>Connect an account</li>
                <li>Upload a CSV</li>
                <li>Create your first budget</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
