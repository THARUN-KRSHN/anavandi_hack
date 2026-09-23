import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchComplaints } from '../../services/complaintsService';
import { fetchDepotDetail } from '../../services/depotService';
import { addNotification } from '../../services/notificationService';
import type { DepotMaster } from '../../types/depot';
import type { Complaint } from '../../types/complaint';
import {
  ArrowLeft,
  Bell,
  Inbox,
  CheckCircle2,
  AlertCircle,
  X,
  Shield,
} from 'lucide-react';

export const AdminDepotDetail: React.FC = () => {
  const { depotId } = useParams<{ depotId: string }>();
  const navigate = useNavigate();

  const [depot, setDepot] = useState<DepotMaster | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [messageTitle, setMessageTitle] = useState('Admin Directive: Operational Priority');
  const [messageBody, setMessageBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [notifySuccessBanner, setNotifySuccessBanner] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      if (!depotId) return;
      const detail = await fetchDepotDetail(depotId);
      setDepot(detail.depot);
      setComplaints(await fetchComplaints({ depotId }));
    } catch (err) {
      console.error(err);
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

  const handleSendNotification = async () => {
    if (!depot || !messageBody.trim()) return;
    setIsSending(true);
    try {
      await addNotification(
        depot.id,
        messageTitle,
        messageBody,
        'admin_message',
        undefined,
        'State HQ Admin'
      );

      setNotifySuccessBanner(`Notification sent directly to ${depot.depotHeadName}'s alert bell!`);
      setIsNotifyModalOpen(false);
      setMessageBody('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs font-bold text-[#667085]">
        Loading read-only depot view...
      </div>
    );
  }

  if (!depot) {
    return (
      <div className="p-12 text-center space-y-4">
        <p className="text-base font-bold text-[#171717]">Depot Not Found</p>
        <button
          onClick={() => navigate('/admin')}
          className="px-4 py-2 bg-[#171717] text-white text-xs font-bold rounded-xl"
        >
          Back to Admin Map
        </button>
      </div>
    );
  }

  const totalCount = complaints.length;
  const resolvedCount = complaints.filter((c) => c.status === 'resolved').length;
  const openCount = totalCount - resolvedCount;

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#EAECF0]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin')}
            className="w-10 h-10 rounded-full bg-white border border-[#EAECF0] shadow-sm flex items-center justify-center text-[#171717] hover:bg-gray-50 transition-all"
            title="Back to Admin Overview"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#667085]">
                ADMIN READ-ONLY INSPECTION DESK
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                HQ Monitor
              </span>
            </div>
            <h1 className="text-xl font-black text-[#171717]">{depot.name}</h1>
          </div>
        </div>

        <button
          onClick={() => setIsNotifyModalOpen(true)}
          className="px-4 py-2.5 bg-[#D92D20] text-white text-xs font-bold rounded-full shadow-md hover:bg-red-700 flex items-center gap-2 transition-all"
        >
          <Bell className="w-4 h-4" /> Notify Depot Head
        </button>
      </div>

      {notifySuccessBanner && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center justify-between text-xs text-[#16A34A] font-semibold">
          <span>{notifySuccessBanner}</span>
          <button onClick={() => setNotifySuccessBanner(null)} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-[24px] border border-[#EAECF0] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#667085] block">
              TOTAL COMPLAINTS
            </span>
            <span className="text-3xl font-black text-[#171717] mt-1 block">{totalCount}</span>
            <span className="text-xs text-[#667085]">Depot registered cases</span>
          </div>
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-[#171717]">
            <Inbox className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-[#EAECF0] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#D92D20] block">
              OPEN / UNSOLVED
            </span>
            <span className="text-3xl font-black text-[#D92D20] mt-1 block">{openCount}</span>
            <span className="text-xs text-[#667085]">Backlog pending action</span>
          </div>
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-[#D92D20]">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-[#EAECF0] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#16A34A] block">
              RESOLVED
            </span>
            <span className="text-3xl font-black text-[#16A34A] mt-1 block">{resolvedCount}</span>
            <span className="text-xs text-[#667085]">Resolved cases</span>
          </div>
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-[#16A34A]">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Depot Meta Info Card */}
      <div className="bg-white p-6 rounded-[24px] border border-[#EAECF0] shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase text-[#667085]">Depot Officers & Contacts</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-[#667085] block font-semibold">Depot Head Manager:</span>
            <span className="font-bold text-[#171717]">{depot.depotHeadName}</span>
          </div>
          <div>
            <span className="text-[#667085] block font-semibold">Phone Contact:</span>
            <span className="font-bold text-[#171717]">{depot.depotHeadPhone}</span>
          </div>
          <div>
            <span className="text-[#667085] block font-semibold">Official Email:</span>
            <span className="font-bold text-[#171717]">{depot.email}</span>
          </div>
        </div>
      </div>

      {/* Complaints Read-Only Queue */}
      <div className="bg-white rounded-[24px] border border-[#EAECF0] shadow-xs overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-[#EAECF0] flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#171717]">
            Live Depot Reports Queue (Read-Only)
          </h3>
          <span className="text-[10px] text-[#667085] font-medium">
            Synced with {depot.name}
          </span>
        </div>

        {complaints.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#667085]">
            No complaints logged for this depot.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {complaints.map((c) => (
              <div key={c.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#171717]">{c.reference}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      c.status === 'resolved'
                        ? 'bg-green-50 text-[#16A34A] border border-green-200'
                        : 'bg-red-50 text-[#D92D20] border border-red-200'
                    }`}
                  >
                    {c.status.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#171717]">{c.categoryLabel || c.category}</span>
                  <span className="font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md">
                    {c.busNumber}
                  </span>
                </div>
                <p className="text-xs text-[#667085] italic font-medium">"{c.description}"</p>
                <div className="text-[10px] text-[#667085]">
                  Route: {c.routeFrom} ➔ {c.routeTo} • Logged: {new Date(c.createdAt).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notify Depot Head Modal */}
      {isNotifyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white max-w-md w-full rounded-[28px] p-6 shadow-2xl border border-[#EAECF0] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAECF0]">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#D92D20]" />
                <h3 className="text-base font-black text-[#171717]">Notify Depot Head</h3>
              </div>
              <button
                onClick={() => setIsNotifyModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-1">
              <p className="font-bold text-[#171717]">Recipient Depot Officer:</p>
              <p className="text-[#667085] font-medium">
                {depot.depotHeadName} ({depot.name})
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#171717] block">Directive Title:</label>
              <input
                type="text"
                value={messageTitle}
                onChange={(e) => setMessageTitle(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-[#EAECF0] rounded-xl text-xs font-bold text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#D92D20]/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#171717] block">Official Message Body:</label>
              <textarea
                rows={4}
                placeholder="Write directive or alert notice for depot head..."
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-[#EAECF0] rounded-2xl text-xs font-medium text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#D92D20]/20"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsNotifyModalOpen(false)}
                className="px-4 py-2 bg-gray-100 text-[#171717] text-xs font-bold rounded-full hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSendNotification}
                disabled={isSending || !messageBody.trim()}
                className="px-5 py-2 bg-[#D92D20] text-white text-xs font-bold rounded-full shadow-md hover:bg-red-700 flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSending ? 'Sending...' : 'Send Notification Alert'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
