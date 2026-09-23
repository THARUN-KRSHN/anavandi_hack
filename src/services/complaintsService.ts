import type { Complaint, ComplaintStatus, ComplaintCategory } from '../types/complaint';
import { generateReferenceNumber } from '../utils/dateUtils';
import { syncEngine } from './syncEngine';
import { addNotification } from './notificationService';
import { apiRequest } from './api';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const STORAGE_KEY = 'anavandi_complaints_v1';

function getStoredComplaints(): Complaint[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    // Purge any residual mock complaints
    return parsed.filter(
      (c: Complaint) =>
        !c.reference?.startsWith('GRV-2026-104') &&
        !c.description?.includes('Air conditioning broken') &&
        !c.description?.includes('Reckless overtaking near Aluva')
    );
  } catch {
    return [];
  }
}

function saveStoredComplaints(complaints: Complaint[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints));
    syncEngine.broadcast('COMPLAINT_UPDATED');
  } catch (err) {
    console.error('Failed to save complaints to localStorage:', err);
  }
}

export async function fetchComplaints(filters?: {
  status?: string;
  category?: string;
  priority?: string;
  depotId?: string;
  search?: string;
}): Promise<Complaint[]> {
  let list = getStoredComplaints();

  // 1. Fetch real complaints from Backend API if authenticated
  try {
    const token = localStorage.getItem('anavandi_access_token');
    if (token) {
      const backendComplaints = await apiRequest<any[]>('/complaints').catch(() => null);
      if (Array.isArray(backendComplaints) && backendComplaints.length > 0) {
        const mapped = backendComplaints.map((raw: any) => ({
          id: String(raw.id),
          reference: raw.reference_number || `GRV-${raw.id}`,
          category: (raw.category?.toLowerCase() || 'other') as ComplaintCategory,
          categoryLabel: raw.category || 'Grievance',
          description: raw.description || '',
          busNumber: raw.bus_number || raw.bus?.bus_number || '',
          routeFrom: raw.route_from || raw.route?.source || '',
          routeTo: raw.route_to || raw.route?.destination || '',
          incidentTime: raw.reported_time || 'Recent',
          depotId: raw.depot_id ? String(raw.depot_id) : 'DEP-TVM',
          depotName: raw.depot?.name || 'Depot Accountability Desk',
          status: (raw.status?.toLowerCase() || 'submitted') as ComplaintStatus,
          priority: (raw.priority?.toLowerCase() || 'normal') as Complaint['priority'],
          createdAt: raw.created_at || new Date().toISOString(),
          updatedAt: raw.updated_at || raw.created_at || new Date().toISOString(),
          timeline: raw.timeline || [],
        }));

        const existingIds = new Set(list.map((c) => c.reference));
        for (const m of mapped) {
          if (!existingIds.has(m.reference)) {
            list.push(m);
          }
        }
      }
    }
  } catch (err) {
    console.warn('Backend complaints sync fallback:', err);
  }

  // 2. Fetch real complaints from Supabase
  if (isSupabaseConfigured()) {
    try {
      const { data: sbRows } = await supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false });

      if (Array.isArray(sbRows) && sbRows.length > 0) {
        const existingRefs = new Set(list.map((c) => c.reference));
        for (const r of sbRows) {
          if (r.reference_number && !existingRefs.has(r.reference_number)) {
            list.push({
              id: String(r.id),
              reference: r.reference_number,
              category: (r.category?.toLowerCase() || 'other') as ComplaintCategory,
              categoryLabel: r.category || 'Grievance',
              description: r.description || '',
              busNumber: r.bus_number || '',
              routeFrom: r.route_from || '',
              routeTo: r.route_to || '',
              incidentTime: r.reported_time || '',
              status: (r.status?.toLowerCase() || 'submitted') as ComplaintStatus,
              priority: (r.priority?.toLowerCase() || 'normal') as Complaint['priority'],
              createdAt: r.created_at || new Date().toISOString(),
              updatedAt: r.updated_at || new Date().toISOString(),
              timeline: [],
            });
          }
        }
      }
    } catch (_) {}
  }

  if (filters?.status && filters.status !== 'all') {
    list = list.filter((c) => c.status === filters.status);
  }
  if (filters?.category && filters.category !== 'all') {
    list = list.filter((c) => c.category === filters.category);
  }
  if (filters?.priority && filters.priority !== 'all') {
    list = list.filter((c) => c.priority === filters.priority);
  }
  if (filters?.depotId && filters.depotId !== 'all') {
    list = list.filter((c) => c.depotId === filters.depotId);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(
      (c) =>
        c.reference.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        (c.busNumber && c.busNumber.toLowerCase().includes(q)) ||
        (c.categoryLabel && c.categoryLabel.toLowerCase().includes(q))
    );
  }

  // Sort newest first
  return [...list].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function fetchComplaintById(idOrRef: string): Promise<Complaint | null> {
  const list = await fetchComplaints();
  const found = list.find(
    (c) =>
      c.id === idOrRef ||
      c.reference.toUpperCase() === idOrRef.trim().toUpperCase()
  );
  return found || null;
}

export interface CreateComplaintDTO {
  category: ComplaintCategory;
  categoryLabel: string;
  description: string;
  busNumber?: string;
  routeFrom?: string;
  routeTo?: string;
  incidentTime?: string;
  evidenceFiles?: string[];
}

export async function createComplaint(dto: CreateComplaintDTO): Promise<Complaint> {
  const complaints = getStoredComplaints();
  const ref = generateReferenceNumber();
  const now = new Date().toISOString();

  // Attempt sync to Backend API
  try {
    await apiRequest('/complaints', {
      method: 'POST',
      body: JSON.stringify({
        category: dto.category.toUpperCase(),
        description: dto.description,
        bus_number: dto.busNumber,
        route_from: dto.routeFrom,
        route_to: dto.routeTo,
        incident_time: dto.incidentTime,
        client_request_id: crypto.randomUUID(),
      }),
    });
  } catch (err) {
    console.warn('Backend complaint sync notice:', err);
  }

  const newComplaint: Complaint = {
    id: `cmp-${Date.now()}`,
    reference: ref,
    category: dto.category,
    categoryLabel: dto.categoryLabel,
    description: dto.description,
    busNumber: dto.busNumber || '',
    routeFrom: dto.routeFrom || '',
    routeTo: dto.routeTo || '',
    incidentTime: dto.incidentTime || new Date().toLocaleTimeString(),
    depotId: 'DEP-TVM',
    depotName: 'Thiruvananthapuram Central Depot',
    status: 'submitted',
    priority: dto.category === 'safety' || dto.category === 'driver' ? 'high' : 'normal',
    createdAt: now,
    updatedAt: now,
    assignedOwner: 'Depot Accountability Desk',
    evidenceFiles: dto.evidenceFiles || [],
    timeline: [
      {
        id: `t-${Date.now()}`,
        timestamp: now,
        status: 'submitted',
        actorRole: 'passenger',
        actorName: 'Passenger',
        notes: 'Complaint registered via public portal.',
        isPublic: true,
      },
    ],
  };

  const updated = [newComplaint, ...complaints];
  saveStoredComplaints(updated);

  addNotification(
    'DEP-TVM',
    `New Complaint Filed: ${ref}`,
    `${dto.categoryLabel} issue reported on bus ${newComplaint.busNumber || 'Route Service'}.`,
    'complaint',
    ref
  ).catch(console.error);

  return newComplaint;
}

export async function updateComplaintStatus(
  id: string,
  newStatus: ComplaintStatus,
  notes?: string,
  actorRole: 'depot_manager' | 'depot_staff' | 'system_admin' = 'depot_manager',
  actorName = 'Depot Manager'
): Promise<Complaint> {
  const complaints = getStoredComplaints();
  const index = complaints.findIndex((c) => c.id === id);
  if (index === -1) throw new Error('Complaint not found');

  const target = { ...complaints[index] };
  target.status = newStatus;
  target.updatedAt = new Date().toISOString();

  if (newStatus === 'resolved') {
    target.resolvedAt = target.updatedAt;
  }

  const newTimelineEvent = {
    id: `t-${Date.now()}`,
    timestamp: target.updatedAt,
    status: newStatus,
    actorRole,
    actorName,
    notes: notes || `Status changed to ${newStatus}`,
    isPublic: true,
  };

  target.timeline = [...(target.timeline || []), newTimelineEvent];
  complaints[index] = target;
  saveStoredComplaints(complaints);

  return target;
}
