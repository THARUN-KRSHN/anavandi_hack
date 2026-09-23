import React from 'react';
import type { ComplaintPriority } from '../../types/complaint';
import { Badge } from '../ui/Badge';
import { AlertCircle, AlertOctagon, Info } from 'lucide-react';

interface PriorityBadgeProps {
  priority: ComplaintPriority;
  size?: 'sm' | 'md';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'md' }) => {
  const config: Record<
    ComplaintPriority,
    { label: string; variant: 'muted' | 'warning' | 'danger'; icon: React.ReactNode }
  > = {
    normal: {
      label: 'Normal Priority',
      variant: 'muted',
      icon: <Info className="w-3.5 h-3.5" />,
    },
    high: {
      label: 'High Priority',
      variant: 'warning',
      icon: <AlertCircle className="w-3.5 h-3.5" />,
    },
    critical: {
      label: 'Critical Priority',
      variant: 'danger',
      icon: <AlertOctagon className="w-3.5 h-3.5" />,
    },
  };

  const item = config[priority];

  return (
    <Badge variant={item.variant} size={size}>
      {item.icon}
      <span>{item.label}</span>
    </Badge>
  );
};
