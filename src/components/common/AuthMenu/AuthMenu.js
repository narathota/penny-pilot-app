import React, { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRightToBracket,   // login
  faArrowRightFromBracket, // logout
  faUser,             // avatar fallback
  faGauge,            // dashboard
  faGear              // settings
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../../context/AuthContext";
import styles from "./AuthMenu.module.css";

const POST_LOGIN_PATH = process.env.REACT_APP_POST_LOGIN_PATH || "/app/dashboard";
const POST_LOGIN_KEY = "pp:postLogin";

export default function AuthMenu() {
  const { user, loginWithGoogle, logout, isFirebaseReady, firebaseError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Compute a sensible destination: preserve app route if we're already inside /app,
  // otherwise default to the dashboard. Respect a "from" route if router provided one.
  const desiredDest = useMemo(() => {
    return (
      location.state?.from?.pathname ||
      (location.pathname.startsWith("/app") ? location.pathname : POST_LOGIN_PATH)
    );
  }, [location]);

  // If we return from a redirect and auth is ready, finish the navigation.
  useEffect(() => {
    if (!user) return;
    const stored =
      localStorage.getItem(POST_LOGIN_KEY) ||
      sessionStorage.getItem(POST_LOGIN_KEY);
    if (stored) {
      localStorage.removeItem(POST_LOGIN_KEY);
      sessionStorage.removeItem(POST_LOGIN_KEY);
      if (location.pathname !== stored) {
        navigate(stored, { replace: true });
      }
    }
  }, [user, navigate, location.pathname]);

  const handleLogin = async () => {
    // Persist target in localStorage so it survives mobile redirect flows
    localStorage.setItem(POST_LOGIN_KEY, desiredDest);
    await loginWithGoogle(); // popup on desktop, redirect on mobile
  };

  const handleGoToApp = () => navigate(POST_LOGIN_PATH);
  const handleSettings = () => navigate("/app/settings");

  // ---- Render states ----

  // Firebase not ready (env misconfig or persistence blocked). Show disabled button with tooltip.
  if (!isFirebaseReady && firebaseError) {
    return (
      <div className={`d-inline-block ${styles.authMenu || ""}`}>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          title={firebaseError}
          disabled
        >
          <FontAwesomeIcon icon={faRightToBracket} className="me-2" />
          Login
        </button>
      </div>
    );
  }

  // Logged out
  if (!user) {
    return (
      <div className={`d-inline-block ${styles.authMenu || ""}`}>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={handleLogin}
        >
          <FontAwesomeIcon icon={faRightToBracket} className="me-2" />
          Login with Google
        </button>
      </div>
    );
  }

  // Logged in (dropdown with avatar)
  const avatarUrl = user.photoURL;
  const displayName = user.displayName || user.email || "Account";

  return (
    <div className={`dropdown ${styles.authMenu || ""}`}>
      <button
        className="btn btn-outline-secondary btn-sm dropdown-toggle d-flex align-items-center"
        type="button"
        id="authDropdown"
        data-bs-toggle="dropdown"
        aria-expanded="false"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Avatar"
            className="rounded-circle me-2"
            style={{ width: 22, height: 22, objectFit: "cover" }}
          />
        ) : (
          <span className="me-2">
            <FontAwesomeIcon icon={faUser} />
          </span>
        )}
        <span className="text-truncate" style={{ maxWidth: 120 }}>
          {displayName}
        </span>
      </button>

      <ul className="dropdown-menu dropdown-menu-end shadow-sm" aria-labelledby="authDropdown">
        <li>
          <button className="dropdown-item d-flex align-items-center" onClick={handleGoToApp}>
            <FontAwesomeIcon icon={faGauge} className="me-2" />
            Go to App
          </button>
        </li>
        <li><hr className="dropdown-divider" /></li>
        <li>
          <button
            className="dropdown-item d-flex align-items-center text-danger"
            onClick={logout}
          >
            <FontAwesomeIcon icon={faArrowRightFromBracket} className="me-2" />
            Sign out
          </button>
        </li>
      </ul>
    </div>
  );
}
