import React from 'react';
import type { ComplaintStatus } from '../../types/complaint';
import { Badge } from '../ui/Badge';
import { Clock, CheckCircle2, AlertTriangle, ShieldAlert, Search, UserCheck, RefreshCw } from 'lucide-react';

interface StatusBadgeProps {
  status: ComplaintStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const config: Record<
    ComplaintStatus,
    { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted'; icon: React.ReactNode }
  > = {
    submitted: {
      label: 'Submitted',
      variant: 'info',
      icon: <Clock className="w-3.5 h-3.5" />,
    },
    assigned: {
      label: 'Assigned',
      variant: 'info',
      icon: <UserCheck className="w-3.5 h-3.5" />,
    },
    acknowledged: {
      label: 'Acknowledged',
      variant: 'warning',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    },
    investigating: {
      label: 'Investigating',
      variant: 'warning',
      icon: <Search className="w-3.5 h-3.5" />,
    },
    resolved: {
      label: 'Resolved',
      variant: 'success',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    },
    reopened: {
      label: 'Reopened',
      variant: 'danger',
      icon: <RefreshCw className="w-3.5 h-3.5" />,
    },
    escalated: {
      label: 'Escalated',
      variant: 'danger',
      icon: <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />,
    },
  };

  const item = config[status] || { label: status, variant: 'muted', icon: <AlertTriangle className="w-3.5 h-3.5" /> };

  return (
    <Badge variant={item.variant} size={size}>
      {item.icon}
      <span>{item.label}</span>
    </Badge>
  );
};
