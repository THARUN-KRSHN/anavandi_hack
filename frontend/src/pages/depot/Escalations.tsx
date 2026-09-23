import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchComplaints } from '../../services/complaintsService';
import type { Complaint } from '../../types/complaint';
import { ComplaintCard } from '../../components/complaint/ComplaintCard';
import { ShieldAlert, AlertOctagon } from 'lucide-react';

export const DepotEscalations: React.FC = () => {
  const navigate = useNavigate();
  const [escalatedList, setEscalatedList] = useState<Complaint[]>([]);

  useEffect(() => {
    fetchComplaints({ depotId: 'DEP-TVM' }).then((all) => {
      const filtered = all.filter((c) => c.status === 'escalated' || c.priority === 'critical');
      setEscalatedList(filtered);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-[#EAECF0]">
        <div className="p-3 bg-red-100 text-[#D92D20] rounded-2xl">
          <ShieldAlert className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-[#171717] tracking-tight">
            Escalated & SLA Breached Queue
          </h1>
          <p className="text-xs text-[#667085] mt-0.5">
            Cases exceeding 12-hour resolution window or flagged critical safety risk.
          </p>
        </div>
      </div>

      {escalatedList.length === 0 ? (
        <div className="p-12 text-center text-[#667085] bg-white rounded-2xl border border-[#EAECF0] space-y-2">
          <AlertOctagon className="w-8 h-8 text-emerald-500 mx-auto" />
          <h3 className="font-bold text-[#171717]">No Escalated Cases</h3>
          <p className="text-xs">All high-priority depot grievances are within SLA target timelines.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {escalatedList.map((c) => (
            <ComplaintCard
              key={c.id}
              complaint={c}
              onClick={() => navigate(`/depot/complaints/${c.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
