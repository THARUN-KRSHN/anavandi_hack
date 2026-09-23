import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import type { Complaint } from '../../types/complaint';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ThreeScene } from '../../components/three/ThreeScene';
import { CheckCircle2, Copy, Search, Home, Building2 } from 'lucide-react';

export const ComplaintSubmitted: React.FC = () => {
  const location = useLocation();

  const complaint: Complaint = location.state?.complaint || {
    id: 'cmp-10482',
    reference: 'GRV-10482',
    categoryLabel: 'Conductor / Staff Behaviour',
    description: 'Conductor refused change receipt for Rs 50.',
    busNumber: 'KL-15-A-4021',
    routeFrom: 'Trivandrum Central',
    routeTo: 'Kollam Junction',
    depotName: 'Trivandrum Central Depot',
    status: 'submitted',
    priority: 'high',
    createdAt: new Date().toISOString(),
  };

  const copyReference = () => {
    navigator.clipboard.writeText(complaint.reference);
    alert(`Reference ID ${complaint.reference} copied to clipboard!`);
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      <Card className="p-6 sm:p-8 text-center space-y-6 bg-gradient-to-b from-emerald-50/40 via-white to-white border-emerald-200 shadow-lg shadow-emerald-50">
        
        {/* Success Header Icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner animate-bounce">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
            Grievance Registered Successfully
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#171717] mt-3">
            Your Reference ID: <span className="font-mono text-[#D92D20]">{complaint.reference}</span>
          </h1>
          <p className="text-xs text-[#667085] mt-1 max-w-md mx-auto">
            Save this reference number to track your case progress. No login or password required.
          </p>
        </div>

        {/* Copy Reference Box */}
        <div className="flex items-center justify-center gap-2 max-w-sm mx-auto p-3 bg-white rounded-2xl border border-[#EAECF0] shadow-xs">
          <span className="font-mono font-bold text-lg text-[#171717]">{complaint.reference}</span>
          <button
            onClick={copyReference}
            className="p-2 text-[#667085] hover:text-[#D92D20] hover:bg-red-50 rounded-xl transition-colors"
            title="Copy Reference Number"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>

        {/* Assigned Depot Card */}
        <div className="p-4 bg-white rounded-2xl border border-[#EAECF0] text-left grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-[#667085] block">Assigned Accountability Desk:</span>
            <div className="font-bold text-sm text-[#171717] flex items-center gap-1.5 mt-0.5">
              <Building2 className="w-4 h-4 text-[#D92D20]" />
              <span>{complaint.depotName || 'Trivandrum Central Depot'}</span>
            </div>
          </div>
          <div>
            <span className="text-[#667085] block">Vehicle & Route:</span>
            <span className="font-medium text-sm text-[#171717] block mt-0.5">
              Bus {complaint.busNumber} ({complaint.routeFrom} ➔ {complaint.routeTo})
            </span>
          </div>
        </div>

        {/* 3D Celebratory Motion Canvas */}
        <div className="h-[220px] rounded-3xl overflow-hidden bg-gradient-to-b from-gray-50 to-emerald-50/30 border border-[#EAECF0] relative">
          <ThreeScene type="route_success" compact />
          <div className="absolute bottom-2 left-3 text-[10px] text-emerald-800 bg-emerald-50/90 px-2 py-0.5 rounded-full font-semibold">
            Route Roster Trace Dispatched to Depot
          </div>
        </div>

        {/* Action CTAs */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to={`/track/${complaint.reference}`} className="w-full sm:w-auto">
            <Button variant="primary" size="lg" icon={<Search className="w-4 h-4" />}>
              Track Live Case Status
            </Button>
          </Link>
          <Link to="/" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" icon={<Home className="w-4 h-4" />}>
              Return to Home
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};
