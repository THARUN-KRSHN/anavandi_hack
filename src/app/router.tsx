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

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Passenger Routes */}
      <Route path="/" element={<PassengerHome />} />
      <Route path="/report" element={<ReportComplaint />} />
      <Route path="/report/success" element={<ComplaintSubmitted />} />
      <Route path="/track" element={<TrackComplaint />} />
      <Route path="/track/:id" element={<TrackComplaint />} />

      {/* Depot Portal Routes */}
      <Route path="/depot" element={<DepotDashboard />} />
      <Route path="/depot/complaints" element={<DepotComplaintsQueue />} />
      <Route path="/depot/complaints/:id" element={<ComplaintDetails />} />
      <Route path="/depot/escalations" element={<DepotEscalations />} />
      <Route path="/depot/crew" element={<DepotCrewDirectory />} />
      <Route path="/depot/buses" element={<DepotBusesMaster />} />

      {/* Admin Portal Routes */}
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/analytics" element={<AdminAnalytics />} />
      <Route path="/admin/complaints" element={<AdminComplaintsLog />} />
      <Route path="/admin/depots" element={<AdminDepotsIndex />} />
      <Route path="/admin/routes" element={<AdminRoutesAnalytics />} />

      {/* Fallback Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
