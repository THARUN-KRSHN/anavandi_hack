import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchComplaints } from '../../services/complaintsService';
import type { Complaint } from '../../types/complaint';
import { ComplaintCard } from '../../components/complaint/ComplaintCard';
import { Input, Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Search, Filter, RefreshCw } from 'lucide-react';

export const DepotComplaintsQueue: React.FC = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchComplaints({
        status: statusFilter,
        category: categoryFilter,
        priority: priorityFilter,
        search: searchQuery,
      });
      setComplaints(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, categoryFilter, priorityFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#EAECF0]">
        <div>
          <h1 className="text-2xl font-extrabold text-[#171717] tracking-tight">
            Depot Case Queue & Triage
          </h1>
          <p className="text-xs text-[#667085] mt-1">
            Filter by status, priority, category, bus registration, or reference code.
          </p>
        </div>
        <Button variant="outline" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={loadData}>
          Refresh Queue
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#EAECF0] shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-[#667085] uppercase tracking-wider">
          <Filter className="w-4 h-4 text-[#D92D20]" />
          <span>Queue Filters:</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input
            placeholder="Search Reference, Bus, Details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4 text-[#667085]" />}
          />

          <Select
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'submitted', label: 'Submitted' },
              { value: 'assigned', label: 'Assigned' },
              { value: 'acknowledged', label: 'Acknowledged' },
              { value: 'investigating', label: 'Investigating' },
              { value: 'resolved', label: 'Resolved' },
              { value: 'escalated', label: 'Escalated' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />

          <Select
            options={[
              { value: 'all', label: 'All Priorities' },
              { value: 'normal', label: 'Normal' },
              { value: 'high', label: 'High' },
              { value: 'critical', label: 'Critical' },
            ]}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          />

          <Select
            options={[
              { value: 'all', label: 'All Categories' },
              { value: 'conductor_staff', label: 'Conductor / Staff' },
              { value: 'cleanliness', label: 'Cleanliness' },
              { value: 'driver', label: 'Driver / Speed' },
              { value: 'ticketing', label: 'UPI / Ticketing' },
              { value: 'safety', label: 'Safety' },
            ]}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Queue List */}
      {loading ? (
        <div className="p-12 text-center text-[#667085] bg-white rounded-2xl border border-[#EAECF0]">
          Loading queue...
        </div>
      ) : complaints.length === 0 ? (
        <div className="p-12 text-center text-[#667085] bg-white rounded-2xl border border-[#EAECF0] space-y-2">
          <h3 className="font-bold text-[#171717] text-base">No cases match the selected filters</h3>
          <p className="text-xs">Try resetting filters to view all cases.</p>
          <Button variant="outline" size="sm" onClick={() => { setStatusFilter('all'); setCategoryFilter('all'); setPriorityFilter('all'); setSearchQuery(''); }}>
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {complaints.map((c) => (
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
