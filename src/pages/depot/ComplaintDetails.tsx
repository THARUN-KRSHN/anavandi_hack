import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchComplaintById, updateComplaintStatus, assignComplaint } from '../../services/complaintsService';
import { fetchCrewByPEN } from '../../services/crewService';
import type { Complaint, ComplaintStatus } from '../../types/complaint';
import type { CrewMember } from '../../types/crew';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { StatusBadge } from '../../components/complaint/StatusBadge';
import { PriorityBadge } from '../../components/complaint/PriorityBadge';
import { Timeline } from '../../components/complaint/Timeline';
import { RosterChainView } from '../../components/crew/RosterChainView';
import { formatDate } from '../../utils/dateUtils';
import {
  ArrowLeft,
  CheckCircle2,
  Search,
  ShieldAlert,
  RefreshCw,
  Phone,
  Lock,
} from 'lucide-react';

export const ComplaintDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [crewInfo, setCrewInfo] = useState<CrewMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Action Inputs
  const [assigneeName, setAssigneeName] = useState('');
  const [noteText, setNoteText] = useState('');

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const c = await fetchComplaintById(id);
      setComplaint(c);
      if (c?.conductorPen) {
        const crew = await fetchCrewByPEN(c.conductorPen);
        setCrewInfo(crew);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleStatusTransition = async (newStatus: ComplaintStatus) => {
    if (!complaint) return;
    setActionLoading(true);
    try {
      const updated = await updateComplaintStatus(
        complaint.id,
        newStatus,
        noteText || undefined,
        'depot_manager',
        'Depot Manager TVM'
      );
      setComplaint(updated);
      setNoteText('');
    } catch (err) {
      console.error(err);
      alert('Failed to update case status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignOwner = async () => {
    if (!complaint || !assigneeName.trim()) return;
    setActionLoading(true);
    try {
      const updated = await assignComplaint(complaint.id, assigneeName);
      setComplaint(updated);
      setAssigneeName('');
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-12 text-center text-[#667085]">
        <div className="w-8 h-8 border-2 border-[#D92D20] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs">Loading operational case file...</p>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-[#171717]">Case File Not Found</h2>
        <Button variant="outline" onClick={() => navigate('/depot/complaints')}>
          Return to Queue
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Back Navigation */}
      <button
        onClick={() => navigate('/depot/complaints')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-[#667085] hover:text-[#171717]"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Queue</span>
      </button>

      {/* Case Header Card */}
      <Card className="p-6 border-[#EAECF0]">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#EAECF0]">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-sm font-bold bg-red-50 text-[#D92D20] px-3 py-1 rounded-lg border border-red-100">
                {complaint.reference}
              </span>
              <PriorityBadge priority={complaint.priority} />
              <StatusBadge status={complaint.status} />
            </div>
            <h1 className="text-2xl font-extrabold text-[#171717]">{complaint.categoryLabel}</h1>
            <p className="text-xs text-[#667085] mt-1">Logged on {formatDate(complaint.createdAt)}</p>
          </div>

          {/* Action Quick Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {complaint.status === 'submitted' && (
              <Button
                variant="primary"
                size="sm"
                isLoading={actionLoading}
                icon={<CheckCircle2 className="w-4 h-4" />}
                onClick={() => handleStatusTransition('acknowledged')}
              >
                Acknowledge Case
              </Button>
            )}

            {complaint.status === 'acknowledged' && (
              <Button
                variant="primary"
                size="sm"
                isLoading={actionLoading}
                icon={<Search className="w-4 h-4" />}
                onClick={() => handleStatusTransition('investigating')}
              >
                Start Investigation
              </Button>
            )}

            {complaint.status === 'investigating' && (
              <Button
                variant="success"
                size="sm"
                isLoading={actionLoading}
                icon={<CheckCircle2 className="w-4 h-4" />}
                onClick={() => handleStatusTransition('resolved')}
              >
                Mark Resolved
              </Button>
            )}

            {complaint.status !== 'escalated' && complaint.status !== 'resolved' && (
              <Button
                variant="danger"
                size="sm"
                isLoading={actionLoading}
                icon={<ShieldAlert className="w-4 h-4" />}
                onClick={() => handleStatusTransition('escalated')}
              >
                Escalate Case
              </Button>
            )}

            {complaint.status === 'resolved' && (
              <Button
                variant="outline"
                size="sm"
                isLoading={actionLoading}
                icon={<RefreshCw className="w-4 h-4" />}
                onClick={() => handleStatusTransition('reopened')}
              >
                Reopen Case
              </Button>
            )}
          </div>
        </div>

        {/* Description & Note Box */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-gray-50 rounded-2xl border border-[#EAECF0]">
            <span className="font-bold text-[#171717] block mb-1">Passenger Grievance Statement:</span>
            <p className="text-[#344054] leading-relaxed">{complaint.description}</p>
          </div>

          <div className="p-4 bg-red-50/30 rounded-2xl border border-red-100">
            <span className="font-bold text-[#171717] block mb-1">Assigned Case Owner:</span>
            <span className="text-sm font-semibold text-[#D92D20] block">{complaint.assignedOwner}</span>
            <span className="text-[#667085] text-[11px] mt-1 block">
              Depot: {complaint.depotName}
            </span>
          </div>
        </div>
      </Card>

      {/* Operational Lineage Trace (Section 7 Centerpiece) */}
      <RosterChainView complaint={complaint} />

      {/* Grid: Action Desk & Roster PEN Lookup */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Action Form & Role-Protected Crew Box */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Action Note & Assignment Box */}
          <Card className="p-5 space-y-4">
            <h3 className="font-bold text-base text-[#171717]">Depot Action & Notes Desk</h3>
            
            <div className="space-y-3">
              <Input
                label="Add Investigation / Resolution Note"
                placeholder="Enter note or investigation summary..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />

              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="Reassign Owner (e.g. Inspector Nair)"
                  value={assigneeName}
                  onChange={(e) => setAssigneeName(e.target.value)}
                />
                <Button variant="outline" size="sm" onClick={handleAssignOwner} className="shrink-0">
                  Assign
                </Button>
              </div>
            </div>
          </Card>

          {/* Role-Protected Conductor PEN Record */}
          <Card className="p-5 border-amber-200 bg-amber-50/20">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-amber-200">
              <h3 className="font-bold text-sm text-[#171717] flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600" />
                <span>Duty Roster & Authorized Crew Record</span>
              </h3>
              <span className="text-[10px] uppercase font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                Role Protected
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-[#344054]">
                <span className="text-[#667085]">Conductor Employee PEN:</span>
                <span className="font-mono font-bold text-[#D92D20]">{complaint.conductorPen}</span>
              </div>
              <div className="flex items-center justify-between text-[#344054]">
                <span className="text-[#667085]">Full Name:</span>
                <span className="font-bold">{crewInfo?.name || 'Rajesh Kumar'}</span>
              </div>
              <div className="flex items-center justify-between text-[#344054]">
                <span className="text-[#667085]">Contact Number:</span>
                <span className="font-medium flex items-center gap-1">
                  <Phone className="w-3 h-3 text-[#667085]" />
                  {crewInfo?.phone || '+91 94471 20491'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#344054]">
                <span className="text-[#667085]">Roster Duty ID:</span>
                <span className="font-mono font-semibold">{complaint.dutyId}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Complete Internal Timeline */}
        <div className="lg:col-span-6">
          <Card className="p-6">
            <h3 className="font-bold text-base text-[#171717] mb-6">Complete Audit & Transition Timeline</h3>
            <Timeline events={complaint.timeline} isPublicView={false} />
          </Card>
        </div>
      </div>
    </div>
  );
};
