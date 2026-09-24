import React, { useState, useEffect } from 'react';
import { fetchRoutes } from '../../services/busesService';
import { fetchRecurringIssueAlerts } from '../../services/analyticsService';
import type { RecurringIssueAlert } from '../../types/analytics';
import type { Route } from '../../types/bus';
import { RecurringAlertCard } from '../../components/dashboard/RecurringAlertCard';
import { Card } from '../../components/ui/Card';
import { Route as RouteIcon } from 'lucide-react';

export const AdminRoutesAnalytics: React.FC = () => {
  const [alerts, setAlerts] = useState<RecurringIssueAlert[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);

  useEffect(() => {
    fetchRecurringIssueAlerts().then(setAlerts);
    fetchRoutes().then(setRoutes);
  }, []);

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-[#EAECF0]">
        <h1 className="text-2xl font-extrabold text-[#171717] tracking-tight">
          Route Hotspots & Recurring Issues
        </h1>
        <p className="text-xs text-[#667085] mt-1">
          Corridor-level anomaly detection for recurring ticketing, staff, or cleanliness complaints.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-[#171717]">Active Pattern Hotspots</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alerts.map((alert) => (
            <RecurringAlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      </div>

      <div className="space-y-4 pt-4">
        <h2 className="text-lg font-bold text-[#171717]">Main Route Corridors Master</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {routes.slice(0, 12).map((route) => (
            <Card key={route.id} className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <RouteIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#171717]">{route.name}</h3>
                  <span className="text-xs font-mono font-bold text-[#D92D20]">{route.code}</span>
                </div>
              </div>

              <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#EAECF0] text-xs space-y-1.5 text-[#344054]">
                <div className="flex justify-between">
                  <span className="text-[#667085]">Active Buses:</span>
                  <span className="font-bold">{route.activeBusesCount} vehicles</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#667085]">Distance:</span>
                  <span className="font-bold">{route.distanceKm} km ({route.totalStops} stops)</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
