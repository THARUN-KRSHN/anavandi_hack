import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Passenger Pages
import { Home as PassengerHome } from '../pages/passenger/Home';
import { ReportComplaint } from '../pages/passenger/ReportComplaint';
import { ComplaintSubmitted } from '../pages/passenger/ComplaintSubmitted';
import { TrackComplaint } from '../pages/passenger/TrackComplaint';

// Depot Pages
import { DepotDashboard } from '../pages/depot/Dashboard';
import { DepotComplaintsQueue } from '../pages/depot/Complaints';
import { ComplaintDetails } from '../pages/depot/ComplaintDetails';
import { DepotEscalations } from '../pages/depot/Escalations';
import { DepotCrewDirectory } from '../pages/depot/Crew';
import { DepotBusesMaster } from '../pages/depot/Buses';

// Admin Pages
import { AdminDashboard } from '../pages/admin/Dashboard';
import { AdminAnalytics } from '../pages/admin/Analytics';
import { AdminComplaintsLog } from '../pages/admin/Complaints';
import { AdminDepotsIndex } from '../pages/admin/Depots';
import { AdminRoutesAnalytics } from '../pages/admin/Routes';
import { Login } from '../pages/auth/Login';
import { Signup } from '../pages/auth/Signup';
import { useAuth } from './AuthContext';

const ProtectedRoute: React.FC<{ roles?: string[]; children: React.ReactNode }> = ({ roles, children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="py-20 text-center text-sm text-[#667085]">Loading session...</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: window.location.pathname }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to={user.role === 'ADMIN' ? '/admin' : user.role === 'DEPOT_HEAD' ? '/depot' : '/'} replace />;
  return <>{children}</>;
};

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      {/* Passenger Routes */}
      <Route path="/" element={<ProtectedRoute roles={["USER"]}><PassengerHome /></ProtectedRoute>} />
      <Route path="/report" element={<ProtectedRoute roles={["USER"]}><ReportComplaint /></ProtectedRoute>} />
      <Route path="/report/success" element={<ProtectedRoute roles={["USER"]}><ComplaintSubmitted /></ProtectedRoute>} />
      <Route path="/track" element={<ProtectedRoute roles={["USER"]}><TrackComplaint /></ProtectedRoute>} />
      <Route path="/track/:id" element={<ProtectedRoute roles={["USER"]}><TrackComplaint /></ProtectedRoute>} />

      {/* Depot Portal Routes */}
      <Route path="/depot" element={<ProtectedRoute roles={["DEPOT_HEAD"]}><DepotDashboard /></ProtectedRoute>} />
      <Route path="/depot/complaints" element={<ProtectedRoute roles={["DEPOT_HEAD"]}><DepotComplaintsQueue /></ProtectedRoute>} />
      <Route path="/depot/complaints/:id" element={<ProtectedRoute roles={["DEPOT_HEAD"]}><ComplaintDetails /></ProtectedRoute>} />
      <Route path="/depot/escalations" element={<ProtectedRoute roles={["DEPOT_HEAD"]}><DepotEscalations /></ProtectedRoute>} />
      <Route path="/depot/crew" element={<ProtectedRoute roles={["DEPOT_HEAD"]}><DepotCrewDirectory /></ProtectedRoute>} />
      <Route path="/depot/buses" element={<ProtectedRoute roles={["DEPOT_HEAD"]}><DepotBusesMaster /></ProtectedRoute>} />

      {/* Admin Portal Routes */}
      <Route path="/admin" element={<ProtectedRoute roles={["ADMIN"]}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/analytics" element={<ProtectedRoute roles={["ADMIN"]}><AdminAnalytics /></ProtectedRoute>} />
      <Route path="/admin/complaints" element={<ProtectedRoute roles={["ADMIN"]}><AdminComplaintsLog /></ProtectedRoute>} />
      <Route path="/admin/depots" element={<ProtectedRoute roles={["ADMIN"]}><AdminDepotsIndex /></ProtectedRoute>} />
      <Route path="/admin/routes" element={<ProtectedRoute roles={["ADMIN"]}><AdminRoutesAnalytics /></ProtectedRoute>} />

      {/* Fallback Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
