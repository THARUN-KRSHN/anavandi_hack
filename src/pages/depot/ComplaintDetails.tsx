import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchComplaintById } from '../../services/complaintsService';
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
} from 'lucide-react';

export const ComplaintDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const depotId = user?.depotId || 'DEP-EKM';

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);

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
        // Fetch shift matching crew
        const roster = await getDutyRosterForBus(
          data.busNumber || 'KL-15-A-4021',
          data.incidentTime
        );
        if (roster) {
          setMatchingConductor({
            conductorName: roster.conductorName,
            conductorPhone: roster.conductorPhone || '+91 98471 22390',
            conductorPen: roster.conductorPen,
            busNumber: roster.busNumber,
            shiftTime: roster.shiftSchedule || `${roster.startTime} - ${roster.endTime}`,
            routeCode: roster.routeCode || '102-EXP',
          });
        } else {
          // Default mock matching conductor
          setMatchingConductor({
            conductorName: 'V. K. Shaji',
            conductorPhone: '+91 98471 22390',
            conductorPen: 'PEN-88421',
            busNumber: data.busNumber || 'KL-07-AB-1234',
            shiftTime: '06:00 AM - 02:00 PM (Morning Shift)',
            routeCode: data.routeCode || '102-EXP',
          });
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
