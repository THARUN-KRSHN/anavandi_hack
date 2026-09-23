import type { Bus, Route } from '../types/bus';
import { apiRequest } from './api';

export async function fetchBuses(): Promise<Bus[]> {
  const rows = await apiRequest<any[]>('/buses');
  return rows.map((bus) => ({ busNumber: bus.bus_number, registrationNumber: bus.registration_number || '', depotId: String(bus.depot_id), depotName: '', routeId: '', routeName: '', type: bus.bus_type, status: bus.status.toLowerCase(), capacity: 0, activeComplaintsCount: 0, qrCode: bus.bus_number }));
}

export async function fetchRoutes(): Promise<Route[]> {
  const rows = await apiRequest<any[]>('/routes');
  return rows.map((route) => ({ id: String(route.id), code: route.route_code, name: `${route.source} - ${route.destination}`, origin: route.source, destination: route.destination, depotId: String(route.depot_id), totalStops: 0, activeBusesCount: 0, distanceKm: 0 }));
}

export async function resolveBusByQR(qrCode: string): Promise<Bus | null> {
  const code = qrCode.trim().toUpperCase();
  const found = (await fetchBuses()).find((b) => b.qrCode.toUpperCase() === code || b.busNumber.toUpperCase() === code);
  return found || null;
}
