// FILE: src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

// Bootstrap base CSS & JS
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

// Theme (brand tokens + system theme sync)
import "./styles/pp-theme.css";
import "./utils/theme/initTheme";

// ⬇️ NEW: process Firebase redirect result **before** mounting React
import { handleAuthRedirect } from "./utils/firebase/firebaseController";

const root = ReactDOM.createRoot(document.getElementById("root"));

(async function bootstrap() {
  try {
    await handleAuthRedirect();
  } catch (e) {
    // non-fatal; keep going
    // console.warn("Auth redirect handling failed:", e);
  } finally {
    root.render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
  }
})();
