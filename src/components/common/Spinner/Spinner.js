import React from "react";

export default function Spinner({ label = "Loading..." }) {
  return (
    <div className="d-flex align-items-center justify-content-center py-5" role="status" aria-live="polite">
      <div className="spinner-border me-2" />
      <span className="text-secondary">{label}</span>
    </div>
  );
}
