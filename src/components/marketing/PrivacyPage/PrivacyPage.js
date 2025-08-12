import React from "react";
import MarketingNavbar from "../MarketingNavbar/MarketingNavbar";
import MarketingFooter from "../MarketingFooter/MarketingFooter";

export default function PrivacyPage(){
  return (
    <div className="d-flex flex-column min-vh-100 bg-body text-body">
      <MarketingNavbar />
      <main className="container py-5">
        <h1 className="h3 fw-bold mb-3">Privacy Policy</h1>
        <p>Placeholder privacy copy. Replace with your real policy.</p>
      </main>
      <MarketingFooter />
    </div>
  );
}