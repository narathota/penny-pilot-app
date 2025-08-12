import React from "react";
import MarketingNavbar from "../MarketingNavbar/MarketingNavbar";
import MarketingFooter from "../MarketingFooter/MarketingFooter";

export default function TermsPage(){
  return (
    <div className="d-flex flex-column min-vh-100 bg-body text-body">
      <MarketingNavbar />
      <main className="container py-5">
        <h1 className="h3 fw-bold mb-3">Terms of Service</h1>
        <p>Placeholder terms copy. Replace with your real terms.</p>
      </main>
      <MarketingFooter />
    </div>
  );
}