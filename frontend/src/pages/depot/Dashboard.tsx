import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchComplaints } from '../../services/complaintsService';
import type { Complaint } from '../../types/complaint';
import { StatCard } from '../../components/dashboard/StatCard';
import { ComplaintCard } from '../../components/complaint/ComplaintCard';
import { DepotWorkloadChart } from '../../components/dashboard/DepotWorkloadChart';
import { ThreeScene } from '../../components/three/ThreeScene';
import { fetchDepotWorkload } from '../../services/analyticsService';
import type { DepotWorkload } from '../../types/analytics';
import { Button } from '../../components/ui/Button';
import { Inbox, AlertOctagon, CheckCircle2, ShieldAlert, ArrowRight, RefreshCw } from 'lucide-react';

export const DepotDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [workload, setWorkload] = useState<DepotWorkload[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cList, wList] = await Promise.all([
        fetchComplaints({ depotId: 'DEP-TVM' }),
        fetchDepotWorkload(),
      ]);
      setComplaints(cList);
      setWorkload(wList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCount = complaints.filter((c) => c.status !== 'resolved').length;
  const overdueCount = complaints.filter((c) => c.status === 'escalated').length;
  const criticalCount = complaints.filter((c) => c.priority === 'critical').length;
  const resolvedCount = complaints.filter((c) => c.status === 'resolved').length;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#EAECF0]">
        <div>
          <h1 className="text-2xl font-extrabold text-[#171717] tracking-tight">
            Depot Operations Dashboard
          </h1>
          <p className="text-xs text-[#667085] mt-1">
            Real-time case triage, duty roster matching, and resolution management.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={loadData}>
            Refresh Queue
          </Button>
          <Link to="/depot/complaints">
            <Button variant="primary" size="sm" icon={<Inbox className="w-4 h-4" />}>
              Open Full Case Queue
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Open Complaints"
          value={openCount}
          label="Active cases in queue"
          icon={<Inbox className="w-5 h-5 text-blue-600" />}
        />
        <StatCard
          title="Overdue & SLA Breached"
          value={overdueCount}
          label="Requires immediate manager action"
          variant="danger"
          icon={<AlertOctagon className="w-5 h-5 text-[#D92D20]" />}
        />
        <StatCard
          title="Critical Priority"
          value={criticalCount}
          label="Safety or overspeeding alerts"
          variant="warning"
          icon={<ShieldAlert className="w-5 h-5 text-amber-600" />}
        />
        <StatCard
          title="Resolved Today"
          value={resolvedCount}
          label="Depot SLA target achieved"
          variant="success"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        />
      </div>

      {/* Main Grid: Case Queue & 3D Depot Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Recent Cases Column */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#171717]">Recent Case Queue</h2>
            <Link to="/depot/complaints" className="text-xs font-semibold text-[#D92D20] hover:underline flex items-center gap-1">
              View All ({complaints.length}) <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center text-[#667085] bg-white rounded-2xl border border-[#EAECF0]">
              Loading active queue...
            </div>
          ) : complaints.length === 0 ? (
            <div className="p-8 text-center text-[#667085] bg-white rounded-2xl border border-[#EAECF0]">
              No active cases in queue. All depot grievances resolved!
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {complaints.slice(0, 3).map((c) => (
                <ComplaintCard
                  key={c.id}
                  complaint={c}
                  onClick={() => navigate(`/depot/complaints/${c.id}`)}
                />
              ))}
            </div>
          )}
        </div>

        {/* 3D Depot Visual Accent & Workload */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-4 rounded-3xl border border-[#EAECF0] shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#667085] mb-2">
              Depot Campus 3D Monitoring
            </h3>
            <div className="h-[220px] rounded-2xl overflow-hidden bg-gray-50">
              <ThreeScene type="depot_overview" compact />
            </div>
          </div>

          <DepotWorkloadChart data={workload} />
        </div>
      </div>
    </div>
  );
};
