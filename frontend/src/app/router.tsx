import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';
import { AuthPage } from '../pages/AuthPage';

// Passenger Pages
import { Home as PassengerHome } from '../pages/passenger/Home';
import { ReportComplaint } from '../pages/passenger/ReportComplaint';
import { ComplaintSubmitted } from '../pages/passenger/ComplaintSubmitted';
import { TrackComplaint } from '../pages/passenger/TrackComplaint';
import { ProfilePage } from '../pages/passenger/ProfilePage';

// Depot Head Pages
import { DepotDashboard } from '../pages/depot/Dashboard';
import { DepotComplaintsQueue } from '../pages/depot/Complaints';
import { ComplaintDetails } from '../pages/depot/ComplaintDetails';
import { DepotBusesMaster } from '../pages/depot/Buses';
import { DepotRoutes } from '../pages/depot/Routes';
import { SmsOutboxLogPage } from '../pages/depot/Outbox';

// Conductor Update Page (Public, mobile-first)
import { ConductorUpdatePage } from '../pages/conductor/ConductorUpdatePage';

// Admin Pages
import { AdminDashboard } from '../pages/admin/Dashboard';
import { AdminDepotDetail } from '../pages/admin/AdminDepotDetail';

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Public Auth Route */}
      <Route path="/auth" element={<AuthPage />} />

      {/* Passenger Mobile-First Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <PassengerHome />
          </ProtectedRoute>
        }
      />
      <Route
        path="/report"
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <ReportComplaint />
          </ProtectedRoute>
        }
      />
      <Route path="/report/success" element={<ComplaintSubmitted />} />
      <Route path="/track" element={<TrackComplaint />} />
      <Route path="/track/:id" element={<TrackComplaint />} />
      <Route
        path="/profile"
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Conductor Public Action Update Token Pages */}
      <Route path="/u/:token" element={<ConductorUpdatePage />} />
      <Route path="/conductor/update" element={<ConductorUpdatePage />} />

      {/* Depot Portal Routes (Protected for Depot Head) */}
      <Route
        path="/depot"
        element={
          <ProtectedRoute allowedRoles={['depot_head']}>
            <DepotDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/depot/complaints"
        element={
          <ProtectedRoute allowedRoles={['depot_head']}>
            <DepotComplaintsQueue />
          </ProtectedRoute>
        }
      />
      <Route
        path="/depot/complaints/:id"
        element={
          <ProtectedRoute allowedRoles={['depot_head']}>
            <ComplaintDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/depot/buses"
        element={
          <ProtectedRoute allowedRoles={['depot_head']}>
            <DepotBusesMaster />
          </ProtectedRoute>
        }
      />
      <Route
        path="/depot/routes"
        element={
          <ProtectedRoute allowedRoles={['depot_head']}>
            <DepotRoutes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/depot/outbox"
        element={
          <ProtectedRoute allowedRoles={['depot_head']}>
            <SmsOutboxLogPage />
          </ProtectedRoute>
        }
      />

      {/* Admin & Overview Routes (Protected for Admin & Depot Head) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin', 'depot_head']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/depots"
        element={
          <ProtectedRoute allowedRoles={['admin', 'depot_head']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/depot/:depotId"
        element={
          <ProtectedRoute allowedRoles={['admin', 'depot_head']}>
            <AdminDepotDetail />
          </ProtectedRoute>
        }
      />

      {/* Fallback Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
