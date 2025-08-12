// FILE: src/App.js
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProfileProvider } from "./context/ProfileContext";

import MarketingHome from "./components/marketing/MarketingHome/MarketingHome"; // or ./routes/MarketingHome/MarketingHome
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
          <Route path="/" element={<MarketingHome />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />

          <Route
            path="/app/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/ppapp/dashboard" element={<Navigate to="/app/dashboard" replace />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ProfileProvider>
    </AuthProvider>
  );
}
