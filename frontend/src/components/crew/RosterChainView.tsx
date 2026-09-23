import React from 'react';
import type { Complaint } from '../../types/complaint';
import { Bus, MapPin, Building2, Calendar, UserCheck, ShieldCheck, ArrowRight } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface RosterChainViewProps {
  complaint: Complaint;
}

export const RosterChainView: React.FC<RosterChainViewProps> = ({ complaint }) => {
  const steps = [
    {
      title: 'Complaint Reference',
      value: complaint.reference,
      subtext: `Category: ${complaint.categoryLabel}`,
      icon: <span className="font-mono text-xs font-bold text-[#D92D20]">#</span>,
      highlight: true,
    },
    {
      title: 'Bus Vehicle ID',
      value: complaint.busNumber || 'Not Specified',
      subtext: complaint.incidentTime || 'Incident Time',
      icon: <Bus className="w-4 h-4 text-amber-600" />,
    },
    {
      title: 'Route Master',
      value: complaint.routeFrom ? `${complaint.routeFrom} ➔ ${complaint.routeTo}` : 'Route Not Specified',
      subtext: complaint.routeCode ? `Code: ${complaint.routeCode}` : 'Standard Roster Route',
      icon: <MapPin className="w-4 h-4 text-blue-600" />,
    },
    {
      title: 'Assigned Depot',
      value: complaint.depotName || 'Regional Depot Desk',
      subtext: complaint.depotId ? `Depot ID: ${complaint.depotId}` : 'Assigned Depot Hub',
      icon: <Building2 className="w-4 h-4 text-purple-600" />,
    },
    {
      title: 'Duty / Shift Roster',
      value: complaint.dutyId ? `Duty ID: ${complaint.dutyId}` : 'Active Shift Roster',
      subtext: complaint.shiftSchedule || 'Scheduled Duty Shift',
      icon: <Calendar className="w-4 h-4 text-indigo-600" />,
    },
    {
      title: 'Conductor PEN (Employee)',
      value: complaint.conductorPen || 'PEN Verification Pending',
      subtext: complaint.conductorName ? `Assigned: ${complaint.conductorName}` : 'Role-Protected Record',
      icon: <UserCheck className="w-4 h-4 text-emerald-600" />,
      protected: true,
    },
    {
      title: 'Current Case Owner',
      value: complaint.assignedOwner || 'Depot In-Charge Desk',
      subtext: 'Active Inspector',
      icon: <ShieldCheck className="w-4 h-4 text-[#D92D20]" />,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#EAECF0] p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#EAECF0]">
        <div>
          <h3 className="text-base font-bold text-[#171717] flex items-center gap-2">
            <span>Operational Lineage & Roster Trace</span>
            <Badge variant="success" size="sm">
              Verified
            </Badge>
          </h3>
          <p className="text-xs text-[#667085] mt-0.5">
            Traceable accountability chain from bus registration to duty roster and authorized crew.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
        {steps.map((step, idx) => (
          <div key={idx} className="relative flex flex-col justify-between p-3 rounded-xl bg-[#F9FAFB] border border-[#EAECF0] hover:border-[#D92D20]/40 transition-colors">
            <div>
              <div className="flex items-center justify-between text-xs text-[#667085] font-medium mb-1">
                <span>Step {idx + 1}</span>
                {step.icon}
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#667085] block mb-1">
                {step.title}
              </span>
              <p className="font-bold text-xs text-[#171717] truncate" title={step.value}>
                {step.value}
              </p>
            </div>

            <div className="mt-2 pt-2 border-t border-[#EAECF0]/60 flex items-center justify-between">
              <span className="text-[10px] text-[#667085] truncate">{step.subtext}</span>
              {idx < steps.length - 1 && (
                <ArrowRight className="w-3 h-3 text-[#98A2B3] hidden lg:block shrink-0" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
