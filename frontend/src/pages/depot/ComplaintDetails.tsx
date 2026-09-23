import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchComplaintById, updateComplaintStatus } from '../../services/complaintsService';
import { sendConductorSms } from '../../services/smsService';
import { getDutyRosterForBus } from '../../services/crewService';
import type { Complaint } from '../../types/complaint';
import { MiniLocationMap } from '../../components/map/MiniLocationMap';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft,
  Send,
  Bus,
  Phone,
  Clock,
  MapPin,
  X,
  CheckCircle2,
  AlertOctagon,
  ShieldAlert,
  RefreshCw,
} from 'lucide-react';

export const ComplaintDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const depotId = user?.depotId || '';

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);

  // Status action state
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(null);
  const [statusUpdateSuccess, setStatusUpdateSuccess] = useState<string | null>(null);

  // Shift matching conductor state
  const [matchingConductor, setMatchingConductor] = useState<{
    conductorName: string;
    conductorPhone: string;
    conductorPen: string;
    busNumber: string;
    shiftTime: string;
    routeCode: string;
  } | null>(null);

  // SMS Modal State
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
  const [smsMessage, setSmsMessage] = useState('');
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [smsSuccessBanner, setSmsSuccessBanner] = useState<string | null>(null);

  const loadDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await fetchComplaintById(id);
      setComplaint(data);

      if (data) {
        if (data.conductorName || data.conductorPen) {
          setMatchingConductor({
            conductorName: data.conductorName || 'Duty Conductor',
            conductorPhone: data.conductorPhone || '',
            conductorPen: data.conductorPen || '',
            busNumber: data.busNumber || '',
            shiftTime: data.incidentTime || 'On-Duty Shift',
            routeCode: data.routeCode || '',
          });
        } else if (data.busNumber) {
          const roster = await getDutyRosterForBus(data.busNumber, data.incidentTime);
          if (roster) {
            setMatchingConductor({
              conductorName: roster.conductorName || '',
              conductorPhone: roster.conductorPhone || '',
              conductorPen: roster.conductorPen || '',
              busNumber: roster.busNumber,
              shiftTime: roster.shiftSchedule || `${roster.startTime || ''} - ${roster.endTime || ''}`,
              routeCode: roster.routeCode || data.routeCode || '',
            });
          } else {
            setMatchingConductor(null);
          }
        } else {
          setMatchingConductor(null);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();

    const handleSync = () => {
      loadDetails();
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('anavandi_realtime_sync', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('anavandi_realtime_sync', handleSync);
    };
  }, [id]);

  const openSmsModal = () => {
    if (!complaint || !matchingConductor) return;
    const origin = window.location.origin;
    const template = `ANAVANDI: Complaint ${complaint.reference} (${
      complaint.categoryLabel || complaint.category
    }) on bus ${complaint.busNumber || matchingConductor.busNumber}. Update status: ${origin}/u/{token}`;
    setSmsMessage(template);
    setIsSmsModalOpen(true);
  };

  const handleSendSmsSubmit = async () => {
    if (!complaint || !matchingConductor) return;
    setIsSendingSms(true);
    try {
      const { outboxLog } = await sendConductorSms({
        complaintId: complaint.id,
        complaintRef: complaint.reference,
        categoryLabel: complaint.categoryLabel || complaint.category,
        busNumber: complaint.busNumber || matchingConductor.busNumber,
        conductorName: matchingConductor.conductorName,
        conductorPhone: matchingConductor.conductorPhone,
        depotId,
        customMessage: smsMessage,
      });

      setSmsSuccessBanner(`SMS successfully logged to ${matchingConductor.conductorName}! Link: ${outboxLog.updateUrl}`);
      setIsSmsModalOpen(false);
      await loadDetails();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSendingSms(false);
    }
  };

  const handleStatusChange = async (
    newStatus: 'acknowledged' | 'resolved' | 'escalated',
    notes?: string
  ) => {
    if (!complaint) return;
    setIsUpdatingStatus(true);
    setStatusUpdateError(null);
    try {
      await updateComplaintStatus(complaint.id, newStatus, notes);
      setStatusUpdateSuccess(`Complaint marked as ${newStatus.replace(/_/g, ' ').toUpperCase()}.`);
      setTimeout(() => setStatusUpdateSuccess(null), 3000);
      await loadDetails();
    } catch {
      setStatusUpdateError('Failed to update status. Please try again.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // SLA helper — 12-hour window from creation
  const getSlaRemaining = (createdAt: string): string => {
    const slaDeadline = new Date(createdAt).getTime() + 12 * 60 * 60 * 1000;
    const now = Date.now();
    const diff = slaDeadline - now;
    if (diff <= 0) return 'SLA BREACHED';
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${mins}m remaining`;
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs font-bold text-[#667085]">
        Loading grievance report details...
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="p-12 text-center space-y-4">
        <p className="text-base font-bold text-[#171717]">Complaint Not Found</p>
        <button
          onClick={() => navigate('/depot/complaints')}
          className="px-4 py-2 bg-[#171717] text-white text-xs font-bold rounded-xl"
        >
          Back to Reports
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#EAECF0]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/depot')}
            className="w-10 h-10 rounded-full bg-white border border-[#EAECF0] shadow-sm flex items-center justify-center text-[#171717] hover:bg-gray-50 transition-all"
            title="Back to Reports"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#667085]">
                GRIEVANCE DOSSIER
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-[#171717]">
                {complaint.reference}
              </span>
            </div>
            <h1 className="text-xl font-black text-[#171717]">
              {complaint.categoryLabel || complaint.category}
            </h1>
          </div>
        </div>

        {matchingConductor && complaint.status !== 'resolved' && (
          <button
            onClick={openSmsModal}
            className="px-4 py-2.5 bg-[#D92D20] text-white text-xs font-bold rounded-full shadow-md hover:bg-red-700 flex items-center gap-2 transition-all"
          >
            <Send className="w-4 h-4" /> Send SMS to Conductor
          </button>
        )}
      </div>

      {smsSuccessBanner && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center justify-between text-xs text-[#16A34A] font-semibold">
          <span>{smsSuccessBanner}</span>
          <button onClick={() => setSmsSuccessBanner(null)} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Grid: Details & Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Complaint Details & Timeline */}
        <div className="lg:col-span-7 space-y-6">

          {/* SMART POPOVER SUGGESTION CARD */}
          <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-200/80 p-5 rounded-[24px] shadow-sm space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
                  ⚡
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">
                    SMART AI MATCHING SUGGESTION
                  </span>
                  <h3 className="text-xs font-bold text-amber-950">
                    Recommended Bus & Duty Crew for incident time ({complaint.incidentTime || 'Shift Duty'})
                  </h3>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-200 text-amber-900 uppercase tracking-wide">
                Duty Roster Match
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Bus Suggestion */}
              <div className="bg-white/90 p-3 rounded-2xl border border-amber-200/60 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                  <Bus className="w-4 h-4 text-amber-600" />
                  <span>Suggested Bus Unit</span>
                </div>
                <p className="text-sm font-black text-[#171717] mt-1 font-mono">
                  {complaint.busNumber || 'KL-15-A-8901 (KSRTC Swift)'}
                </p>
                <span className="text-[10px] text-gray-500 block">
                  Operated on {complaint.routeFrom || 'Origin'} ➔ {complaint.routeTo || 'Destination'}
                </span>
              </div>

              {/* Conductor Suggestion */}
              <div className="bg-white/90 p-3 rounded-2xl border border-amber-200/60 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                  <Phone className="w-4 h-4 text-amber-600" />
                  <span>Responsible Duty Conductor</span>
                </div>
                <p className="text-sm font-black text-[#171717] mt-1">
                  {matchingConductor?.conductorName || 'Rajesh Kumar (PEN: 589412)'}
                </p>
                <span className="text-[10px] text-gray-500 block">
                  {matchingConductor?.conductorPhone ? `Phone: ${matchingConductor.conductorPhone}` : 'On-Duty Shift Roster Match'}
                </span>
              </div>
            </div>
          </div>

          {/* Card: Case Info */}
          <div className="bg-white p-6 rounded-[24px] border border-[#EAECF0] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAECF0]">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#667085] block">BUS PLATE</span>
                <span className="text-sm font-black text-[#171717]">{complaint.busNumber || 'KL-07-AB-1234'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-[#667085] block">ROUTE</span>
                <span className="text-sm font-bold text-[#171717]">
                  {complaint.routeFrom} ➔ {complaint.routeTo}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-[#667085] block">INCIDENT TIME</span>
                <span className="text-xs font-semibold text-[#667085]">{complaint.incidentTime || 'Just now'}</span>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase text-[#667085] mb-1">Description</h3>
              <p className="text-xs text-[#171717] bg-gray-50 p-3.5 rounded-xl border border-gray-100 leading-relaxed font-medium">
                "{complaint.description}"
              </p>
            </div>

            {/* Evidence Files */}
            {complaint.evidenceFiles && complaint.evidenceFiles.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase text-[#667085] mb-2">Uploaded Photo Evidence</h3>
                <div className="grid grid-cols-3 gap-3">
                  {complaint.evidenceFiles.map((src, idx) => (
                    <img
                      key={idx}
                      src={src}
                      alt={`Evidence ${idx + 1}`}
                      className="w-full h-24 object-cover rounded-xl border border-[#EAECF0]"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Card: Depot Action Panel */}
          {complaint.status !== 'resolved' && (
            <div className="bg-white p-6 rounded-[24px] border border-[#EAECF0] shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-[#EAECF0]">
                <ShieldAlert className="w-5 h-5 text-[#D92D20]" />
                <h3 className="text-sm font-black text-[#171717]">Depot Head — Resolution Panel</h3>
              </div>

              {/* SLA countdown */}
              {complaint.createdAt && (
                <div className={`flex items-center gap-2 text-xs font-semibold rounded-xl px-3 py-2 border ${
                  getSlaRemaining(complaint.createdAt).includes('BREACHED')
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-amber-50 border-amber-200 text-amber-700'
                }`}>
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>SLA: {getSlaRemaining(complaint.createdAt)}</span>
                </div>
              )}

              {/* Conductor action note (shown when action taken) */}
              {complaint.status === 'forwarded_to_conductor' && complaint.timeline?.length > 0 && (() => {
                const actionEvent = [...complaint.timeline].reverse().find((e) => e.notes);
                return actionEvent?.notes ? (
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl space-y-1">
                    <p className="text-[10px] font-bold uppercase text-emerald-700">Conductor Action Note</p>
                    <p className="text-xs text-[#171717] font-medium italic">"{actionEvent.notes}"</p>
                    <p className="text-[10px] text-emerald-600 font-semibold">Submitted by: {actionEvent.actorName}</p>
                  </div>
                ) : null;
              })()}

              {statusUpdateSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  {statusUpdateSuccess}
                </div>
              )}
              {statusUpdateError && (
                <p className="text-xs text-red-600 font-semibold">{statusUpdateError}</p>
              )}

              <div className="flex flex-wrap gap-3">
                {/* Mark Under Review */}
                {!['acknowledged', 'forwarded_to_conductor', 'resolved', 'escalated'].includes(complaint.status) && (
                  <button
                    onClick={() => handleStatusChange('acknowledged', 'Depot head reviewing case.')}
                    disabled={isUpdatingStatus}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-300 text-blue-700 text-xs font-bold rounded-full hover:bg-blue-100 transition-all disabled:opacity-50"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Mark Under Review
                  </button>
                )}

                {/* Mark Resolved */}
                <button
                  onClick={() => {
                    const note = window.prompt('Resolution note (optional):') || 'Complaint resolved by depot head.';
                    handleStatusChange('resolved', note);
                  }}
                  disabled={isUpdatingStatus}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-300 text-emerald-700 text-xs font-bold rounded-full hover:bg-emerald-100 transition-all disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isUpdatingStatus ? 'Updating...' : 'Mark Resolved ✓'}
                </button>

                {/* Escalate */}
                {complaint.status !== 'escalated' && (
                  <button
                    onClick={() => {
                      const reason = window.prompt('Escalation reason:') || 'Unresolved within SLA window.';
                      handleStatusChange('escalated', reason);
                    }}
                    disabled={isUpdatingStatus}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-300 text-red-700 text-xs font-bold rounded-full hover:bg-red-100 transition-all disabled:opacity-50"
                  >
                    <AlertOctagon className="w-3.5 h-3.5" />
                    Escalate to Admin
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Card: Shift Matching Possible Buses & Conductors */}
          <div className="bg-white p-6 rounded-[24px] border border-[#EAECF0] shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#EAECF0]">
              <Bus className="w-5 h-5 text-[#D92D20]" />
              <h3 className="text-sm font-black text-[#171717]">
                Possible Buses and Conductors (Shift Roster Match)
              </h3>
            </div>

            {matchingConductor ? (
              <div className="bg-red-50/50 border border-red-100 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#171717] text-white flex items-center justify-center font-bold text-xs">
                      {matchingConductor.conductorName.split(' ')[0][0]}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-[#171717]">
                        {matchingConductor.conductorName}
                      </h4>
                      <span className="text-[11px] text-[#667085] font-semibold">
                        PEN: {matchingConductor.conductorPen}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-[#D92D20] uppercase block">Assigned Bus</span>
                    <span className="text-xs font-black text-[#171717]">{matchingConductor.busNumber}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-[#667085] border-t border-red-100/60">
                  <span className="flex items-center gap-1 font-medium">
                    <Phone className="w-3.5 h-3.5 text-gray-500" /> {matchingConductor.conductorPhone}
                  </span>
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-gray-500" /> {matchingConductor.shiftTime}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-[#667085]">
                No exact shift matching crew found for this timeframe.
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-white p-6 rounded-[24px] border border-[#EAECF0] shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#667085]">
              Status Progression Timeline
            </h3>
            <div className="space-y-4">
              {complaint.timeline.map((evt, index) => (
                <div key={evt.id || index} className="flex items-start gap-3 text-xs">
                  <div className="w-6 h-6 rounded-full bg-red-100 text-[#D92D20] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    {index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-[#171717] capitalize">{evt.status.replace(/_/g, ' ')}</span>
                      <span className="text-[10px] text-[#667085]">
                        {new Date(evt.timestamp).toLocaleString()}
                      </span>
                    </div>
                    {evt.notes && <p className="text-xs text-[#667085] mt-0.5">{evt.notes}</p>}
                    <span className="text-[10px] font-medium text-[#667085] block mt-0.5">By: {evt.actorName}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Location Map */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-4 rounded-[24px] border border-[#EAECF0] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#667085] flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#D92D20]" /> Incident Location Map
              </h3>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Live Pin Matching
              </span>
            </div>

            <div className="h-[320px] rounded-2xl overflow-hidden border border-[#EAECF0]">
              <MiniLocationMap
                userLat={complaint.userLat || 9.9816}
                userLng={complaint.userLng || 76.2999}
                busPlate={complaint.busNumber || 'KL-07-AB-1234'}
              />
            </div>
          </div>
        </div>
      </div>

      {/* SMS Modal Dialog */}
      {isSmsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white max-w-md w-full rounded-[28px] p-6 shadow-2xl border border-[#EAECF0] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAECF0]">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-[#D92D20]" />
                <h3 className="text-base font-black text-[#171717]">Send Conductor SMS</h3>
              </div>
              <button
                onClick={() => setIsSmsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-1">
              <p className="font-bold text-[#171717]">Recipient Conductor:</p>
              <p className="text-[#667085]">
                {matchingConductor?.conductorName} ({matchingConductor?.conductorPhone})
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#171717] block">Editable Message Preview:</label>
              <textarea
                rows={4}
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-[#EAECF0] rounded-2xl text-xs font-mono text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#D92D20]/20"
              />
              <span className="text-[10px] text-[#667085] block">
                The placeholder <code>{"{token}"}</code> will automatically be replaced by a secure single-use token.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsSmsModalOpen(false)}
                className="px-4 py-2 bg-gray-100 text-[#171717] text-xs font-bold rounded-full hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSendSmsSubmit}
                disabled={isSendingSms}
                className="px-5 py-2 bg-[#D92D20] text-white text-xs font-bold rounded-full shadow-md hover:bg-red-700 flex items-center gap-1.5"
              >
                {isSendingSms ? 'Sending...' : 'Confirm & Dispatch SMS'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
