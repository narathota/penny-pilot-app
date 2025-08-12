import React from "react";
import styles from "./AboutSection.module.css";
import { ABOUT_HTML } from "../../../content/marketingCopy";

export default function AboutSection(){
  return (
    <section id="about" className="py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-10">
            <h2 className="h3 fw-bold mb-3">About</h2>
            <div className={styles.copy} dangerouslySetInnerHTML={{ __html: ABOUT_HTML }} />
          </div>
        </div>
      </div>
    </section>
  );
}