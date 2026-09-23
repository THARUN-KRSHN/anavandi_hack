import type { Complaint, ComplaintCategory, ComplaintStatus } from '../types/complaint';
import { apiRequest } from './api';

const categoryMap: Record<ComplaintCategory, string> = { cleanliness: 'CLEANLINESS', conductor_staff: 'OTHER', driver: 'UNSAFE_DRIVING', ticketing: 'OTHER', overcrowding: 'OVERCROWDING', bus_condition: 'OTHER', safety: 'UNSAFE_DRIVING', route_timing: 'MISSED_STOP', other: 'OTHER' };
const statusMap: Record<string, ComplaintStatus> = { SUBMITTED: 'submitted', ASSIGNED: 'assigned', UNDER_REVIEW: 'acknowledged', ACTION_TAKEN: 'forwarded_to_conductor', UNABLE_TO_RESOLVE: 'escalated', RESOLVED: 'resolved', ESCALATED: 'escalated', ACTION_REQUIRED: 'forwarded_to_conductor' };
const categoryLabels: Record<string, string> = { CLEANLINESS: 'Cleanliness & Hygiene', UNSAFE_DRIVING: 'Unsafe Driving', OVERCROWDING: 'Overcrowding', MISSED_STOP: 'Missed Stop', CONCESSION_DENIAL: 'Concession Denial', OTHER: 'Other Grievance' };

function mapComplaint(raw: any): Complaint {
  const possible = raw.possible_conductor;
  return { id: String(raw.id), reference: raw.reference_number, category: (raw.category || 'OTHER').toLowerCase() as ComplaintCategory, categoryLabel: categoryLabels[raw.category] || raw.category, description: raw.description, busNumber: raw.bus?.bus_number, routeFrom: raw.route?.source, routeTo: raw.route?.destination, routeCode: raw.route?.route_code, incidentTime: raw.reported_time, depotId: raw.depot_id ? String(raw.depot_id) : undefined, depotName: raw.depot?.name, status: statusMap[raw.status] || 'submitted', priority: String(raw.priority || 'NORMAL').toLowerCase() as Complaint['priority'], createdAt: raw.created_at, updatedAt: raw.updated_at || raw.created_at, conductorPen: possible?.conductor?.pen, conductorName: possible?.conductor?.name, conductorPhone: possible?.conductor?.phone, userLat: raw.latitude, userLng: raw.longitude, timeline: (raw.timeline || []).map((event: any) => ({ id: String(event.id), timestamp: event.created_at, status: statusMap[event.new_status] || 'submitted', actorRole: event.changed_by_role === 'ADMIN' ? 'system_admin' : event.changed_by_role === 'DEPOT_HEAD' ? 'depot_manager' : 'passenger', actorName: event.changed_by_role || 'System', notes: event.comment, isPublic: true })) };
}

export async function fetchComplaints(filters?: { status?: string; category?: string; priority?: string; depotId?: string; search?: string }): Promise<Complaint[]> {
  const query = new URLSearchParams();
  if (filters?.status && filters.status !== 'all') query.set('status', filters.status.toUpperCase());
  if (filters?.category && filters.category !== 'all') query.set('category', filters.category.toUpperCase());
  if (filters?.priority && filters.priority !== 'all') query.set('priority', filters.priority.toUpperCase());
  if (filters?.depotId && filters.depotId !== 'all') query.set('depot_id', filters.depotId);
  const user = JSON.parse(localStorage.getItem('anavandi_user') || 'null');
  const path = user?.role === 'USER' ? '/complaints/mine' : user?.role === 'ADMIN' ? `/admin/complaints?${query}` : `/depot/complaints?${query}`;
  const payload = await apiRequest<any>(path);
  const rows = Array.isArray(payload) ? payload : payload.complaints || [];
  const search = filters?.search?.toLowerCase();
  return rows.map(mapComplaint).filter((item: Complaint) => !search || `${item.reference} ${item.description} ${item.busNumber || ''}`.toLowerCase().includes(search));
}

export async function fetchComplaintById(idOrRef: string): Promise<Complaint | null> {
  try { const user = JSON.parse(localStorage.getItem('anavandi_user') || 'null'); const path = user?.role === 'depot_head' && /^\d+$/.test(idOrRef) ? `/depot/complaints/${idOrRef}` : `/complaints/${encodeURIComponent(idOrRef)}`; return mapComplaint(await apiRequest<any>(path)); } catch { return null; }
}

export interface CreateComplaintDTO {
  category: ComplaintCategory;
  categoryLabel: string;
  description: string;
  busId?: number;
  routeId?: number;
  busNumber?: string;
  routeFrom?: string;
  routeTo?: string;
  incidentTime?: string;
  latitude?: number;
  longitude?: number;
  evidenceFiles?: string[];
  other_description?: string;
}

export async function createComplaint(dto: CreateComplaintDTO): Promise<Complaint> {
  const normalizedCategory = dto.category.toLowerCase().replace(/[^a-z]+/g, '_') as ComplaintCategory;
  const backendCategory = categoryMap[normalizedCategory] || 'OTHER';
  const result = await apiRequest<any>('/complaints', {
    method: 'POST',
    body: JSON.stringify({
      category: backendCategory,
      description: dto.description,
      other_description: backendCategory === 'OTHER' ? dto.description : undefined,
      bus_id: dto.busId,
      route_id: dto.routeId,
      latitude: dto.latitude,
      longitude: dto.longitude,
      reported_at: dto.incidentTime || new Date().toISOString(),
      client_request_id: crypto.randomUUID(),
    }),
  });
  return fetchComplaintById(result.reference_number) as Promise<Complaint>;
}

export async function updateComplaintStatus(id: string, newStatus: ComplaintStatus, notes?: string, _actorRole?: string, _actorName?: string): Promise<Complaint> {
  const backendStatus: Record<ComplaintStatus, string> = { submitted: 'SUBMITTED', assigned: 'ASSIGNED', forwarded_to_conductor: 'ACTION_TAKEN', acknowledged: 'UNDER_REVIEW', resolved: 'RESOLVED', investigating: 'UNDER_REVIEW', escalated: 'ESCALATED' };
  return mapComplaint(await apiRequest<any>(`/depot/complaints/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: backendStatus[newStatus], comment: notes }) }));
}

export async function assignComplaint(id: string, assignedOwner: string): Promise<Complaint> { return updateComplaintStatus(id, 'assigned', `Assigned to ${assignedOwner}`); }

export async function downloadComplaintPdfBlob(referenceNumber: string): Promise<Blob> {
  const token = localStorage.getItem('anavandi_token');
  const res = await fetch(`/api/complaints/${encodeURIComponent(referenceNumber)}/pdf`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('PDF download failed');
  return res.blob();
}
