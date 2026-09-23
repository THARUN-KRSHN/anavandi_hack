import React from 'react';
import type { RecurringIssueAlert } from '../../types/analytics';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ShieldAlert, ArrowRight } from 'lucide-react';

interface RecurringAlertCardProps {
  alert: RecurringIssueAlert;
  onInspect?: () => void;
}

export const RecurringAlertCard: React.FC<RecurringAlertCardProps> = ({ alert, onInspect }) => {
  return (
    <Card className="border-red-200 bg-red-50/20 hover:border-red-300">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-red-100 text-[#D92D20]">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="font-bold text-[#171717] text-sm">
              Recurring Issue Threshold Triggered
            </h4>
            <span className="text-xs text-[#667085]">
              {alert.routeName} ({alert.timeWindow})
            </span>
          </div>
        </div>
        <Badge variant="danger" size="sm">
          {alert.count} Incidents Detected
        </Badge>
      </div>

      <div className="bg-white p-3 rounded-xl border border-red-100 my-3 text-xs text-[#344054]">
        <div className="font-semibold text-[#D92D20] mb-1">
          Pattern: {alert.categoryLabel}
        </div>
        <p>{alert.evidenceSummary}</p>
      </div>

      <div className="flex items-center justify-between text-xs pt-1">
        <span className="text-[#667085]">Depot: <strong>{alert.assignedDepot}</strong></span>
        {onInspect && (
          <button
            onClick={onInspect}
            className="text-[#D92D20] font-semibold hover:underline flex items-center gap-1"
          >
            Investigate Hotspot <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </Card>
  );
};
