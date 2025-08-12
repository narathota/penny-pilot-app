import React, { useEffect, useRef } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import styles from "./AppSidebar.module.css";

const items = [
  { to: "/app/dashboard", label: "Dashboard" },
  { to: "/app/insights",  label: "Insights" },
  { to: "/app/budgets",   label: "Budgets" },
  { to: "/app/forecast",  label: "Forecast" },
  { to: "/app/rules",     label: "Rules" },
  { to: "/app/accounts",  label: "Accounts" },
  { to: "/app/tags",      label: "Tags" },
  { to: "/app/settings",  label: "Settings" },
];

export default function AppSidebar({ insideOffcanvas = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const pendingToRef = useRef(null);

  const isDashboardPath = (p) =>
    p === "/app" || p === "/app/" || p === "/app/dashboard";

  // When inside offcanvas, navigate ONLY after it is fully hidden
  useEffect(() => {
    if (!insideOffcanvas) return;
    const el = document.getElementById("appSidebar");
    if (!el) return;

    const onHidden = () => {
      const to = pendingToRef.current;
      pendingToRef.current = null;
      if (to) navigate(to);
    };

    el.addEventListener("hidden.bs.offcanvas", onHidden);
    return () => el.removeEventListener("hidden.bs.offcanvas", onHidden);
  }, [insideOffcanvas, navigate]);

  return (
    <aside className={`${styles.wrap} bg-body`}>
      <div className="p-3">
        <div className="text-uppercase text-secondary small fw-bold mb-2">Navigation</div>
        <ul className="nav nav-pills flex-column gap-1">
          {items.map((it) => {
            const isActive =
              it.to === "/app/dashboard"
                ? isDashboardPath(location.pathname)
                : location.pathname === it.to;

            return (
              <li className="nav-item" key={it.to}>
                <NavLink
                  to={it.to}
                  className={`nav-link ${styles.link} ${isActive ? "active disabled" : ""}`}
                  // Let Bootstrap close the drawer
                  {...(insideOffcanvas ? { "data-bs-dismiss": "offcanvas" } : {})}
                  onClick={(e) => {
                    if (isActive) {
                      e.preventDefault();
                      e.stopPropagation();
                      return;
                    }
                    if (insideOffcanvas) {
                      // Prevent immediate SPA navigation; we'll navigate after the drawer hides
                      e.preventDefault();
                      pendingToRef.current = it.to;
                      // No manual hide() call here — Bootstrap handles it via data-bs-dismiss
                    }
                    // Desktop: allow NavLink to navigate normally
                  }}
                >
                  {it.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
