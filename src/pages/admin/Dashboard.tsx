import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchDepots } from '../../services/depotService';
import { fetchComplaints } from '../../services/complaintsService';
import type { DepotMaster } from '../../types/depot';
import { AdminDepotMap } from '../../components/map/AdminDepotMap';
import { Building2, ArrowRight } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [depots, setDepots] = useState<DepotMaster[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('all');

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

