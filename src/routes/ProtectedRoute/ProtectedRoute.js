import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Spinner from "../../components/common/Spinner/Spinner";

export default function ProtectedRoute() {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <Spinner label="Checking your session..." />;

  if (!user) {
    return (
      <Navigate
        to="/404"
        state={{ from: location, reason: "auth" }}
        replace
      />
    );
  }

  // IMPORTANT: render children routes via <Outlet /> for the wrapper-route pattern
  return <Outlet />;
}
