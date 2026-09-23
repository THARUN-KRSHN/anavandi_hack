import React from 'react';
import type { Complaint } from '../../types/complaint';
import { Card } from '../ui/Card';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { formatRelativeAge } from '../../utils/dateUtils';
import { Bus, MapPin, ArrowRight } from 'lucide-react';

interface ComplaintCardProps {
  complaint: Complaint;
  onClick?: () => void;
  showDetailsButton?: boolean;
}

export const ComplaintCard: React.FC<ComplaintCardProps> = ({
  complaint,
  onClick,
  showDetailsButton = true,
}) => {
  return (
    <Card
      hoverable
      onClick={onClick}
      className="flex flex-col gap-4 border-[#EAECF0] hover:border-[#D92D20]/40 transition-all duration-200"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold bg-red-50 text-[#D92D20] px-2.5 py-1 rounded-lg border border-red-100">
            {complaint.reference}
          </span>
          <span className="text-xs text-[#667085]">{formatRelativeAge(complaint.createdAt)}</span>
        </div>
        <div className="flex items-center gap-2">
          <PriorityBadge priority={complaint.priority} size="sm" />
          <StatusBadge status={complaint.status} size="sm" />
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-base text-[#171717] mb-1">
          {complaint.categoryLabel}
        </h4>
        <p className="text-sm text-[#475467] line-clamp-2">{complaint.description}</p>
      </div>

      {complaint.evidenceFiles && complaint.evidenceFiles.length > 0 && (
        <div className="flex items-center gap-2 pt-1">
          {complaint.evidenceFiles.map((imgUrl, i) => (
            <img
              key={i}
              src={imgUrl}
              alt={`Evidence ${i + 1}`}
              className="w-12 h-12 object-cover rounded-lg border border-[#EAECF0]"
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#667085] pt-3 border-t border-[#EAECF0]">
        <div className="flex items-center gap-1.5 font-medium text-[#344054]">
          <Bus className="w-4 h-4 text-[#D92D20] shrink-0" />
          <span>Bus: {complaint.busNumber || 'N/A'}</span>
        </div>
        <div className="flex items-center gap-1.5 truncate">
          <MapPin className="w-4 h-4 text-[#667085] shrink-0" />
          <span className="truncate">
            {complaint.routeFrom} ➔ {complaint.routeTo}
          </span>
        </div>
      </div>

      {showDetailsButton && (
        <div className="flex items-center justify-end pt-1">
          <span className="text-xs font-semibold text-[#D92D20] flex items-center gap-1 hover:gap-2 transition-all">
            View Case Details <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      )}
    </Card>
  );
};
