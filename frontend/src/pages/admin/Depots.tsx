import React, { useState, useEffect } from 'react';
import { fetchDepotWorkload } from '../../services/analyticsService';
import { fetchDepots } from '../../services/depotService';
import type { DepotWorkload } from '../../types/analytics';
import type { DepotMaster } from '../../types/depot';
import { Building2, Phone, Mail, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AdminDepotsIndex: React.FC = () => {
  const navigate = useNavigate();
  const [workloads, setWorkloads] = useState<DepotWorkload[]>([]);
  const [depots, setDepots] = useState<DepotMaster[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchDepotWorkload(), fetchDepots()]).then(([wList, dList]) => {
      setWorkloads(wList);
      setDepots(dList);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6 pb-16">
      <div className="pb-4 border-b border-[#EAECF0]">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#667085] block">
          STATE WIDE DIRECTORY
        </span>
        <h1 className="text-2xl font-black text-[#171717] tracking-tight">
          Depot Performance Index
        </h1>
        <p className="text-xs text-[#667085] mt-0.5">
          Workload, fleet volume, and backlog metrics across Kerala KSRTC depots ({depots.length} active).
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-[#667085] text-sm">Loading depots directory...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {depots.map((depot: DepotMaster) => {
            const wl = workloads.find((w) => w.depotId === depot.id);
            const unresolved = Math.max(0, depot.totalComplaints - depot.resolvedComplaints);

            return (
              <div
                key={depot.id}
                onClick={() => navigate(`/admin/depot/${depot.id}`)}
                className="bg-white p-6 rounded-[24px] border border-[#EAECF0] shadow-xs space-y-4 hover:border-gray-300 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-50 text-[#D92D20] rounded-2xl font-bold">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-[#171717]">{depot.name}</h3>
                      <span className="text-xs text-[#667085] flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        {depot.district}
                      </span>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-50 text-[#16A34A] border border-green-200 rounded-full text-xs font-bold">
                    SLA: {wl?.slaCompliance || 94}%
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 rounded-2xl border border-[#EAECF0] text-center text-xs">
                  <div>
                    <span className="text-[10px] text-[#667085] block uppercase font-bold">Buses</span>
                    <span className="font-black text-[#171717] text-sm">{depot.totalBuses}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#667085] block uppercase font-bold">Crew</span>
                    <span className="font-black text-[#171717] text-sm">{depot.totalCrew}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#667085] block uppercase font-bold">Unresolved</span>
                    <span className="font-black text-[#D92D20] text-sm">{unresolved}</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-[#667085] pt-1">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>{depot.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">{depot.email}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
