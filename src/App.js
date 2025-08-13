import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProfileProvider } from "./context/ProfileContext";

import MarketingHome from "./components/marketing/MarketingHome/MarketingHome";
import PrivacyPage from "./components/marketing/PrivacyPage/PrivacyPage";
import TermsPage from "./components/marketing/TermsPage/TermsPage";
import ProtectedRoute from "./routes/ProtectedRoute/ProtectedRoute";
import AppLayout from "./routes/AppLayout/AppLayout";

import Dashboard from "./components/app/Dashboard/Dashboard";
import InsightsPage from "./components/app/pages/InsightsPage";
import BudgetsPage from "./components/app/pages/BudgetsPage";
import ForecastPage from "./components/app/pages/ForecastPage";
import RulesPage from "./components/app/pages/RulesPage";
import AccountsPage from "./components/app/pages/AccountsPage";
import TagsPage from "./components/app/pages/TagsPage";
import SettingsPage from "./components/app/pages/SettingsPage";
import DashboardHome from "./components/app/pages/DashboardHome";
import ProfileManagementPage from "./components/app/pages/ProfileManagementPage";
import UploadDataPage from "./components/app/pages/UploadDataPage";

import Four04Landing from "./components/marketing/Four04Landing/Four04Landing";
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

          {/* App area: Dashboard is the SHELL, children are the pages */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardHome />} />
            <Route path="dashboard" element={<DashboardHome />} />
            <Route path="insights" element={<InsightsPage />} />
            <Route path="budgets" element={<BudgetsPage />} />
            <Route path="forecast" element={<ForecastPage />} />
            <Route path="rules" element={<RulesPage />} />
            <Route path="accounts" element={<AccountsPage />} />
            <Route path="tags" element={<TagsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="profile" element={<ProfileManagementPage />} />
            <Route path="upload" element={<UploadDataPage />} />
          </Route>

          {/* Old alias */}
          <Route path="/ppapp/dashboard" element={<Navigate to="/app/dashboard" replace />} />

          {/* 404s */}
          <Route path="/404" element={<Four04Landing />} />
          <Route path="*" element={<Four04Landing />} />
        </Routes>

      </ProfileProvider>
    </AuthProvider>
  );
}
