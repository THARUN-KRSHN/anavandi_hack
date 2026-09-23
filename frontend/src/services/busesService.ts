import type { Bus, BusMaster, Route } from '../types/bus';
import { apiRequest } from './api';

function mapBus(raw: any): Bus { return { id: raw.id, busNumber: raw.bus_number, registrationNumber: raw.registration_number || '', depotId: String(raw.depot_id), depotName: raw.depot?.name || '', routeId: '', routeName: '', type: raw.bus_type, status: String(raw.status || 'ACTIVE').toLowerCase() as Bus['status'], capacity: 0, activeComplaintsCount: 0, qrCode: raw.bus_number }; }
function mapRoute(raw: any): Route { return { id: String(raw.id), code: raw.route_code, name: `${raw.source} - ${raw.destination}`, origin: raw.source, destination: raw.destination, depotId: String(raw.depot_id), totalStops: raw.stops?.length || 0, activeBusesCount: 0, distanceKm: 0 }; }

export async function fetchBuses(): Promise<Bus[]> { return (await apiRequest<any[]>('/buses')).map(mapBus); }
export async function fetchBusesForDepot(depotId?: string): Promise<BusMaster[]> {
  const user = JSON.parse(localStorage.getItem('anavandi_user') || 'null');
  const rows = user?.role === 'depot_head' ? await apiRequest<any[]>('/depot/buses') : await apiRequest<any[]>(`/buses${depotId && depotId !== 'all' ? `?depot_id=${depotId}` : ''}`);
  return rows.map((bus) => ({
    id: String(bus.id),
    busNumber: bus.bus_number,
    busType: bus.bus_type,
    depotId: String(bus.depot_id),
    depotName: bus.depot_name || bus.depot?.name || '',
    routeId: bus.route_id ? String(bus.route_id) : '',
    routeName: bus.route_name || '',
    conductorName: bus.conductor_name || '',
    conductorPhone: bus.conductor_phone || '',
    shiftSchedule: bus.shift_schedule || '',
    status: bus.status,
  }));
}
export async function fetchRoutes(depotId?: string): Promise<Route[]> {
  const user = JSON.parse(localStorage.getItem('anavandi_user') || 'null');
  const path = user?.role === 'depot_head' ? '/depot/routes' : `/routes${depotId && depotId !== 'all' ? `?depot_id=${depotId}` : ''}`;
  return (await apiRequest<any[]>(path)).map(mapRoute);
}
export async function resolveBusByQR(qrCode: string): Promise<Bus | null> { return (await fetchBuses()).find((bus) => bus.qrCode.toUpperCase() === qrCode.trim().toUpperCase() || bus.busNumber.toUpperCase() === qrCode.trim().toUpperCase()) || null; }
