import type { SystemMetrics, TrendPoint, CategoryDistribution, DepotWorkload, RecurringIssueAlert } from '../types/analytics';
import { fetchComplaints } from './complaintsService';
import { mockDepots } from '../data/mock/depotsData';

export async function fetchSystemMetrics(): Promise<SystemMetrics> {
  const complaints = await fetchComplaints();
  const total = complaints.length;
  const open = complaints.filter(
    (c) => c.status === 'submitted' || c.status === 'assigned' || c.status === 'acknowledged' || c.status === 'investigating'
  ).length;
  const resolvedToday = complaints.filter((c) => c.status === 'resolved').length;
  const overdue = complaints.filter((c) => c.status === 'escalated' || c.priority === 'critical').length;
  const critical = complaints.filter((c) => c.priority === 'critical').length;

  return {
    totalComplaints: total + 124, // include historical base
    openComplaints: open,
    resolvedToday: resolvedToday + 14,
    overdueCount: overdue + 4,
    criticalCount: critical + 2,
    avgResolutionTimeHours: 15.4,
    slaComplianceRate: 91.2,
  };
}

export async function fetchTrendData(): Promise<TrendPoint[]> {
  return [
    { date: 'Sep 17', submitted: 18, resolved: 16, escalated: 1 },
    { date: 'Sep 18', submitted: 24, resolved: 21, escalated: 2 },
    { date: 'Sep 19', submitted: 15, resolved: 18, escalated: 0 },
    { date: 'Sep 20', submitted: 30, resolved: 25, escalated: 3 },
    { date: 'Sep 21', submitted: 22, resolved: 20, escalated: 1 },
    { date: 'Sep 22', submitted: 28, resolved: 24, escalated: 2 },
    { date: 'Sep 23', submitted: 19, resolved: 14, escalated: 1 },
  ];
}

export async function fetchCategoryDistribution(): Promise<CategoryDistribution[]> {
  return [
    { category: 'conductor_staff', label: 'Conductor / Staff', count: 48, percentage: 34, color: '#D92D20' },
    { category: 'cleanliness', label: 'Cleanliness & Hygiene', count: 32, percentage: 22, color: '#F59E0B' },
    { category: 'driver', label: 'Driving & Overspeeding', count: 24, percentage: 17, color: '#EF4444' },
    { category: 'ticketing', label: 'UPI / Ticketing ETIM', count: 18, percentage: 13, color: '#3B82F6' },
    { category: 'route_timing', label: 'Route Delays & Skipping', count: 12, percentage: 8, color: '#8B5CF6' },
    { category: 'other', label: 'Other', count: 8, percentage: 6, color: '#6B7280' },
  ];
}

export async function fetchDepotWorkload(): Promise<DepotWorkload[]> {
  return mockDepots.map((d) => ({
    depotId: d.id,
    depotName: d.name,
    open: d.openComplaints,
    overdue: d.overdueComplaints,
    resolvedThisWeek: d.resolvedToday * 5,
    slaCompliance: Math.round(100 - (d.overdueComplaints / (d.openComplaints || 1)) * 100),
  }));
}

export async function fetchRecurringIssueAlerts(): Promise<RecurringIssueAlert[]> {
  return [
    {
      id: 'alert-101',
      routeId: 'RT-102',
      routeName: 'Trivandrum Central - Kollam Junction',
      busNumber: 'KL-15-A-4021',
      category: 'conductor_staff',
      categoryLabel: 'Conductor / Staff Behaviour',
      count: 4,
      timeWindow: 'Last 72 hours',
      assignedDepot: 'Trivandrum Central Depot',
      evidenceSummary: '4 passenger grievances logged regarding unissued change receipts on Attingal section.',
      status: 'active',
      severity: 'critical',
    },
    {
      id: 'alert-102',
      routeId: 'RT-205',
      routeName: 'Ernakulam - Thrissur Super Fast',
      category: 'cleanliness',
      categoryLabel: 'Bus Cleanliness & Hygiene',
      count: 6,
      timeWindow: 'Last 7 days',
      assignedDepot: 'Ernakulam Central Depot',
      evidenceSummary: '6 complaints reported dusty rear seats & clogged AC vents on morning shift.',
      status: 'investigating',
      severity: 'high',
    },
  ];
}
