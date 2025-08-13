import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import MarketingNavbar from "../MarketingNavbar/MarketingNavbar";
import MarketingFooter from "../MarketingFooter/MarketingFooter";
import { useAuth } from "../../../context/AuthContext";
import styles from "./Four04Landing.module.css";


export default function Four04Landing() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loginWithGoogle } = useAuth();

  const reason =
    location.state?.reason ||
    (location.pathname.startsWith("/app") && !user ? "auth" : "404");

  const fromPath = location.state?.from?.pathname || null;

  const title = reason === "auth" ? "Sign in required" : "Page not found";
  const message =
    reason === "auth"
      ? "You tried to open a protected page. Please sign in to continue."
      : "The page you’re looking for doesn’t exist or was moved.";

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
      const dest = fromPath || "/app/dashboard";
      navigate(dest, { replace: true });
    } catch (err) {
      // If popup closed/blocked, your AuthContext will handle redirect fallback
      console.warn("Login aborted:", err?.message || err);
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100 bg-body text-body">
      <MarketingNavbar />
      <main className={`flex-grow-1 ${styles.wrap}`}>
        <div className="container">
          <div className={styles.card}>
            <div className={styles.badge}>404</div>
            <h1 className="h3 fw-bold mb-2">{title}</h1>
            <p className="text-secondary mb-4">{message}</p>

            <div className={`${styles.hint} mb-4`}>
              <span className="me-2">Attempted URL:</span>
              <code className={styles.code}>{location.pathname}</code>
            </div>

            <div className="d-flex gap-2 flex-wrap justify-content-center">
              {reason === "auth" && !user ? (
                <button className="btn btn-primary" onClick={handleLogin}>
                  Login with Google
                </button>
              ) : null}
              <Link to="/" className="btn btn-outline-secondary">
                Back to Home
              </Link>
              {fromPath && user ? (
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => navigate(fromPath, { replace: true })}
                >
                  Try Again
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
