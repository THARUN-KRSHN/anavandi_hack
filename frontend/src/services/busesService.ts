import type { Bus, BusMaster, Route } from '../types/bus';
import { apiRequest } from './api';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

let cachedBuses: Bus[] | null = null;
let cachedRoutes: Route[] | null = null;

function normalizeBusType(type?: string): Bus['type'] {
  const upper = (type || '').toUpperCase();
  if (upper.includes('FAST') && upper.includes('SUPER')) return 'Super Fast';
  if (upper.includes('FAST')) return 'Fast Passenger';
  if (upper.includes('AC') || upper.includes('LOW')) return 'Low Floor AC';
  return 'Ordinary Express';
}

function normalizeBusStatus(status?: string): Bus['status'] {
  const lower = (status || '').toLowerCase();
  if (lower === 'maintenance') return 'maintenance';
  if (lower === 'depot_bound') return 'depot_bound';
  return 'active';
}

export async function fetchBuses(): Promise<Bus[]> {
  if (cachedBuses && cachedBuses.length > 0) return cachedBuses;

  // 1. Fetch from Backend REST API
  try {
    const data = await apiRequest<any[]>('/buses').catch(() => null);
    if (Array.isArray(data) && data.length > 0) {
      cachedBuses = data.map((b) => ({
        busNumber: b.bus_number || b.registration_number || `KL-BUS-${b.id}`,
        registrationNumber: b.registration_number || b.bus_number || `KL-${b.id}`,
        depotId: String(b.depot_id || '1'),
        depotName: b.depot_name || (b.depot ? b.depot.name : 'Depot Desk'),
        routeId: String(b.route_id || '1'),
        routeName: b.route_name || (b.route ? `${b.route.source} - ${b.route.destination}` : 'KSRTC Link'),
        type: normalizeBusType(b.bus_type),
        status: normalizeBusStatus(b.status),
        capacity: b.capacity || 48,
        activeComplaintsCount: b.active_complaints_count || 0,
        qrCode: `KSRTC:${b.bus_number || b.registration_number}`,
      }));
      return cachedBuses;
    }
  } catch (err) {
    console.warn('Backend buses fetch fallback notice:', err);
  }

  // 2. Fallback to Supabase PostgREST
  if (isSupabaseConfigured()) {
    try {
      const { data } = await supabase.from('buses').select('*');
      if (Array.isArray(data) && data.length > 0) {
        cachedBuses = data.map((b) => ({
          busNumber: b.bus_number || b.registration_number || `KL-BUS-${b.id}`,
          registrationNumber: b.registration_number || b.bus_number || `KL-${b.id}`,
          depotId: String(b.depot_id || '1'),
          depotName: b.depot_name || 'KSRTC Depot',
          routeId: String(b.route_id || '1'),
          routeName: b.route_name || 'Express Line',
          type: normalizeBusType(b.bus_type),
          status: normalizeBusStatus(b.status),
          capacity: b.capacity || 48,
          activeComplaintsCount: 0,
          qrCode: `KSRTC:${b.bus_number || b.registration_number}`,
        }));
        return cachedBuses;
      }
    } catch (err) {
      console.warn('Supabase buses fetch fallback notice:', err);
    }
  }

  return [];
}

export async function fetchBusesForDepot(depotId?: string): Promise<BusMaster[]> {
  const buses = await fetchBuses();
  const masterList: BusMaster[] = buses.map((b, idx) => ({
    id: `bmaster-${idx + 1}`,
    busNumber: b.busNumber,
    busType: b.type,
    depotId: b.depotId,
    depotName: b.depotName,
    routeId: b.routeId,
    routeName: b.routeName,
    conductorName: `KSRTC Conductor ${String(idx + 1).padStart(3, '0')}`,
    conductorPhone: '+91 94470 00000',
    shiftSchedule: idx % 2 === 0 ? '06:00 AM - 02:00 PM (Morning)' : '02:00 PM - 10:00 PM (Evening)',
    status: b.status,
  }));

  if (!depotId || depotId === 'all') return masterList;
  return masterList.filter((b) => b.depotId === String(depotId));
}

export async function fetchRoutes(): Promise<Route[]> {
  if (cachedRoutes && cachedRoutes.length > 0) return cachedRoutes;

  // 1. Fetch from Backend REST API
  try {
    const data = await apiRequest<any[]>('/routes').catch(() => null);
    if (Array.isArray(data) && data.length > 0) {
      cachedRoutes = data.map((r) => ({
        id: String(r.id),
        code: r.route_code || `RT-${r.id}`,
        name: `${r.source || 'Depot'} - ${r.destination || 'Terminal'}`,
        origin: r.source || 'Origin',
        destination: r.destination || 'Destination',
        depotId: String(r.depot_id || '1'),
        totalStops: r.total_stops || 12,
        activeBusesCount: r.active_buses_count || 1,
        distanceKm: r.distance_km || 45,
      }));
      return cachedRoutes;
    }
  } catch (err) {
    console.warn('Backend routes fetch fallback notice:', err);
  }

  // 2. Fallback to Supabase PostgREST
  if (isSupabaseConfigured()) {
    try {
      const { data } = await supabase.from('routes').select('*');
      if (Array.isArray(data) && data.length > 0) {
        cachedRoutes = data.map((r) => ({
          id: String(r.id),
          code: r.route_code || `RT-${r.id}`,
          name: `${r.source || 'Depot'} - ${r.destination || 'Terminal'}`,
          origin: r.source || 'Origin',
          destination: r.destination || 'Destination',
          depotId: String(r.depot_id || '1'),
          totalStops: 10,
          activeBusesCount: 1,
          distanceKm: 40,
        }));
        return cachedRoutes;
      }
    } catch (err) {
      console.warn('Supabase routes fetch fallback notice:', err);
    }
  }

  return [];
}

export async function resolveBusByQR(qrCode: string): Promise<Bus | null> {
  const code = qrCode.trim().toUpperCase();
  const buses = await fetchBuses();
  const found = buses.find(
    (b) => b.qrCode.toUpperCase() === code || b.busNumber.toUpperCase() === code
  );
  return found || null;
}
