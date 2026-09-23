import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchComplaints } from '../../services/complaintsService';
import type { Complaint } from '../../types/complaint';
import { StatusBadge } from '../../components/complaint/StatusBadge';
import { formatDate } from '../../utils/dateUtils';
import { FileText, Search, CheckCircle2, Clock, AlertCircle, ArrowRight, Plus } from 'lucide-react';

export const PassengerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComplaints()
      .then(setComplaints)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const total = complaints.length;
  const active = complaints.filter((c) => !['resolved', 'escalated'].includes(c.status)).length;
  const resolved = complaints.filter((c) => c.status === 'resolved').length;
  const escalated = complaints.filter((c) => c.status === 'escalated').length;

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 pb-28 space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#171717] to-[#2d2d2d] text-white rounded-[28px] p-6 shadow-lg">
        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 block">
          PASSENGER PORTAL
        </span>
        <h1 className="text-xl font-black mt-1">
          Welcome, {user?.name || 'Passenger'} 👋
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          {total === 0
            ? 'No grievances filed yet. Report any issue below.'
            : `You have ${active} active ${active === 1 ? 'complaint' : 'complaints'} under review.`}
        </p>

        <div className="mt-4 flex gap-3">
          <Link to="/report">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-[#D92D20] hover:bg-red-700 text-white text-xs font-bold rounded-full shadow-md transition-all">
              <Plus className="w-4 h-4" />
              Register Complaint
            </button>
          </Link>
          <Link to="/track">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-full transition-all border border-white/20">
              <Search className="w-4 h-4" />
              Track by Reference
            </button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: total, icon: <FileText className="w-4 h-4 text-blue-500" />, color: 'text-blue-600' },
          { label: 'Active', value: active, icon: <Clock className="w-4 h-4 text-amber-500" />, color: 'text-amber-600' },
          { label: 'Resolved', value: resolved, icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, color: 'text-emerald-600' },
          { label: 'Escalated', value: escalated, icon: <AlertCircle className="w-4 h-4 text-red-500" />, color: 'text-red-600' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-[20px] border border-[#EAECF0] p-4 shadow-xs space-y-1 text-center"
          >
            <div className="flex justify-center">{stat.icon}</div>
            <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
            <div className="text-[10px] font-bold uppercase text-[#667085]">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Complaints List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-[#171717]">My Complaints</h2>
          <Link to="/track" className="text-xs font-bold text-[#D92D20] flex items-center gap-1 hover:underline">
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="py-10 text-center">
            <div className="w-6 h-6 border-2 border-[#D92D20] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-[#667085]">Loading your complaints...</p>
          </div>
        ) : complaints.length === 0 ? (
          <div className="py-10 text-center bg-white rounded-2xl border border-[#EAECF0] space-y-3">
            <FileText className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="text-sm font-bold text-[#171717]">No Complaints Filed Yet</p>
            <p className="text-xs text-[#667085]">Use the button above to report any bus service issue.</p>
          </div>
        ) : (
          complaints.slice(0, 10).map((c) => (
            <button
              key={c.id}
              onClick={() => navigate(`/track/${c.reference}`)}
              className="w-full bg-white rounded-[20px] border border-[#EAECF0] shadow-xs p-4 flex items-center justify-between gap-4 hover:border-gray-300 hover:shadow-sm transition-all text-left"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-mono text-xs font-bold text-[#D92D20] bg-red-50 px-2 py-0.5 rounded-lg border border-red-100">
                    {c.reference}
                  </span>
                  <StatusBadge status={c.status} />
                </div>
                <p className="text-xs font-semibold text-[#171717]">{c.categoryLabel}</p>
                {c.busNumber && (
                  <p className="text-[11px] text-[#667085] mt-0.5 font-mono">Bus: {c.busNumber}</p>
                )}
                <p className="text-[11px] text-[#667085] mt-0.5">{formatDate(c.createdAt)}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#667085] shrink-0" />
            </button>
          ))
        )}
      </div>
    </div>
  );
};
