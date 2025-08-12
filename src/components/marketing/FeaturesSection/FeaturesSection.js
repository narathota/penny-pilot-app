import React from "react";
import styles from "./FeaturesSection.module.css";
import { FEATURES_HTML } from "../../../content/marketingCopy";

export default function FeaturesSection(){
  return (
    <section id="features" className="py-5 bg-body-tertiary">
      <div className="container">
        <h2 className="h3 fw-bold mb-4">Features</h2>
        <div className={`row g-4 ${styles.cards}`} dangerouslySetInnerHTML={{ __html: FEATURES_HTML }} />
      </div>
    </section>
  );
}