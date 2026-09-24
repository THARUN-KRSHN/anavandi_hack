import React from 'react';
import { Bus, MapPin, ShieldCheck, Route } from 'lucide-react';

interface WebGLFallbackProps {
  type?: 'hero' | 'success' | 'depot';
}

export const WebGLFallback: React.FC<WebGLFallbackProps> = ({ type = 'hero' }) => {
  if (type === 'success') {
    return (
      <div className="w-full h-full min-h-[200px] bg-gradient-to-br from-emerald-50 via-white to-green-50 rounded-2xl p-6 border border-emerald-200 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3 animate-bounce">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h4 className="font-bold text-[#171717] text-base">Grievance Registered Successfully</h4>
        <p className="text-xs text-[#667085] mt-1 max-w-sm">
          Traceable operational case dispatched to designated depot roster desk.
        </p>
      </div>
    );
  }

  if (type === 'depot') {
    return (
      <div className="w-full h-full min-h-[220px] bg-gradient-to-br from-gray-50 via-white to-red-50 rounded-2xl p-6 border border-[#EAECF0] flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-100 text-[#D92D20] flex items-center justify-center mb-3">
          <Route className="w-7 h-7" />
        </div>
        <h4 className="font-bold text-[#171717] text-sm">Depot Fleet Overview</h4>
        <p className="text-xs text-[#667085] mt-1">
          Active roster trace & bus monitoring active.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[280px] bg-gradient-to-br from-red-50/50 via-white to-amber-50/50 rounded-3xl p-6 border border-[#EAECF0] flex flex-col items-center justify-center text-center relative overflow-hidden">
      <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-red-100/50 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -left-8 -top-8 w-40 h-40 bg-amber-100/50 rounded-full blur-2xl pointer-events-none" />

      {/* Stylized vector illustration */}
      <div className="relative z-10 flex items-center gap-3 mb-4">
        <div className="p-3 bg-[#D92D20] text-white rounded-2xl shadow-lg shadow-red-200">
          <Bus className="w-8 h-8" />
        </div>
        <div className="h-0.5 w-12 bg-dashed border-t-2 border-dashed border-red-300" />
        <div className="p-2.5 bg-emerald-500 text-white rounded-xl shadow-md">
          <MapPin className="w-6 h-6" />
        </div>
      </div>

      <h3 className="text-base font-bold text-[#171717] z-10">Bus Sahayi Transit Network</h3>
      <p className="text-xs text-[#667085] mt-1 max-w-xs z-10">
        Public Transport Grievance & Depot Accountability System
      </p>
    </div>
  );
};
