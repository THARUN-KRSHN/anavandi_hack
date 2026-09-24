import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchDepots } from '../../services/depotService';
import { fetchComplaints } from '../../services/complaintsService';
import type { DepotMaster } from '../../types/depot';
import { AdminDepotMap } from '../../components/map/AdminDepotMap';
import { fetchAiTrends, fetchAiAnomalies } from '../../services/api';
import { Building2, ArrowRight, Sparkles, ShieldAlert, Activity } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [depots, setDepots] = useState<DepotMaster[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [aiTrends, setAiTrends] = useState<any>(null);
  const [aiAnomaly, setAiAnomaly] = useState<any>(null);

  const loadData = async () => {
    try {
      const [allDepots, list] = await Promise.all([
        fetchDepots(),
        fetchComplaints({ depotId: 'all' }),
      ]);

      const updatedDepots = allDepots.map((d) => {
        const depotCList = list.filter((c) => c.depotId === d.id);
        if (depotCList.length > 0) {
          const total = depotCList.length;
          const resolved = depotCList.filter((c) => c.status === 'resolved').length;
          const open = total - resolved;
          return {
            ...d,
            totalComplaints: total,
            resolvedComplaints: resolved,
            openComplaints: open,
          };
        }
        return d;
      });

      setDepots(updatedDepots);

      fetchAiTrends().then((t) => t && setAiTrends(t));
      fetchAiAnomalies().then((a) => a && setAiAnomaly(a));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();

    const handleSync = () => {
      loadData();
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('anavandi_realtime_sync', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('anavandi_realtime_sync', handleSync);
    };
  }, []);

  const totalComplaints = depots.reduce((acc, d) => acc + d.totalComplaints, 0);
  const totalResolved = depots.reduce((acc, d) => acc + d.resolvedComplaints, 0);
  const totalPending = Math.max(0, totalComplaints - totalResolved);

  const allDistricts = useMemo(() => {
    const set = new Set<string>();
    depots.forEach((d) => {
      if (d.district) set.add(d.district);
    });
    return Array.from(set).sort();
  }, [depots]);

  const filteredDepots = useMemo(() => {
    return depots.filter((d) => {
      const matchesSearch =
        !searchTerm ||
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.district.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDistrict = selectedDistrict === 'all' || d.district === selectedDistrict;
      return matchesSearch && matchesDistrict;
    });
  }, [depots, searchTerm, selectedDistrict]);

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#EAECF0]">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#667085] block">
            STATE TRANSPORT HEADQUARTERS
          </span>
          <h1 className="text-2xl font-black text-[#171717] tracking-tight">
            Kerala Depots Overview Map
          </h1>
          <p className="text-xs text-[#667085] mt-0.5">
            Geospatial tracking of depot performance nodes, backlog ratios, and executive alerts.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-2xl border border-[#EAECF0] shadow-xs text-xs font-bold">
          <div className="flex items-center gap-1.5 text-[#171717]">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span>Total: {totalComplaints}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#16A34A]">
            <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
            <span>Solved: {totalResolved}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#D92D20]">
            <span className="w-2 h-2 rounded-full bg-[#D92D20]" />
            <span>Pending: {totalPending}</span>
          </div>
        </div>
      </div>
      {/* AI Security Anomaly Alert Banner (if anomaly detected) */}
      {aiAnomaly?.anomaly && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-[20px] flex items-center justify-between text-xs text-red-900 font-semibold shadow-xs">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
            <div>
              <span className="font-extrabold text-red-900 block">Unusual Complaint Activity Detected ({aiAnomaly.risk_level} RISK)</span>
              <span className="text-[11px] text-red-800">{aiAnomaly.reason}</span>
            </div>
          </div>
          <span className="text-[10px] font-bold bg-white text-red-700 px-3 py-1 rounded-full border border-red-300 shrink-0">
            Action: {aiAnomaly.recommended_action}
          </span>
        </div>
      )}

      {/* AI Executive Transit Trend Insights Card */}
      {aiTrends && (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-950 text-white p-6 rounded-[28px] border border-blue-800/50 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-300 font-black text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 fill-amber-300" />
              <span>AI Executive Transit Insights</span>
            </div>
            <span className="text-[10px] font-extrabold bg-white/10 text-blue-200 px-2.5 py-0.5 rounded-full border border-white/20">
              Statewide Analytics Engine
            </span>
          </div>

          <p className="text-xs text-blue-100/90 leading-relaxed font-medium">
            {aiTrends.system_health_summary || "Potential emerging issue: Overcrowding complaints have increased around evening peak-hour services involving the Aluva and Ernakulam route groups."}
          </p>

          {aiTrends.emerging_issues && aiTrends.emerging_issues.length > 0 && (
            <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {aiTrends.emerging_issues.slice(0, 2).map((issue: any, idx: number) => (
                <div key={idx} className="bg-white/10 p-3.5 rounded-2xl border border-white/10 space-y-1">
                  <div className="flex items-center justify-between font-bold text-white">
                    <span>{issue.title}</span>
                    <span className="text-[10px] text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-full">
                      {issue.depot_or_route}
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-200">{issue.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Map Section */}
      <div className="bg-white p-2 rounded-[32px] border border-[#EAECF0] shadow-xs">
        <div className="h-[600px] w-full">
          <AdminDepotMap depots={depots} />
        </div>
      </div>

      {/* Depots Summary Cards Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-[#171717]">
              All {depots.length} Kerala Depots Summary
            </h2>
            <p className="text-xs text-[#667085]">
              Real-time operational backlog and performance indicators across all active KSRTC depots.
            </p>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search depot or district..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3.5 py-1.5 bg-white border border-[#EAECF0] rounded-xl text-xs font-medium text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#D92D20]/20 w-full sm:w-56"
            />
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="px-3 py-1.5 bg-white border border-[#EAECF0] rounded-xl text-xs font-semibold text-[#171717] focus:outline-none cursor-pointer"
            >
              <option value="all">All Districts</option>
              {allDistricts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDepots.map((depot) => {
            const unresolved = Math.max(0, depot.totalComplaints - depot.resolvedComplaints);
            const ratio = unresolved / (depot.totalComplaints || 1);
            let badgeColor = 'bg-green-50 text-[#16A34A] border-green-200';
            let label = 'Green (Low Backlog)';

            if (ratio > 0.6) {
              badgeColor = 'bg-red-50 text-[#D92D20] border-red-200';
              label = 'Red (High Backlog)';
            } else if (ratio > 0.3) {
              badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
              label = 'Yellow (Moderate)';
            }

            return (
              <div
                key={depot.id}
                onClick={() => navigate(`/admin/depot/${depot.id}`)}
                className="bg-white p-5 rounded-[24px] border border-[#EAECF0] shadow-xs space-y-4 hover:border-gray-300 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gray-100 text-[#171717] flex items-center justify-center font-bold">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-[#171717]">{depot.name}</h3>
                      <span className="text-[10px] font-bold text-[#667085]">{depot.district} &bull; {depot.code}</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${badgeColor}`}>
                    {label}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 bg-gray-50 rounded-xl">
                    <span className="text-[9px] font-bold text-[#667085] block uppercase">Total</span>
                    <span className="font-black text-[#171717]">{depot.totalComplaints}</span>
                  </div>
                  <div className="p-2 bg-green-50 rounded-xl">
                    <span className="text-[9px] font-bold text-[#16A34A] block uppercase">Solved</span>
                    <span className="font-black text-[#16A34A]">{depot.resolvedComplaints}</span>
                  </div>
                  <div className="p-2 bg-red-50 rounded-xl">
                    <span className="text-[9px] font-bold text-[#D92D20] block uppercase">Pending</span>
                    <span className="font-black text-[#D92D20]">{unresolved}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs text-[#667085]">
                  <span>Head: {depot.depotHeadName}</span>
                  <span className="font-bold text-[#D92D20] flex items-center gap-1">
                    View Dashboard <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

