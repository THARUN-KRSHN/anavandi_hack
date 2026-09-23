import React from 'react';
import { Card } from '../ui/Card';
import { cn } from '../../utils/cn';

interface StatCardProps {
  title: string;
  value: string | number;
  label?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  variant?: 'default' | 'danger' | 'warning' | 'success';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  label,
  icon,
  trend,
  variant = 'default',
}) => {
  const borderColors = {
    default: 'hover:border-gray-300',
    danger: 'border-red-200 bg-red-50/20',
    warning: 'border-amber-200 bg-amber-50/20',
    success: 'border-emerald-200 bg-emerald-50/20',
  };

  return (
    <Card className={cn('flex flex-col justify-between', borderColors[variant])}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-semibold text-[#667085] uppercase tracking-wider">
          {title}
        </span>
        {icon && (
          <div className="p-2 rounded-xl bg-[#F9FAFB] border border-[#EAECF0] text-[#171717]">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="text-3xl font-extrabold text-[#171717] tracking-tight">{value}</div>
        {(label || trend) && (
          <div className="flex items-center gap-2 mt-1.5 text-xs text-[#667085]">
            {trend && (
              <span
                className={cn(
                  'font-semibold px-1.5 py-0.5 rounded',
                  trend.isPositive
                    ? 'text-emerald-700 bg-emerald-50'
                    : 'text-red-700 bg-red-50'
                )}
              >
                {trend.value}
              </span>
            )}
            {label && <span>{label}</span>}
          </div>
        )}
      </div>
    </Card>
  );
};
