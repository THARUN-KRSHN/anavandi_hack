import React, { useState, useEffect } from 'react';
import { fetchCrewMembers } from '../../services/crewService';
import type { CrewMember } from '../../types/crew';
import { CrewCard } from '../../components/crew/CrewCard';
import { Input } from '../../components/ui/Input';
import { Search, ShieldCheck } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';

export const DepotCrewDirectory: React.FC = () => {
  const { user } = useAuth();
  const [crewList, setCrewList] = useState<CrewMember[]>([]);
  const [searchPEN, setSearchPEN] = useState('');

  useEffect(() => {
    fetchCrewMembers(user?.depotId).then(setCrewList);
  }, [user?.depotId]);

  const filtered = crewList.filter(
    (c) =>
      c.pen.toLowerCase().includes(searchPEN.toLowerCase()) ||
      c.name.toLowerCase().includes(searchPEN.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#EAECF0]">
        <div>
          <h1 className="text-2xl font-extrabold text-[#171717] tracking-tight">
            Authorized Crew & PEN Directory
          </h1>
          <p className="text-xs text-[#667085] mt-1">
            Role-protected employee master records and duty assignments.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-xl border border-amber-200 text-xs font-semibold text-amber-800">
          <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Restricted Depot Access</span>
        </div>
      </div>

      <div className="max-w-md">
        <Input
          placeholder="Search by PEN (e.g. PEN-88421) or Name..."
          value={searchPEN}
          onChange={(e) => setSearchPEN(e.target.value)}
          icon={<Search className="w-4 h-4 text-[#667085]" />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((crew) => (
          <CrewCard key={crew.pen} crew={crew} />
        ))}
      </div>
    </div>
  );
};
