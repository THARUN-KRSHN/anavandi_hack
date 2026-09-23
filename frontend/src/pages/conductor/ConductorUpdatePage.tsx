import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getSmsToken, submitConductorStatusUpdate, type SmsToken } from '../../services/smsService';
import { fetchComplaintById } from '../../services/complaintsService';
import type { Complaint } from '../../types/complaint';
import { Bus, CheckCircle2, Clock, AlertTriangle, Check } from 'lucide-react';

export const ConductorUpdatePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  const [tokenData, setTokenData] = useState<SmsToken | null>(null);
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExpired, setIsExpired] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [selectedStatus, setSelectedStatus] = useState<'acknowledged' | 'resolved'>('acknowledged');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);

  useEffect(() => {
    const loadTokenAndComplaint = async () => {
      if (!token) {
        setErrorMessage('Invalid or missing access token.');
        setLoading(false);
        return;
      }
      try {
        const tokenObj = await getSmsToken(token);
        if (!tokenObj) {
          setErrorMessage('Invalid or unrecognized token link.');
          setLoading(false);
          return;
        }

        if (tokenObj.isUsed) {
          setIsExpired(true);
          setLoading(false);
          return;
        }

        setTokenData(tokenObj);

        // Fetch complaint details
        const cmp = await fetchComplaintById(tokenObj.complaintId);
        setComplaint(cmp);
      } catch (err) {
        console.error(err);
        setErrorMessage('Failed to load complaint data.');
      } finally {
        setLoading(false);
      }
    };

    loadTokenAndComplaint();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSubmitting(true);
    try {
      const res = await submitConductorStatusUpdate(token, selectedStatus, note);
      if (res.success) {
        setIsSubmittedSuccess(true);
      } else {
        setErrorMessage(res.message);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E2F1E7] via-[#F4F9F5] to-[#E5F3EB] p-4 flex flex-col justify-between">
      {/* Mobile Top Brand Bar */}
      <div className="max-w-md mx-auto w-full pt-4 pb-2 text-center space-y-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#171717] text-white rounded-full shadow-md text-xs font-bold">
          <Bus className="w-4 h-4 text-emerald-400" />
          <span>ANAVANDI CONDUCTOR PORTAL</span>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center my-6">
        {loading ? (
          <div className="bg-white p-8 rounded-[32px] border border-[#EAECF0] shadow-xl text-center space-y-3">
            <div className="w-8 h-8 border-3 border-[#D92D20] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-[#667085]">Validating SMS Security Token...</p>
          </div>
        ) : isExpired ? (
          <div className="bg-white p-8 rounded-[32px] border border-amber-200 shadow-xl text-center space-y-4">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-[#171717]">This Link Has Expired</h2>
            <p className="text-xs text-[#667085] leading-relaxed">
              This single-use status update link has already been used or invalidated. Thank you for maintaining Kerala RTC service standards.
            </p>
          </div>
        ) : errorMessage ? (
          <div className="bg-white p-8 rounded-[32px] border border-red-200 shadow-xl text-center space-y-4">
            <div className="w-14 h-14 bg-red-50 text-[#D92D20] rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-[#171717]">Invalid Link</h2>
            <p className="text-xs text-[#667085]">{errorMessage}</p>
          </div>
        ) : isSubmittedSuccess ? (
          <div className="bg-white p-8 rounded-[32px] border border-green-200 shadow-xl text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-green-50 text-[#16A34A] rounded-full flex items-center justify-center mx-auto">
              <Check className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-[#171717]">Status Updated!</h2>
            <p className="text-xs text-[#667085]">
              Complaint <span className="font-bold text-[#171717]">{tokenData?.complaintRef}</span> has been updated to{' '}
              <span className="font-bold text-[#16A34A] uppercase">{selectedStatus}</span>.
            </p>
            <p className="text-[11px] text-[#667085] bg-gray-50 p-3 rounded-2xl border border-gray-100">
              The depot desk and passenger have been updated via real-time sync.
            </p>
          </div>
        ) : (
          <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-[#EAECF0] shadow-2xl space-y-6">
            {/* Header info */}
            <div className="space-y-2 border-b border-[#EAECF0] pb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#667085] block">
                CONDUCTOR ACTION DESK
              </span>
              <div className="flex items-center justify-between">
                <span className="text-xl font-black text-[#171717]">{tokenData?.complaintRef}</span>
                <span className="px-3 py-1 bg-red-50 text-[#D92D20] text-xs font-bold rounded-full border border-red-200">
                  {tokenData?.busNumber}
                </span>
              </div>
              <h3 className="text-sm font-extrabold text-[#171717]">
                {tokenData?.categoryLabel}
              </h3>
            </div>

            {/* Complaint details snapshot */}
            {complaint && (
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2 text-xs">
                <span className="text-[10px] font-bold text-[#667085] uppercase block">Passenger Description</span>
                <p className="text-[#171717] font-medium leading-relaxed italic">
                  "{complaint.description}"
                </p>
                <div className="flex items-center justify-between text-[11px] text-[#667085] pt-1 border-t border-gray-200/60">
                  <span>Route: {complaint.routeFrom} ➔ {complaint.routeTo}</span>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#171717] block">Select Update Status:</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedStatus('acknowledged')}
                    className={`p-3.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                      selectedStatus === 'acknowledged'
                        ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-sm'
                        : 'bg-white border-[#EAECF0] text-[#667085] hover:bg-gray-50'
                    }`}
                  >
                    <Clock className="w-5 h-5" />
                    <span>Acknowledged</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedStatus('resolved')}
                    className={`p-3.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                      selectedStatus === 'resolved'
                        ? 'bg-green-50 border-[#16A34A] text-[#16A34A] shadow-sm'
                        : 'bg-white border-[#EAECF0] text-[#667085] hover:bg-gray-50'
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Resolved</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#171717] block">Optional Conductor Note:</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Action taken on board, seat cleaned, issue resolved with passenger..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-[#EAECF0] rounded-2xl text-xs font-medium text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#D92D20]/20"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-[#171717] text-white text-xs font-bold rounded-full shadow-lg hover:bg-black flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                {submitting ? 'Submitting...' : 'Submit Status Update'}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-2 text-[10px] font-semibold text-[#667085]">
        Kerala State Road Transport Corporation • Public Grievance Portal
      </footer>
    </div>
  );
};
