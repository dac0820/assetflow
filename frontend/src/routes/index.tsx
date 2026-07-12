import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { Login } from "../pages/Login";
import { Dashboard } from "../pages/Dashboard";
import { AssetsCatalog } from "../pages/AssetsCatalog";
import { Bookings } from "../pages/Bookings";
import { Transfers } from "../pages/Transfers";
import { Maintenance } from "../pages/Maintenance";
import { Audits } from "../pages/Audits";
import { Reports } from "../pages/Reports";
import { Settings } from "../pages/Settings";
import { Users } from "../pages/Users";
import { RoleGuard } from "../components/RoleGuard";

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected Dashboard Layout Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="assets" element={<AssetsCatalog />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="transfers" element={<Transfers />} />
          <Route path="maintenance" element={<Maintenance />} />
          <Route path="audits" element={<Audits />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route
            path="users"
            element={
              <RoleGuard allowedRoles={["admin"]}>
                <Users />
              </RoleGuard>
            }
          />
        </Route>

        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
