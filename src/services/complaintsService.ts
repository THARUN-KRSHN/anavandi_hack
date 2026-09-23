import type { Complaint, ComplaintStatus, ComplaintCategory } from '../types/complaint';
import { initialComplaints } from '../data/mock/complaintsData';
import { generateReferenceNumber } from '../utils/dateUtils';
import { getDutyRosterForBus } from './crewService';
import { mockBuses } from '../data/mock/busesData';

const STORAGE_KEY = 'anavandi_complaints_v1';

function getStoredComplaints(): Complaint[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialComplaints));
      return initialComplaints;
    }
    return JSON.parse(data);
  } catch {
    return initialComplaints;
  }
}

function saveStoredComplaints(complaints: Complaint[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints));
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
  const list = getStoredComplaints();
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

  // Operational chain lookup based on busNumber + incidentTime
  let assignedDepotId = 'DEP-TVM';
  let assignedDepotName = 'Trivandrum Central Depot';
  let dutyId = 'D-104';
  let conductorPen = 'PEN-88421';
  let driverPen = 'PEN-77290';

  if (dto.busNumber) {
    const matchedBus = mockBuses.find(
      (b) => b.busNumber.toLowerCase() === dto.busNumber?.toLowerCase()
    );
    if (matchedBus) {
      assignedDepotId = matchedBus.depotId;
      assignedDepotName = matchedBus.depotName;
    }
    const roster = await getDutyRosterForBus(dto.busNumber, dto.incidentTime);
    if (roster) {
      dutyId = roster.id;
      conductorPen = roster.conductorPen;
      driverPen = roster.driverPen;
      assignedDepotId = roster.depotId;
    }
  }

  const newComplaint: Complaint = {
    id: `cmp-${Date.now()}`,
    reference: ref,
    category: dto.category,
    categoryLabel: dto.categoryLabel,
    description: dto.description,
    busNumber: dto.busNumber || 'KL-15-A-4021',
    routeFrom: dto.routeFrom || 'Trivandrum Central',
    routeTo: dto.routeTo || 'Kollam Junction',
    incidentTime: dto.incidentTime || 'Just now',
    depotId: assignedDepotId,
    depotName: assignedDepotName,
    dutyId,
    conductorPen,
    driverPen,
    status: 'submitted',
    priority: dto.category === 'safety' || dto.category === 'driver' ? 'high' : 'normal',
    createdAt: now,
    updatedAt: now,
    assignedOwner: `Depot Manager - ${assignedDepotName}`,
    evidenceFiles: dto.evidenceFiles || [],
    timeline: [
      {
        id: `t-${Date.now()}`,
        timestamp: now,
        status: 'submitted',
        actorRole: 'passenger',
        actorName: 'Passenger',
        notes: 'Complaint registered via public kiosk/mobile wizard.',
        isPublic: true,
      },
    ],
  };

  const updated = [newComplaint, ...complaints];
  saveStoredComplaints(updated);
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
  const now = new Date().toISOString();

  target.status = newStatus;
  target.updatedAt = now;
  if (newStatus === 'resolved' && notes) {
    target.resolutionNote = notes;
  }

  const newTimelineEvent = {
    id: `t-${Date.now()}`,
    timestamp: now,
    status: newStatus,
    actorRole,
    actorName,
    notes: notes || `Case status transitioned to ${newStatus.toUpperCase()}`,
    isPublic: newStatus !== 'investigating', // Internal investigation notes hidden from public tracking
  };

  target.timeline = [...target.timeline, newTimelineEvent];
  complaints[index] = target;
  saveStoredComplaints(complaints);
  return target;
}

export async function assignComplaint(
  id: string,
  assignedOwner: string
): Promise<Complaint> {
  const complaints = getStoredComplaints();
  const index = complaints.findIndex((c) => c.id === id);
  if (index === -1) throw new Error('Complaint not found');

  const target = { ...complaints[index] };
  const now = new Date().toISOString();

  target.assignedOwner = assignedOwner;
  if (target.status === 'submitted') {
    target.status = 'assigned';
  }
  target.updatedAt = now;

  target.timeline.push({
    id: `t-${Date.now()}`,
    timestamp: now,
    status: target.status,
    actorRole: 'depot_manager',
    actorName: 'Depot Manager',
    notes: `Assigned case owner to ${assignedOwner}`,
    isPublic: false,
  });

  complaints[index] = target;
  saveStoredComplaints(complaints);
  return target;
}
