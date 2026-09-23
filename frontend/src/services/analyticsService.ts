import type { SystemMetrics, TrendPoint, CategoryDistribution, DepotWorkload, RecurringIssueAlert } from '../types/analytics';
import { apiRequest } from './api';

export async function fetchSystemMetrics(): Promise<SystemMetrics> {
  const dashboard = await apiRequest<any>('/admin/dashboard');
  const total = dashboard.total_complaints || 0;
  const open = dashboard.pending || 0;
  const resolvedToday = dashboard.resolved || 0;
  const overdue = dashboard.escalated || 0;
  const critical = dashboard.urgent || 0;

  return {
    totalComplaints: total,
    openComplaints: open,
    resolvedToday,
    overdueCount: overdue,
    criticalCount: critical,
    avgResolutionTimeHours: 0,
    slaComplianceRate: total ? Math.round((resolvedToday / total) * 100) : 100,
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
  const user = JSON.parse(localStorage.getItem('anavandi_user') || 'null');
  if (user?.role === 'DEPOT_HEAD') {
    const dashboard = await apiRequest<any>('/depot/dashboard');
    return [{ depotId: String(user.depot_id), depotName: dashboard.depot?.name || 'My depot', open: dashboard.total - (dashboard.resolved || 0), overdue: dashboard.escalated || 0, resolvedThisWeek: dashboard.resolved || 0, slaCompliance: dashboard.total ? Math.round(((dashboard.resolved || 0) / dashboard.total) * 100) : 100 }];
  }
  const depots = await apiRequest<any[]>('/admin/depots/map');
  return depots.map((d) => ({
    depotId: String(d.depot_id), depotName: d.name, open: d.pending, overdue: d.escalated, resolvedThisWeek: d.resolved, slaCompliance: d.resolution_rate,
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
