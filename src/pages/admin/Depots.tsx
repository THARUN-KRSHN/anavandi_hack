import React, { useState, useEffect } from 'react';
import { fetchDepotWorkload } from '../../services/analyticsService';
import { mockDepots } from '../../data/mock/depotsData';
import type { DepotWorkload } from '../../types/analytics';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Building2, Phone, Mail, MapPin } from 'lucide-react';

export const AdminDepotsIndex: React.FC = () => {
  const [workloads, setWorkloads] = useState<DepotWorkload[]>([]);

  useEffect(() => {
    fetchDepotWorkload().then(setWorkloads);
  }, []);

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-[#EAECF0]">
        <h1 className="text-2xl font-extrabold text-[#171717] tracking-tight">
          Depot Performance Index
        </h1>
        <p className="text-xs text-[#667085] mt-1">
          Workload, fleet volume, and SLA compliance metrics for all depots.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockDepots.map((depot) => {
          const wl = workloads.find((w) => w.depotId === depot.id);
          return (
            <Card key={depot.id} className="space-y-4">
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
                <Badge variant={wl?.slaCompliance && wl.slaCompliance > 85 ? 'success' : 'warning'}>
                  SLA: {wl?.slaCompliance || 92}%
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-2 p-3 bg-[#F9FAFB] rounded-xl border border-[#EAECF0] text-center text-xs">
                <div>
                  <span className="text-[#667085] block">Total Fleet</span>
                  <span className="font-bold text-[#171717] text-sm">{depot.totalBuses} buses</span>
                </div>
                <div>
                  <span className="text-[#667085] block">Open Cases</span>
                  <span className="font-bold text-blue-600 text-sm">{depot.openComplaints}</span>
                </div>
                <div>
                  <span className="text-[#667085] block">Overdue</span>
                  <span className="font-bold text-[#D92D20] text-sm">{depot.overdueComplaints}</span>
                </div>
              </div>

              <div className="space-y-1 text-xs text-[#667085] pt-2 border-t border-[#EAECF0]">
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{depot.phone}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{depot.email}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
