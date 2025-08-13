import React, { useEffect, useRef } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGauge,            // Dashboard
  faChartLine,        // Insights
  faPiggyBank,        // Budgets
  faChartArea,        // Forecast
  faListCheck,        // Rules
  faBuildingColumns,  // Accounts
  faTags,             // Tags
  faFileArrowUp,      // Upload Data
  faGear,             // Settings
  faDatabase,             // DataManagementAdminPage
} from "@fortawesome/free-solid-svg-icons";
import styles from "./AppSidebar.module.css";

const items = [
  { to: "/app/dashboard", label: "Dashboard",   icon: faGauge },
  { to: "/app/insights",  label: "Insights",    icon: faChartLine },
  { to: "/app/budgets",   label: "Budgets",     icon: faPiggyBank },
  { to: "/app/forecast",  label: "Forecast",    icon: faChartArea },
  { to: "/app/rules",     label: "Rules",       icon: faListCheck },
  { to: "/app/accounts",  label: "Accounts",    icon: faBuildingColumns },
  { to: "/app/tags",      label: "Tags",        icon: faTags },
  { to: "/app/upload",    label: "Upload Data", icon: faFileArrowUp },
  { to: "/app/settings",  label: "Settings",    icon: faGear },
  { to: "/app/datamgt",  label: "Data Management",    icon: faDatabase },
];

export default function AppSidebar({ insideOffcanvas = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const pendingToRef = useRef(null);

  const isDashboardPath = (p) =>
    p === "/app" || p === "/app/" || p === "/app/dashboard";

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
                  {...(insideOffcanvas ? { "data-bs-dismiss": "offcanvas" } : {})}
                  onClick={(e) => {
                    if (isActive) { e.preventDefault(); e.stopPropagation(); return; }
                    if (insideOffcanvas) { e.preventDefault(); pendingToRef.current = it.to; }
                  }}
                >
                  <FontAwesomeIcon icon={it.icon} className={styles.icon} fixedWidth />
                  <span>{it.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
