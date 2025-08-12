// FILE: src/routes/ProtectedRoute/ProtectedRoute.js
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return null;
  if (!user)
    return <Navigate to="/404" state={{ from: location, reason: "auth" }} replace />;
  return children;
}
