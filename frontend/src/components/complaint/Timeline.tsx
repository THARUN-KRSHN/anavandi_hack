import React from 'react';
import type { TimelineEvent } from '../../types/complaint';
import { formatDate } from '../../utils/dateUtils';
import { StatusBadge } from './StatusBadge';
import { CheckCircle2, Clock, User, ShieldCheck } from 'lucide-react';

interface TimelineProps {
  events: TimelineEvent[];
  isPublicView?: boolean;
}

export const Timeline: React.FC<TimelineProps> = ({ events, isPublicView = false }) => {
  const visibleEvents = isPublicView ? events.filter((e) => e.isPublic) : events;

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#EAECF0]">
      {visibleEvents.map((event, index) => {
        const isLatest = index === visibleEvents.length - 1;

        return (
          <div key={event.id} className="relative group">
            {/* Timeline node icon */}
            <div
              className={`absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold ring-4 ring-white ${
                isLatest
                  ? 'bg-[#D92D20] text-white ring-red-100'
                  : 'bg-emerald-500 text-white ring-emerald-100'
              }`}
            >
              {isLatest ? <Clock className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
            </div>

            <div className="bg-[#F9FAFB] rounded-2xl p-4 border border-[#EAECF0] transition-colors hover:border-[#D0D5DD]">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <StatusBadge status={event.status} size="sm" />
                <span className="text-xs text-[#667085]">{formatDate(event.timestamp)}</span>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#171717] mt-1 mb-2">
                {event.actorRole === 'passenger' ? (
                  <User className="w-3.5 h-3.5 text-[#667085]" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-[#D92D20]" />
                )}
                <span>{event.actorName}</span>
                <span className="text-[#667085] font-normal">
                  ({event.actorRole.replace('_', ' ')})
                </span>
              </div>

              {event.notes && (
                <p className="text-sm text-[#344054] bg-white p-3 rounded-xl border border-[#EAECF0] mt-2">
                  {event.notes}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
