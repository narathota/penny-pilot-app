import React from "react";
import styles from "./HeroSection.module.css";
import { HERO_HEADLINE_HTML, HERO_SUBTITLE_HTML, HERO_CTA_HTML } from "../../../content/marketingCopy";

export default function HeroSection(){
  return (
    <section className={`py-5 py-lg-6 ${styles.hero}`}>
      <div className="container">
        <div className="row align-items-center g-5">
          <div className="col-12 col-lg-6 text-center text-lg-start">
            <h1 className="display-4 fw-bold" dangerouslySetInnerHTML={{ __html: HERO_HEADLINE_HTML }} />
            <p className="lead mt-3" dangerouslySetInnerHTML={{ __html: HERO_SUBTITLE_HTML }} />
            <div className="mt-4" dangerouslySetInnerHTML={{ __html: HERO_CTA_HTML }} />
          </div>
          <div className="col-12 col-lg-6 text-center">
            {/* Placeholder graphic */}
            <div className={styles.mockCard} aria-hidden>
              <div className={styles.mockChart}></div>
              <div className={styles.mockTable}></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}