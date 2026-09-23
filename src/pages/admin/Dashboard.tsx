import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchSystemMetrics,
  fetchDepotWorkload,
  fetchRecurringIssueAlerts,
} from '../../services/analyticsService';
import type { SystemMetrics, DepotWorkload, RecurringIssueAlert } from '../../types/analytics';
import { StatCard } from '../../components/dashboard/StatCard';
import { DepotWorkloadChart } from '../../components/dashboard/DepotWorkloadChart';
import { RecurringAlertCard } from '../../components/dashboard/RecurringAlertCard';
import { Button } from '../../components/ui/Button';
import { ShieldCheck, BarChart3, Inbox, CheckCircle2, ShieldAlert } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [workloads, setWorkloads] = useState<DepotWorkload[]>([]);
  const [alerts, setAlerts] = useState<RecurringIssueAlert[]>([]);

  useEffect(() => {
    Promise.all([
      fetchSystemMetrics(),
      fetchDepotWorkload(),
      fetchRecurringIssueAlerts(),
    ]).then(([m, w, a]) => {
      setMetrics(m);
      setWorkloads(w);
      setAlerts(a);
    });
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#EAECF0]">
        <div>
          <h1 className="text-2xl font-extrabold text-[#171717] tracking-tight">
            Statewide Grievance Governance Overview
          </h1>
          <p className="text-xs text-[#667085] mt-1">
            Aggregated & anonymized intelligence across all KSRTC depots and route corridors.
          </p>
        </div>
        <Button
          variant="primary"
          icon={<BarChart3 className="w-4 h-4" />}
          onClick={() => navigate('/admin/analytics')}
        >
          View Full Analytics & SLA
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Complaints"
          value={metrics?.totalComplaints || 142}
          label="All time registered"
          icon={<Inbox className="w-5 h-5 text-gray-700" />}
        />
        <StatCard
          title="Open Queue"
          value={metrics?.openComplaints || 18}
          label="Under active triage"
          icon={<Inbox className="w-5 h-5 text-blue-600" />}
        />
        <StatCard
          title="Resolved Today"
          value={metrics?.resolvedToday || 24}
          variant="success"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        />
        <StatCard
          title="Overdue (Breached)"
          value={metrics?.overdueCount || 4}
          variant="danger"
          icon={<ShieldAlert className="w-5 h-5 text-[#D92D20]" />}
        />
        <StatCard
          title="SLA Compliance"
          value={`${metrics?.slaComplianceRate || 91.2}%`}
          label="Target > 90%"
          variant="success"
          icon={<ShieldCheck className="w-5 h-5 text-emerald-600" />}
        />
      </div>

      {/* Recurring Issue Alerts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#171717] flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#D92D20]" />
            <span>Recurring Issue Anomaly Alerts</span>
          </h2>
          <span className="text-xs text-[#667085]">Auto-detected pattern hotspots</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alerts.map((alert) => (
            <RecurringAlertCard
              key={alert.id}
              alert={alert}
              onInspect={() => navigate('/admin/routes')}
            />
          ))}
        </div>
      </div>

      {/* Depot Workload Chart */}
      <DepotWorkloadChart data={workloads} />
    </div>
  );
};
