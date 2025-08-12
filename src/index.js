import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

// Bootstrap base CSS & JS (needed for dropdowns + navbar toggler)
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

// Theme overrides (your custom look)
// import "./styles/theme-overrides.css";
import "./styles/pp-theme.css";

// add this as the first import
import "./utils/theme/initTheme";


const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
