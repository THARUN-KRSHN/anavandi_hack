export interface SystemMetrics {
  totalComplaints: number;
  openComplaints: number;
  resolvedToday: number;
  overdueCount: number;
  criticalCount: number;
  avgResolutionTimeHours: number;
  slaComplianceRate: number;
}

export interface TrendPoint {
  date: string;
  submitted: number;
  resolved: number;
  escalated: number;
}

export interface CategoryDistribution {
  category: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface DepotWorkload {
  depotId: string;
  depotName: string;
  open: number;
  overdue: number;
  resolvedThisWeek: number;
  slaCompliance: number;
}

export interface RecurringIssueAlert {
  id: string;
  routeId: string;
  routeName: string;
  busNumber?: string;
  category: string;
  categoryLabel: string;
  count: number;
  timeWindow: string; // e.g. "Last 7 days"
  assignedDepot: string;
  evidenceSummary: string;
  status: 'active' | 'investigating' | 'resolved';
  severity: 'high' | 'critical';
}
