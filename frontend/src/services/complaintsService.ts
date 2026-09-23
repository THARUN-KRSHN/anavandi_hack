import type { Complaint, ComplaintCategory, ComplaintStatus } from '../types/complaint';
import { apiRequest } from './api';

const categoryMap: Record<ComplaintCategory, string> = { cleanliness: 'CLEANLINESS', conductor_staff: 'OTHER', driver: 'UNSAFE_DRIVING', ticketing: 'OTHER', overcrowding: 'OVERCROWDING', bus_condition: 'OTHER', safety: 'UNSAFE_DRIVING', route_timing: 'MISSED_STOP', other: 'OTHER' };
const statusMap: Record<string, ComplaintStatus> = { SUBMITTED: 'submitted', ASSIGNED: 'assigned', UNDER_REVIEW: 'investigating', ACTION_TAKEN: 'acknowledged', UNABLE_TO_RESOLVE: 'escalated', RESOLVED: 'resolved', ESCALATED: 'escalated' };

function mapComplaint(raw: any): Complaint {
  return { id: String(raw.id), reference: raw.reference_number, category: (raw.category || 'other').toLowerCase() as ComplaintCategory, categoryLabel: raw.category, description: raw.description, busNumber: raw.bus?.bus_number, routeFrom: raw.route?.source, routeTo: raw.route?.destination, routeCode: raw.route?.route_code, depotId: raw.depot_id ? String(raw.depot_id) : undefined, depotName: raw.depot?.name, status: statusMap[raw.status] || 'submitted', priority: String(raw.priority || 'NORMAL').toLowerCase() as Complaint['priority'], createdAt: raw.created_at, updatedAt: raw.updated_at || raw.created_at, assignedOwner: raw.assigned_to, conductorPen: raw.conductor?.pen, timeline: (raw.history || raw.timeline || []).map((event: any) => ({ id: String(event.id), timestamp: event.created_at || event.timestamp, status: statusMap[event.new_status] || 'submitted', actorRole: event.changed_by_role === 'ADMIN' ? 'system_admin' : event.changed_by_role === 'DEPOT_HEAD' ? 'depot_manager' : 'passenger', actorName: event.changed_by_role || 'System', notes: event.comment, isPublic: true })) };
}

export async function fetchComplaints(filters?: { status?: string; category?: string; priority?: string; depotId?: string; search?: string }): Promise<Complaint[]> {
  const query = new URLSearchParams();
  if (filters?.status && filters.status !== 'all') query.set('status', filters.status.toUpperCase());
  if (filters?.category && filters.category !== 'all') query.set('category', filters.category.toUpperCase());
  if (filters?.priority && filters.priority !== 'all') query.set('priority', filters.priority.toUpperCase());
  const user = JSON.parse(localStorage.getItem('anavandi_user') || 'null');
  const path = user?.role === 'USER' ? '/complaints/mine' : user?.role === 'ADMIN' ? `/admin/complaints?${query.toString()}` : `/depot/complaints?${query.toString()}`;
  const result = await apiRequest<{ complaints: any[] } | any[]>(path);
  const list = Array.isArray(result) ? result : result.complaints;
  const search = filters?.search?.toLowerCase();
  return list.map(mapComplaint).filter((item) => !search || `${item.reference} ${item.description}`.toLowerCase().includes(search));
}

export async function fetchComplaintById(idOrRef: string): Promise<Complaint | null> {
  try {
    const user = JSON.parse(localStorage.getItem('anavandi_user') || 'null');
    const path = user?.role === 'DEPOT_HEAD' && /^\d+$/.test(idOrRef) ? `/depot/complaints/${idOrRef}` : `/complaints/${encodeURIComponent(idOrRef)}`;
    return mapComplaint(await apiRequest<any>(path));
  } catch { return null; }
}

export interface CreateComplaintDTO { category: ComplaintCategory; categoryLabel: string; description: string; busId?: number; routeId?: number; incidentTime?: string; evidenceFiles?: string[]; }

export async function createComplaint(dto: CreateComplaintDTO): Promise<Complaint> {
  const result = await apiRequest<{ reference_number: string; status: string; depot?: string }>('/complaints', { method: 'POST', body: JSON.stringify({ category: categoryMap[dto.category], description: dto.description, bus_id: dto.busId, route_id: dto.routeId, reported_at: dto.incidentTime || new Date().toISOString(), client_request_id: crypto.randomUUID() }) });
  return { id: result.reference_number, reference: result.reference_number, category: dto.category, categoryLabel: dto.categoryLabel, description: dto.description, status: 'submitted', priority: 'normal', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), timeline: [] };
}

export async function updateComplaintStatus(id: string, newStatus: ComplaintStatus, notes?: string, _actorRole?: string, _actorName?: string): Promise<Complaint> {
  const backendStatus: Record<ComplaintStatus, string> = { submitted: 'SUBMITTED', assigned: 'ASSIGNED', acknowledged: 'UNDER_REVIEW', investigating: 'UNDER_REVIEW', resolved: 'RESOLVED', reopened: 'UNDER_REVIEW', escalated: 'ESCALATED' };
  return mapComplaint(await apiRequest<any>(`/depot/complaints/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: backendStatus[newStatus], comment: notes }) }));
}

export async function assignComplaint(id: string, assignedOwner: string): Promise<Complaint> { return updateComplaintStatus(id, 'assigned', `Assigned to ${assignedOwner}`); }
