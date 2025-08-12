// FILE: src/App.js
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { ProfileProvider } from "./context/ProfileContext";

import MarketingHome from "./components/marketing/MarketingHome/MarketingHome";
import PrivacyPage from "./components/marketing/PrivacyPage/PrivacyPage";
import TermsPage from "./components/marketing/TermsPage/TermsPage";
import ProtectedRoute from "./routes/ProtectedRoute/ProtectedRoute";
import Dashboard from "./components/app/Dashboard/Dashboard";

import "./App.css";

export default function App() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <Routes>
          {/* Marketing site */}
          <Route path="/" element={<MarketingHome />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />

          {/* App (auth-protected) */}
          <Route
            path="/ppapp/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ProfileProvider>
    </AuthProvider>
  );
}
