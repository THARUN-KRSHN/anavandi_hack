import React from 'react';
import type { CrewMember } from '../../types/crew';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Shield, Star, Bus, Phone } from 'lucide-react';

interface CrewCardProps {
  crew: CrewMember;
}

export const CrewCard: React.FC<CrewCardProps> = ({ crew }) => {
  return (
    <Card className="flex flex-col justify-between border-[#EAECF0] hover:border-gray-300">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-[#D92D20] flex items-center justify-center font-bold text-sm">
            {crew.name.charAt(0)}
          </div>
          <div>
            <h4 className="font-bold text-[#171717] text-base flex items-center gap-2">
              {crew.name}
              <Badge variant="muted" size="sm" className="font-mono">
                {crew.pen}
              </Badge>
            </h4>
            <span className="text-xs text-[#667085] capitalize">{crew.role}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
          <span>{crew.rating}</span>
        </div>
      </div>

      <div className="space-y-2 py-3 border-t border-b border-[#EAECF0] my-2 text-xs">
        <div className="flex items-center justify-between text-[#344054]">
          <span className="text-[#667085]">Depot:</span>
          <span className="font-medium">{crew.depotName}</span>
        </div>
        <div className="flex items-center justify-between text-[#344054]">
          <span className="text-[#667085]">Active Duty ID:</span>
          <span className="font-mono font-semibold text-[#D92D20]">
            {crew.currentDutyId || 'D-104'}
          </span>
        </div>
        <div className="flex items-center justify-between text-[#344054]">
          <span className="text-[#667085]">Current Bus:</span>
          <span className="font-mono font-medium flex items-center gap-1">
            <Bus className="w-3 h-3 text-[#667085]" />
            {crew.currentBusNumber || 'KL-15-A-4021'}
          </span>
        </div>
        <div className="flex items-center justify-between text-[#344054]">
          <span className="text-[#667085]">Phone Contact:</span>
          <span className="font-medium flex items-center gap-1">
            <Phone className="w-3 h-3 text-[#667085]" />
            {crew.phone}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 text-[11px] text-[#667085]">
        <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-medium">
          <Shield className="w-3 h-3" />
          <span>Role Protected Record</span>
        </div>
        <span>{crew.totalTripsCompleted} trips</span>
      </div>
    </Card>
  );
};
