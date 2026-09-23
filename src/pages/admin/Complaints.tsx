import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchComplaints } from '../../services/complaintsService';
import type { Complaint } from '../../types/complaint';
import { ComplaintCard } from '../../components/complaint/ComplaintCard';
import { Select, Input } from '../../components/ui/Input';
import { Search } from 'lucide-react';

export const AdminComplaintsLog: React.FC = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [depotFilter, setDepotFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchComplaints({ depotId: depotFilter, search }).then(setComplaints);
  }, [depotFilter, search]);

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-[#EAECF0]">
        <h1 className="text-2xl font-extrabold text-[#171717] tracking-tight">
          System-Wide Grievance Audit Log
        </h1>
        <p className="text-xs text-[#667085] mt-1">
          Complete log of public complaints across all regional depots and routes.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-2xl border border-[#EAECF0]">
        <Input
          placeholder="Search by Reference, Bus, Description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search className="w-4 h-4 text-[#667085]" />}
        />

        <Select
          options={[
            { value: 'all', label: 'All Depots' },
            { value: 'DEP-TVM', label: 'Trivandrum Central Depot' },
            { value: 'DEP-EKM', label: 'Ernakulam Central Depot' },
            { value: 'DEP-CLT', label: 'Kozhikode Central Depot' },
            { value: 'DEP-TCR', label: 'Thrissur Central Depot' },
          ]}
          value={depotFilter}
          onChange={(e) => setDepotFilter(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {complaints.map((c) => (
          <ComplaintCard
            key={c.id}
            complaint={c}
            onClick={() => navigate(`/depot/complaints/${c.id}`)}
          />
        ))}
      </div>
    </div>
  );
};
