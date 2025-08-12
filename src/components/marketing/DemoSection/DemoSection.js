import React from "react";
import styles from "./DemoSection.module.css";
import { DEMO_HTML } from "../../../content/marketingCopy";

export default function DemoSection(){
  return (
    <section id="demo" className="py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-8">
            <div className={styles.card} dangerouslySetInnerHTML={{ __html: DEMO_HTML }} />
          </div>
        </div>
      </div>
    </section>
  );
}