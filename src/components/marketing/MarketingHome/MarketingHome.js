// FILE: src/routes/MarketingHome/MarketingHome.js
import React from "react";
import MarketingNavbar from "../MarketingNavbar/MarketingNavbar";
import MarketingFooter from "../MarketingFooter/MarketingFooter";
import HeroSection from "../HeroSection/HeroSection";
import AboutSection from "../AboutSection/AboutSection";
import FeaturesSection from "../FeaturesSection/FeaturesSection";
import DemoSection from "../DemoSection/DemoSection";

export default function MarketingHome() {
  return (
    <div className="d-flex flex-column min-vh-100 bg-body text-body">
      <MarketingNavbar />
      <main id="main" className="flex-grow-1">
        <HeroSection />
        <AboutSection />
        <FeaturesSection />
        <DemoSection />
      </main>
      <MarketingFooter />
    </div>
  );
}
