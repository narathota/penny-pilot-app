import React, { useEffect, useState } from "react";
import styles from "./ThemeToggle.module.css";

const LS_KEY = "pp:theme"; // "light" | "dark" | "system"

function getSystem() { return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? "dark" : "light"; }
function applyTheme(next) { document.documentElement.setAttribute('data-bs-theme', next); }

export default function ThemeToggle(){
  const [mode, setMode] = useState(() => localStorage.getItem(LS_KEY) || "system");

  // init/apply on mount and when changed
  useEffect(() => {
    const actual = mode === "system" ? getSystem() : mode;
    applyTheme(actual);
    localStorage.setItem(LS_KEY, mode);
  }, [mode]);

  // react to system changes if in system mode
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const cb = () => { if (mode === "system") applyTheme(getSystem()); };
    mq.addEventListener("change", cb);
    return () => mq.removeEventListener("change", cb);
  }, [mode]);

  return (
    <div className="dropdown">
      <button className="btn btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
        <span className="me-2" aria-hidden>☀️/🌙</span>
        <span className="visually-hidden">Select theme</span>
      </button>
      <ul className="dropdown-menu dropdown-menu-end">
        <li><button className="dropdown-item" onClick={() => setMode("system")}>System</button></li>
        <li><button className="dropdown-item" onClick={() => setMode("light")}>Light</button></li>
        <li><button className="dropdown-item" onClick={() => setMode("dark")}>Dark</button></li>
      </ul>
    </div>
  );
}