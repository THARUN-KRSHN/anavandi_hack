import type { Complaint, ComplaintStatus, ComplaintCategory } from '../types/complaint';
import type { DepotMaster } from '../types/depot';
import { generateReferenceNumber } from '../utils/dateUtils';
import { syncEngine } from './syncEngine';
import { addNotification } from './notificationService';
import { apiRequest } from './api';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getCurrentUser } from './authService';
import { uploadAllComplaintImages } from './storageService';
import { fetchDepots } from './depotService';

const STORAGE_KEY = 'anavandi_complaints_v2';

function getStoredComplaints(): Complaint[] {
  try {
    const currentUser = getCurrentUser();
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    
    // Filter out residual mock complaints & filter by logged in user phone/email
    return parsed.filter((c: Complaint & { userPhone?: string }) => {
      const isMock =
        c.reference?.startsWith('GRV-2026-104') ||
        c.reference?.startsWith('GRV-61776') ||
        c.reference?.startsWith('GRV-52277') ||
        c.reference?.startsWith('GRV-79134') ||
        c.description?.includes('Air conditioning broken') ||
        c.description?.includes('Reckless overtaking near Aluva');
      
      if (isMock) return false;
      if (currentUser && currentUser.role === 'user') {
        return c.userPhone ? c.userPhone === currentUser.phone : true;
      }
      return true;
    });
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

const DEPOT_ALIASES: Record<string, string[]> = {
  ekm: ['ekm', 'ernakulam', 'ernakulam central', 'd020', '20'],
  ernakulam: ['ekm', 'ernakulam', 'ernakulam central', 'd020', '20'],
  tvm: ['tvm', 'trivandrum', 'thiruvananthapuram', 'tvm central', 'd087', '87'],
  trivandrum: ['tvm', 'trivandrum', 'thiruvananthapuram', 'tvm central', 'd087', '87'],
  thiruvananthapuram: ['tvm', 'trivandrum', 'thiruvananthapuram', 'tvm central', 'd087', '87'],
  tsr: ['tsr', 'thrissur', 'trichur', 'd086', '86'],
  thrissur: ['tsr', 'thrissur', 'trichur', 'd086', '86'],
  clt: ['clt', 'kozhikode', 'calicut', 'd044', '44'],
  kozhikode: ['clt', 'kozhikode', 'calicut', 'd044', '44'],
  alp: ['alp', 'alappuzha', 'alleppey', 'd002', '2'],
  alappuzha: ['alp', 'alappuzha', 'alleppey', 'd002', '2'],
  ktm: ['ktm', 'kottayam', 'd042', '42'],
  kottayam: ['ktm', 'kottayam', 'd042', '42'],
  pkd: ['pkd', 'palakkad', 'palghat', 'd068', '68'],
  palakkad: ['pkd', 'palakkad', 'palghat', 'd068', '68'],
  klm: ['klm', 'kollam', 'quilon', 'd040', '40'],
  kollam: ['klm', 'kollam', 'quilon', 'd040', '40'],
  knr: ['knr', 'kannur', 'cannanore', 'd032', '32'],
  kannur: ['knr', 'kannur', 'cannanore', 'd032', '32'],
  ksr: ['ksr', 'kasaragod', 'kasargod', 'd035', '35'],
  kasaragod: ['ksr', 'kasaragod', 'kasargod', 'd035', '35'],
  idk: ['idk', 'idukki', 'thodupuzha', 'd084', '84'],
  idukki: ['idk', 'idukki', 'thodupuzha', 'd084', '84'],
  pta: ['pta', 'pathanamthitta', 'd072', '72'],
  pathanamthitta: ['pta', 'pathanamthitta', 'd072', '72'],
  mlpm: ['mlpm', 'malappuram', 'perinthalmanna', 'd069', '69'],
  malappuram: ['mlpm', 'malappuram', 'perinthalmanna', 'd069', '69'],
  wyd: ['wyd', 'wayanad', 'sulthanbathery', 'd079', '79'],
  wayanad: ['wyd', 'wayanad', 'sulthanbathery', 'd079', '79'],
  aluva: ['aluva', 'alwaye', 'd003', '3'],
};

export function extractTokensWithAliases(str: string): string[] {
  const stopWords = new Set([
    'depot',
    'depots',
    'dep',
    'd',
    'head',
    'officer',
    'station',
    'central',
    'to',
    'from',
    'the',
    'hq',
    'desk',
    'accountability',
  ]);

  const rawWords = str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((w) => w.length > 0 && !stopWords.has(w));

  const resultSet = new Set<string>();

  for (const word of rawWords) {
    resultSet.add(word);
    if (DEPOT_ALIASES[word]) {
      DEPOT_ALIASES[word].forEach((a) => resultSet.add(a));
    }
  }

  return Array.from(resultSet);
}

export function isDepotMatch(
  filterDepotId: string,
  complaint: {
    depotId?: string;
    depotName?: string;
    routeFrom?: string;
    routeTo?: string;
  }
): boolean {
  if (!filterDepotId || filterDepotId === 'all') return true;

  const targetRaw = filterDepotId.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cDepotIdRaw = (complaint.depotId || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const cDepotNameRaw = (complaint.depotName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const cRouteFromRaw = (complaint.routeFrom || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const cRouteToRaw = (complaint.routeTo || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  if (
    cDepotIdRaw === targetRaw ||
    (cDepotIdRaw && targetRaw && (cDepotIdRaw.includes(targetRaw) || targetRaw.includes(cDepotIdRaw))) ||
    (cDepotNameRaw && targetRaw && (cDepotNameRaw.includes(targetRaw) || targetRaw.includes(cDepotNameRaw))) ||
    (cRouteFromRaw && targetRaw && cRouteFromRaw.includes(targetRaw)) ||
    (cRouteToRaw && targetRaw && cRouteToRaw.includes(targetRaw))
  ) {
    return true;
  }

  const targetTokens = extractTokensWithAliases(filterDepotId);
  if (targetTokens.length === 0) return true;

  const complaintStr = `${complaint.depotId || ''} ${complaint.depotName || ''} ${complaint.routeFrom || ''} ${complaint.routeTo || ''}`;
  const complaintTokens = extractTokensWithAliases(complaintStr);

  return targetTokens.some((t) => complaintTokens.some((ct) => ct.includes(t) || t.includes(ct)));
}

export async function fetchComplaints(filters?: {
  status?: string;
  category?: string;
  priority?: string;
  depotId?: string;
  search?: string;
}): Promise<Complaint[]> {
  const currentUser = getCurrentUser();
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
      const depotsList = await fetchDepots();
      let query = supabase.from('complaints').select('*').order('created_at', { ascending: false });
      
      if (currentUser && currentUser.role === 'user' && currentUser.email) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', currentUser.email)
          .maybeSingle();
        if (prof?.id) {
          query = query.eq('user_id', prof.id);
        }
      }

      const { data: sbRows } = await query;

      if (Array.isArray(sbRows) && sbRows.length > 0) {
        const existingRefs = new Set(list.map((c) => c.reference));
        for (const r of sbRows) {
          if (r.reference_number && !existingRefs.has(r.reference_number)) {
            let matchedDepot = depotsList.find((d: DepotMaster) => String(d.id) === String(r.depot_id));
            
            // Extract routeFrom and routeTo from location_name if available (e.g. "Aluva Depot to Thrissur Depot")
            let rFrom = r.route_from || '';
            let rTo = r.route_to || '';
            if (r.location_name && r.location_name.includes(' to ')) {
              const parts = r.location_name.split(' to ');
              rFrom = rFrom || parts[0];
              rTo = rTo || parts[1];
            }

            if (!matchedDepot && (rFrom || rTo)) {
              const targetStr = (rFrom || rTo).toLowerCase().replace(/[^a-z0-9]/g, '');
              matchedDepot = depotsList.find((d: DepotMaster) => {
                const dNameClean = d.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                const dCodeClean = d.code.toLowerCase().replace(/[^a-z0-9]/g, '');
                return targetStr.includes(dNameClean) || dNameClean.includes(targetStr) || targetStr.includes(dCodeClean);
              });
            }

            list.push({
              id: String(r.id),
              reference: r.reference_number,
              category: (r.category?.toLowerCase() || 'other') as ComplaintCategory,
              categoryLabel: r.category || 'Grievance',
              description: r.description || '',
              busNumber: r.bus_number || 'KL-07-AB-1234',
              routeFrom: rFrom || 'Origin Depot',
              routeTo: rTo || 'Destination Depot',
              incidentTime: r.reported_time || 'Recent',
              depotId: matchedDepot ? (matchedDepot.code || matchedDepot.id) : 'DEP-EKM',
              depotName: matchedDepot ? matchedDepot.name : 'Ernakulam Central Depot',
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
    list = list.filter((c) => isDepotMatch(filters.depotId!, c));
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
  const currentUser = getCurrentUser();

  // Resolve assigned depot dynamically from route selection
  let assignedDepotId = 'DEP-EKM';
  let assignedDepotName = 'Ernakulam Central Depot';
  let numericDepotId: number | null = null;

  try {
    const allDepots = await fetchDepots();
    const routeTargetStr = `${dto.routeFrom || ''} ${dto.routeTo || ''}`;
    const targetTokens = extractTokensWithAliases(routeTargetStr);

    const matched = allDepots.find((d: DepotMaster) => {
      const dTokens = extractTokensWithAliases(`${d.name} ${d.code} ${d.id} ${d.district || ''}`);
      return targetTokens.some((t) => dTokens.some((dt) => dt.includes(t) || t.includes(dt)));
    });

    if (matched) {
      assignedDepotId = matched.code || matched.id;
      assignedDepotName = matched.name.toLowerCase().includes('depot') ? matched.name : `${matched.name} Depot`;
      numericDepotId = parseInt(matched.id, 10) || null;
    }
  } catch (err) {
    console.warn('Depot resolution notice:', err);
  }

  // 0. Upload attached photo evidence to Supabase Storage bucket `complaint-images`
  let uploadedFiles: string[] = dto.evidenceFiles || [];
  if (dto.evidenceFiles && dto.evidenceFiles.length > 0) {
    try {
      uploadedFiles = await uploadAllComplaintImages(dto.evidenceFiles, ref);
    } catch (storageErr) {
      console.warn('Storage upload error fallback:', storageErr);
    }
  }

  // 1. Direct insert to Supabase complaints table
  if (isSupabaseConfigured()) {
    try {
      let profileUuid: string | null = null;
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('id')
          .eq('auth_user_id', session.user.id)
          .maybeSingle();
        if (prof) profileUuid = prof.id;
      }

      if (!profileUuid && currentUser?.email) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', currentUser.email)
          .maybeSingle();
        if (prof) profileUuid = prof.id;
      }

      const { data: insertedData, error: sbInsertErr } = await supabase.from('complaints').insert({
        reference_number: ref,
        user_id: profileUuid,
        depot_id: numericDepotId,
        category: String(dto.categoryLabel || dto.category).toUpperCase(),
        description: dto.description,
        location_name: `${dto.routeFrom || ''} to ${dto.routeTo || ''}`.trim() || 'Onboard Bus',
        status: 'SUBMITTED',
        priority: dto.category === 'safety' || dto.category === 'driver' ? 'HIGH' : 'NORMAL',
      }).select();

      if (sbInsertErr) {
        console.warn('Supabase complaint insert error notice:', sbInsertErr);
      } else if (insertedData) {
        console.log('Successfully inserted complaint into Supabase table:', insertedData);
      }
    } catch (sbErr) {
      console.warn('Supabase complaint direct insert notice:', sbErr);
    }
  }

  // 2. Attempt sync to Backend API
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

  const newComplaint: Complaint & { userPhone?: string } = {
    id: `cmp-${Date.now()}`,
    reference: ref,
    category: dto.category,
    categoryLabel: dto.categoryLabel,
    description: dto.description,
    busNumber: dto.busNumber || '',
    routeFrom: dto.routeFrom || '',
    routeTo: dto.routeTo || '',
    incidentTime: dto.incidentTime || new Date().toLocaleTimeString(),
    depotId: assignedDepotId,
    depotName: assignedDepotName,
    status: 'submitted',
    priority: dto.category === 'safety' || dto.category === 'driver' ? 'high' : 'normal',
    createdAt: now,
    updatedAt: now,
    assignedOwner: assignedDepotName,
    evidenceFiles: uploadedFiles,
    userPhone: currentUser?.phone || '',
    timeline: [
      {
        id: `t-${Date.now()}`,
        timestamp: now,
        status: 'submitted',
        actorRole: 'passenger',
        actorName: currentUser?.name || 'Passenger',
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
