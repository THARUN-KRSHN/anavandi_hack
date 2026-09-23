import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import type { Complaint } from '../../types/complaint';
import { generateComplaintPDF } from '../../utils/pdfExport';
import { downloadComplaintPdfBlob } from '../../services/complaintsService';
import { CheckCircle2, Copy, Download, Home, Building2, Search, AlertCircle } from 'lucide-react';

export const ComplaintSubmitted: React.FC = () => {
  const location = useLocation();
  const [downloading, setDownloading] = useState(false);
  const complaint: Complaint | undefined = location.state?.complaint;

  if (!complaint) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center">
        <div className="bg-white/95 backdrop-blur-md p-8 rounded-[32px] border border-[#EAECF0] shadow-xl space-y-4">
          <AlertCircle className="w-12 h-12 text-[#D92D20] mx-auto" />
          <h2 className="text-xl font-black text-[#171717]">No Recent Complaint Submission Found</h2>
          <p className="text-xs text-[#667085]">
            You have not submitted a grievance in this session, or the session has expired.
          </p>
          <div className="pt-4 flex justify-center gap-3">
            <Link to="/report" className="px-6 py-2.5 bg-[#D92D20] text-white font-bold text-xs rounded-full">
              Register a Grievance
            </Link>
            <Link to="/track" className="px-6 py-2.5 bg-gray-100 text-[#171717] font-bold text-xs rounded-full">
              Track Existing Case
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await downloadComplaintPdfBlob(complaint.reference);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${complaint.reference}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      // Fallback to client-side jsPDF
      generateComplaintPDF(complaint);
    } finally {
      setDownloading(false);
    }
  };

  const copyReference = () => {
    navigator.clipboard.writeText(complaint.reference);
    alert(`Reference ID ${complaint.reference} copied to clipboard!`);
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4 space-y-6 pb-28">
      <div className="bg-white/95 backdrop-blur-md p-6 sm:p-8 rounded-[32px] border border-[#EAECF0] shadow-xl text-center space-y-6">
        
        {/* Success Header Icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
            Grievance Registered Successfully
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#171717] mt-3">
            Reference ID: <span className="font-mono text-[#D92D20]">{complaint.reference}</span>
          </h1>
          <p className="text-xs text-[#667085] mt-1 max-w-sm mx-auto">
            Your grievance has been auto-mapped to the in-charge depot. Save this reference number to track your case.
          </p>
        </div>

        {/* Copy Reference Box */}
        <div className="flex items-center justify-center gap-2 max-w-sm mx-auto p-3 bg-[#F9FAFB] rounded-2xl border border-[#EAECF0]">
          <span className="font-mono font-bold text-lg text-[#171717]">{complaint.reference}</span>
          <button
            onClick={copyReference}
            className="p-2 text-[#667085] hover:text-[#D92D20] hover:bg-red-50 rounded-xl transition-colors"
            title="Copy Reference Code"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>

        {/* Auto-Resolved Depot Info */}
        <div className="p-4 bg-gray-50 rounded-2xl border border-[#EAECF0] text-left grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-[#667085] block">In-Charge Depot Desk:</span>
            <div className="font-bold text-sm text-[#171717] flex items-center gap-1.5 mt-0.5">
              <Building2 className="w-4 h-4 text-[#D92D20]" />
              <span>{complaint.depotName || 'Depot In-Charge Desk'}</span>
            </div>
          </div>
          <div>
            <span className="text-[#667085] block">Vehicle & Route:</span>
            <span className="font-medium text-sm text-[#171717] block mt-0.5">
              Bus <strong className="font-mono">{complaint.busNumber || 'N/A'}</strong> {complaint.routeFrom ? `(${complaint.routeFrom} ➔ ${complaint.routeTo})` : ''}
            </span>
          </div>
        </div>

        {/* PDF Export Button */}
        <div className="pt-2">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-full shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? 'Preparing Official PDF...' : 'Download Official PDF Summary'}</span>
          </button>
        </div>

        {/* Action CTAs */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to={`/track/${complaint.reference}`} className="w-full sm:w-auto flex-1">
            <button className="w-full py-3 bg-[#171717] hover:bg-black text-white font-bold text-xs rounded-full shadow-md transition-all flex items-center justify-center gap-2">
              <Search className="w-4 h-4" />
              <span>Track Live Case Status</span>
            </button>
          </Link>
          <Link to="/" className="w-full sm:w-auto flex-1">
            <button className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-[#171717] font-bold text-xs rounded-full transition-all flex items-center justify-center gap-2">
              <Home className="w-4 h-4" />
              <span>Return Home</span>
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};
