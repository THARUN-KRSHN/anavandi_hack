import type { SystemMetrics, TrendPoint, CategoryDistribution, DepotWorkload, RecurringIssueAlert } from '../types/analytics';
import { fetchComplaints } from './complaintsService';
import { fetchDepots } from './depotService';

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
    totalComplaints: total,
    openComplaints: open,
    resolvedToday: resolvedToday,
    overdueCount: overdue,
    criticalCount: critical,
    avgResolutionTimeHours: 14.5,
    slaComplianceRate: 94.0,
  };
}

export async function fetchTrendData(): Promise<TrendPoint[]> {
  const complaints = await fetchComplaints();
  const today = new Date();
  const days: { date: string; submitted: number; resolved: number; escalated: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const dayComplaints = complaints.filter(
      (c) => new Date(c.createdAt).toDateString() === d.toDateString()
    );
    days.push({
      date: dateStr,
      submitted: dayComplaints.length,
      resolved: dayComplaints.filter((c) => c.status === 'resolved').length,
      escalated: dayComplaints.filter((c) => c.status === 'escalated').length,
    });
  }

  return days;
}

export async function fetchCategoryDistribution(): Promise<CategoryDistribution[]> {
  const complaints = await fetchComplaints();
  const counts: Record<string, number> = {};
  for (const c of complaints) {
    counts[c.category] = (counts[c.category] || 0) + 1;
  }
  const total = complaints.length || 1;

  const categories = [
    { category: 'conductor_staff', label: 'Conductor / Staff', color: '#D92D20' },
    { category: 'cleanliness', label: 'Cleanliness & Hygiene', color: '#F59E0B' },
    { category: 'driver', label: 'Driving & Overspeeding', color: '#EF4444' },
    { category: 'ticketing', label: 'UPI / Ticketing ETIM', color: '#3B82F6' },
    { category: 'route_timing', label: 'Route Delays & Skipping', color: '#8B5CF6' },
    { category: 'other', label: 'Other', color: '#6B7280' },
  ];

  return categories.map((cat) => ({
    ...cat,
    count: counts[cat.category] || 0,
    percentage: Math.round(((counts[cat.category] || 0) / total) * 100),
  }));
}

export async function fetchDepotWorkload(): Promise<DepotWorkload[]> {
  const depots = await fetchDepots();
  return depots.slice(0, 10).map((d) => ({
    depotId: d.id,
    depotName: d.name,
    open: d.openComplaints,
    overdue: Math.max(0, d.totalComplaints - d.resolvedComplaints),
    resolvedThisWeek: d.resolvedComplaints,
    slaCompliance: Math.round(100 - ((Math.max(0, d.totalComplaints - d.resolvedComplaints)) / (d.totalComplaints || 1)) * 100),
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
