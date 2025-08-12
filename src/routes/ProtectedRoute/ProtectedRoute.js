// FILE: src/routes/ProtectedRoute/ProtectedRoute.js
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return null; // TODO: replace with a spinner if you want
  if (!user) return <Navigate to="/" state={{ from: location }} replace />;
  return children;
}
