import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchComplaints } from '../../services/complaintsService';
import type { Complaint } from '../../types/complaint';
import { useAuth } from '../../context/AuthContext';
import { exportComplaintsToCsv, exportComplaintsToExcel } from '../../utils/exportUtils';
import {
  Inbox,
  CheckCircle2,
  AlertCircle,
  Search,
  Download,
  FileSpreadsheet,
  ArrowRight,
  Filter,
  Bus,
  Clock,
} from 'lucide-react';
import { COMPLAINT_CATEGORIES } from '../../constants/categories';

export const DepotDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const depotId = user?.depotId || 'DEP-EKM';
  const depotName = user?.depotName || 'Ernakulam Central Depot';

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'solved' | 'unsolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch complaints for this depot
      const list = await fetchComplaints({ depotId });
      setComplaints(list);
    } catch (err) {
      console.error('Failed to load depot complaints:', err);
    } finally {
      setLoading(false);
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
  }, [depotId]);

  // Derived metrics
  const totalCount = complaints.length;
  const resolvedCount = complaints.filter((c) => c.status === 'resolved').length;
  const openCount = totalCount - resolvedCount;

  // Filtered dataset
  const filteredComplaints = complaints.filter((c) => {
    // Category filter
    if (selectedCategory !== 'all' && c.category !== selectedCategory) {
      return false;
    }
    // Status filter (solved/unsolved)
    if (statusFilter === 'solved' && c.status !== 'resolved') {
      return false;
    }
    if (statusFilter === 'unsolved' && c.status === 'resolved') {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRef = c.reference.toLowerCase().includes(q);
      const matchBus = (c.busNumber || '').toLowerCase().includes(q);
      const matchCat = (c.categoryLabel || c.category).toLowerCase().includes(q);
      const matchDesc = c.description.toLowerCase().includes(q);
      const matchRoute = `${c.routeFrom} ${c.routeTo}`.toLowerCase().includes(q);
      if (!matchRef && !matchBus && !matchCat && !matchDesc && !matchRoute) {
        return false;
      }
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-[#16A34A] border border-green-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
          </span>
        );
      case 'acknowledged':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3.5 h-3.5" /> Acknowledged
          </span>
        );
      case 'forwarded_to_conductor':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Bus className="w-3.5 h-3.5" /> Forwarded to Conductor
          </span>
        );
      case 'submitted':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-[#D92D20] border border-red-200">
            <AlertCircle className="w-3.5 h-3.5" /> Submitted
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#EAECF0]">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#667085] block">
            DEPOT HEAD OPERATIONS DESK
          </span>
          <h1 className="text-2xl font-black text-[#171717] tracking-tight">
            {depotName} Reports
          </h1>
          <p className="text-xs text-[#667085] mt-0.5">
            Monitor incoming passenger grievances, dispatch action links to conductors, and maintain depot SLA targets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportComplaintsToCsv(filteredComplaints, `${depotId}_reports.csv`)}
            className="px-3 py-2 bg-white border border-[#EAECF0] text-[#171717] text-xs font-bold rounded-xl shadow-xs hover:bg-gray-50 flex items-center gap-1.5 transition-all"
          >
            <Download className="w-4 h-4 text-[#667085]" /> Export CSV
          </button>
          <button
            onClick={() => exportComplaintsToExcel(filteredComplaints, `${depotId}_reports.xlsx`)}
            className="px-3 py-2 bg-[#16A34A] text-white text-xs font-bold rounded-xl shadow-md hover:bg-green-700 flex items-center gap-1.5 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export Excel
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Complaints */}
        <div className="bg-white p-5 rounded-[24px] border border-[#EAECF0] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#667085] block">
              TOTAL COMPLAINTS
            </span>
            <span className="text-3xl font-black text-[#171717] mt-1 block">
              {totalCount}
            </span>
            <span className="text-xs text-[#667085]">Logged for this depot</span>
          </div>
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-[#171717]">
            <Inbox className="w-6 h-6" />
          </div>
        </div>

        {/* Open / Unsolved */}
        <div className="bg-white p-5 rounded-[24px] border border-[#EAECF0] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#D92D20] block">
              OPEN / UNSOLVED
            </span>
            <span className="text-3xl font-black text-[#D92D20] mt-1 block">
              {openCount}
            </span>
            <span className="text-xs text-[#667085]">Pending conductor resolution</span>
          </div>
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-[#D92D20]">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Resolved */}
        <div className="bg-white p-5 rounded-[24px] border border-[#EAECF0] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#16A34A] block">
              RESOLVED
            </span>
            <span className="text-3xl font-black text-[#16A34A] mt-1 block">
              {resolvedCount}
            </span>
            <span className="text-xs text-[#667085]">Action completed</span>
          </div>
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-[#16A34A]">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters & Search Controls */}
      <div className="bg-white p-4 rounded-[24px] border border-[#EAECF0] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#667085] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search reference (GRV-...), bus plate, route, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-[#EAECF0] rounded-xl text-xs font-medium text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#D92D20]/20"
            />
          </div>

          {/* Status Filter buttons */}
          <div className="flex items-center gap-1.5 shrink-0 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'all'
                  ? 'bg-white text-[#171717] shadow-xs'
                  : 'text-[#667085] hover:text-[#171717]'
              }`}
            >
              All Statuses
            </button>
            <button
              onClick={() => setStatusFilter('unsolved')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'unsolved'
                  ? 'bg-[#D92D20] text-white shadow-xs'
                  : 'text-[#667085] hover:text-[#171717]'
              }`}
            >
              Unsolved ({openCount})
            </button>
            <button
              onClick={() => setStatusFilter('solved')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'solved'
                  ? 'bg-[#16A34A] text-white shadow-xs'
                  : 'text-[#667085] hover:text-[#171717]'
              }`}
            >
              Solved ({resolvedCount})
            </button>
          </div>
        </div>

        {/* Horizontally scrollable Category Pill Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1 pb-1">
          <span className="text-[11px] font-bold text-[#667085] shrink-0 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Category:
          </span>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
              selectedCategory === 'all'
                ? 'bg-[#171717] text-white shadow-xs'
                : 'bg-gray-100 text-[#667085] hover:bg-gray-200'
            }`}
          >
            All Categories
          </button>
          {COMPLAINT_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
                selectedCategory === cat.id
                  ? 'bg-[#171717] text-white shadow-xs'
                  : 'bg-gray-100 text-[#667085] hover:bg-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Listing Table (Desktop) / Cards (Mobile) */}
      <div className="bg-white rounded-[24px] border border-[#EAECF0] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#667085] text-xs font-medium">
            Loading depot grievances...
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="p-12 text-center text-[#667085]">
            <Inbox className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-[#171717]">No reports found</p>
            <p className="text-xs text-[#667085] mt-1">Try adjusting your category or status filters.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-[#EAECF0] text-[10px] font-extrabold uppercase tracking-wider text-[#667085]">
                    <th className="py-3.5 px-4">Ref Number</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Bus Plate</th>
                    <th className="py-3.5 px-4">Route</th>
                    <th className="py-3.5 px-4">Logged Time</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {filteredComplaints.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/depot/complaints/${c.id}`)}
                      className="hover:bg-gray-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-4 px-4 font-black text-[#171717]">
                        {c.reference}
                      </td>
                      <td className="py-4 px-4 font-semibold text-[#171717]">
                        {c.categoryLabel || c.category}
                      </td>
                      <td className="py-4 px-4 font-bold text-[#171717]">
                        {c.busNumber || 'N/A'}
                      </td>
                      <td className="py-4 px-4 text-[#667085]">
                        {c.routeFrom} ➔ {c.routeTo}
                      </td>
                      <td className="py-4 px-4 text-[#667085]">
                        {c.incidentTime || new Date(c.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(c.status)}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/depot/complaints/${c.id}`);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-gray-100 text-[#171717] font-bold text-xs hover:bg-[#171717] hover:text-white transition-all inline-flex items-center gap-1"
                        >
                          View <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Cards */}
            <div className="block md:hidden divide-y divide-gray-100">
              {filteredComplaints.map((c) => (
                <div
                  key={c.id}
                  onClick={() => navigate(`/depot/complaints/${c.id}`)}
                  className="p-4 hover:bg-gray-50 transition-colors space-y-2 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#171717]">
                      {c.reference}
                    </span>
                    {getStatusBadge(c.status)}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#171717]">{c.categoryLabel || c.category}</span>
                    <span className="font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md">
                      {c.busNumber}
                    </span>
                  </div>
                  <p className="text-xs text-[#667085] line-clamp-2">{c.description}</p>
                  <div className="flex items-center justify-between pt-1 text-[11px] text-[#667085]">
                    <span>{c.routeFrom} ➔ {c.routeTo}</span>
                    <span className="font-bold text-[#D92D20]">View Details ➔</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
