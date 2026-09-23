import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchComplaintById, downloadComplaintPdfBlob } from '../../services/complaintsService';
import type { Complaint } from '../../types/complaint';
import { generateComplaintPDF } from '../../utils/pdfExport';
import { Timeline } from '../../components/complaint/Timeline';
import { StatusBadge } from '../../components/complaint/StatusBadge';
import { formatDate } from '../../utils/dateUtils';
import { Search, Bus, MapPin, Building2, Download, ShieldCheck, AlertCircle } from 'lucide-react';

export const TrackComplaint: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [searchRef, setSearchRef] = useState(id || '');
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (refToSearch: string) => {
    if (!refToSearch.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetchComplaintById(refToSearch);
      setComplaint(res);
    } catch (err) {
      console.error(err);
      setComplaint(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      setSearchRef(id);
      handleSearch(id);
    }
  }, [id]);

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchRef) {
      navigate(`/track/${searchRef.trim()}`);
      handleSearch(searchRef);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-6 pb-28">
      {/* Search Input Box */}
      <div className="bg-white/95 backdrop-blur-md p-6 rounded-[32px] border border-[#EAECF0] shadow-xl space-y-4">
        <div className="text-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#667085] block">
            Grievance Status Tracker
          </span>
          <h1 className="text-2xl font-black text-[#171717] tracking-tight">Track Complaint Progress</h1>
          <p className="text-xs text-[#667085] mt-1">
            Enter reference ID (e.g. GRV-10482) to view live timeline status.
          </p>
        </div>

        <form onSubmit={onSearchSubmit} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Enter Reference (e.g. GRV-10482)"
              className="w-full bg-[#F9FAFB] border border-[#EAECF0] rounded-2xl pl-10 pr-4 py-2.5 font-mono font-bold text-xs uppercase text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#171717]"
              value={searchRef}
              onChange={(e) => setSearchRef(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="py-2.5 px-6 bg-[#171717] hover:bg-black text-white font-bold text-xs rounded-full shadow-md transition-all flex items-center justify-center gap-1.5"
          >
            <span>Track Case</span>
          </button>
        </form>
      </div>

      {/* Case Details & Timeline */}
      {loading ? (
        <div className="p-8 text-center text-[#667085] bg-white rounded-3xl border border-[#EAECF0]">
          <div className="w-6 h-6 border-2 border-[#D92D20] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Fetching complaint record...</p>
        </div>
      ) : complaint ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Header Card */}
          <div className="bg-white/95 backdrop-blur-md p-6 rounded-[32px] border border-[#EAECF0] shadow-xl space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-[#EAECF0]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-[#D92D20] bg-red-50 px-2.5 py-1 rounded-lg border border-red-100">
                    {complaint.reference}
                  </span>
                  <StatusBadge status={complaint.status} />
                </div>
                <h2 className="text-xl font-bold text-[#171717]">{complaint.categoryLabel}</h2>
                <span className="text-[11px] text-[#667085]">Filed on {formatDate(complaint.createdAt)}</span>
              </div>

              <button
                onClick={async () => {
                  try {
                    const blob = await downloadComplaintPdfBlob(complaint.reference);
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${complaint.reference}.pdf`;
                    a.click();
                    window.URL.revokeObjectURL(url);
                  } catch {
                    generateComplaintPDF(complaint);
                  }
                }}
                className="py-2 px-4 bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 font-bold text-xs rounded-full transition-all flex items-center gap-1.5"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Download PDF</span>
              </button>
            </div>

            {/* Vehicle & Route Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#F9FAFB] p-3 rounded-2xl border border-[#EAECF0]">
              <div className="flex items-center gap-2 text-[#344054]">
                <Bus className="w-4 h-4 text-[#D92D20]" />
                <span>Vehicle: <strong className="font-mono">{complaint.busNumber}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-[#344054]">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>Route: <strong>{complaint.routeFrom} ➔ {complaint.routeTo}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-[#344054] sm:col-span-2">
                <Building2 className="w-4 h-4 text-purple-600" />
                <span>Assigned Depot: <strong>{complaint.depotName}</strong></span>
              </div>
            </div>

            <div className="p-3.5 bg-gray-50 rounded-2xl border border-[#EAECF0] text-xs text-[#344054]">
              <span className="font-semibold text-[#171717] block mb-1">Public Statement:</span>
              <p>{complaint.description}</p>
            </div>
          </div>

          {/* Privacy Disclosure */}
          <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Public View:</strong> Internal crew PEN and employee records are strictly protected.
            </span>
          </div>

          {/* Timeline */}
          <div className="bg-white/95 backdrop-blur-md p-6 rounded-[32px] border border-[#EAECF0] shadow-xl space-y-4">
            <h3 className="text-base font-bold text-[#171717]">Status Milestone Timeline</h3>
            <Timeline events={complaint.timeline} isPublicView={true} />
          </div>
        </div>
      ) : searched ? (
        <div className="p-8 text-center text-[#667085] bg-white rounded-3xl border border-[#EAECF0] space-y-2">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
          <h3 className="font-bold text-[#171717] text-sm">No Complaint Found</h3>
          <p className="text-xs">
            We couldn&apos;t find any record matching reference number &quot;{searchRef}&quot;.
          </p>
        </div>
      ) : null}
    </div>
  );
};
