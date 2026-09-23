import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchComplaintById } from '../../services/complaintsService';
import type { Complaint } from '../../types/complaint';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/complaint/StatusBadge';
import { Timeline } from '../../components/complaint/Timeline';
import { formatDate } from '../../utils/dateUtils';
import { Search, Bus, MapPin, Building2, ShieldCheck, AlertCircle } from 'lucide-react';

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
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Search Input Box */}
      <Card className="p-6 bg-gradient-to-r from-red-50/30 via-white to-white border-[#EAECF0]">
        <div className="max-w-xl mx-auto space-y-4">
          <div className="text-center">
            <h1 className="text-2xl font-black text-[#171717]">Track Your Grievance</h1>
            <p className="text-xs text-[#667085] mt-1">
              Enter your reference code (e.g. GRV-10482) to view live operational status.
            </p>
          </div>

          <form onSubmit={onSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Enter Reference (e.g. GRV-10482)"
                value={searchRef}
                onChange={(e) => setSearchRef(e.target.value)}
                icon={<Search className="w-4 h-4 text-[#667085]" />}
                className="font-mono text-sm uppercase"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              isLoading={loading}
              icon={<Search className="w-4 h-4" />}
            >
              Track Case
            </Button>
          </form>

          <div className="flex items-center justify-center gap-2 text-xs text-[#667085]">
            <span>Try demo case:</span>
            <button
              onClick={() => {
                setSearchRef('GRV-10482');
                navigate('/track/GRV-10482');
                handleSearch('GRV-10482');
              }}
              className="font-mono font-bold text-[#D92D20] underline hover:text-[#B42318]"
            >
              GRV-10482
            </button>
          </div>
        </div>
      </Card>

      {/* Case Details & Timeline */}
      {loading ? (
        <Card className="p-8 text-center text-[#667085]">
          <div className="w-8 h-8 border-2 border-[#D92D20] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs">Fetching complaint timeline from depot registry...</p>
        </Card>
      ) : complaint ? (
        <div className="space-y-6">
          {/* Header Summary */}
          <Card className="p-6 border-[#EAECF0]">
            <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#EAECF0]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-[#D92D20] bg-red-50 px-2.5 py-1 rounded-lg border border-red-100">
                    {complaint.reference}
                  </span>
                  <StatusBadge status={complaint.status} />
                </div>
                <h2 className="text-xl font-bold text-[#171717]">{complaint.categoryLabel}</h2>
                <p className="text-xs text-[#667085] mt-1">Submitted on {formatDate(complaint.createdAt)}</p>
              </div>

              <div className="p-3 bg-[#F9FAFB] rounded-2xl border border-[#EAECF0] text-xs space-y-1">
                <div className="text-[#667085]">Assigned Depot:</div>
                <div className="font-bold text-[#171717] flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-[#D92D20]" />
                  <span>{complaint.depotName}</span>
                </div>
              </div>
            </div>

            {/* Vehicle & Route Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-xs">
              <div className="flex items-center gap-2 text-[#344054]">
                <Bus className="w-4 h-4 text-[#D92D20]" />
                <span>Vehicle: <strong>{complaint.busNumber}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-[#344054]">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>Route: <strong>{complaint.routeFrom} ➔ {complaint.routeTo}</strong></span>
              </div>
            </div>

            <div className="mt-4 p-4 bg-gray-50 rounded-2xl border border-[#EAECF0] text-xs text-[#344054]">
              <span className="font-semibold text-[#171717] block mb-1">Public Description:</span>
              <p>{complaint.description}</p>
            </div>
          </Card>

          {/* Privacy Notice Banner */}
          <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>
              <strong>Public Transparency Mode:</strong> Showing verified milestone timeline. Internal crew roster PEN numbers and private internal notes are protected.
            </span>
          </div>

          {/* Public Timeline Events */}
          <Card className="p-6">
            <h3 className="text-base font-bold text-[#171717] mb-6">Case Progress Timeline</h3>
            <Timeline events={complaint.timeline} isPublicView={true} />
          </Card>
        </div>
      ) : searched ? (
        <Card className="p-8 text-center text-[#667085] space-y-3">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="font-bold text-[#171717] text-base">No Complaint Found</h3>
          <p className="text-xs max-w-sm mx-auto">
            We couldn't find any record matching reference number &quot;{searchRef}&quot;. Please check the code and try again.
          </p>
        </Card>
      ) : null}
    </div>
  );
};
