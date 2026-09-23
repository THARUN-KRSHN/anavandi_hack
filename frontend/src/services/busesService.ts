import type { Bus, BusMaster, Route } from '../types/bus';
import { mockBuses, mockRoutes } from '../data/mock/busesData';

export async function fetchBuses(): Promise<Bus[]> {
  return mockBuses;
}

export async function fetchBusesForDepot(depotId?: string): Promise<BusMaster[]> {
  const masterList: BusMaster[] = mockBuses.map((b, idx) => ({
    id: `bmaster-${idx}`,
    busNumber: b.busNumber,
    busType: b.type,
    depotId: b.depotId,
    depotName: b.depotName,
    routeId: b.routeId,
    routeName: b.routeName,
    conductorName: idx % 2 === 0 ? 'V. K. Shaji' : 'M. R. Ananthakrishnan',
    conductorPhone: idx % 2 === 0 ? '+91 98471 22390' : '+91 94472 88102',
    shiftSchedule: idx % 2 === 0 ? '06:00 AM - 02:00 PM (Morning)' : '02:00 PM - 10:00 PM (Evening)',
    status: b.status,
  }));

  if (!depotId || depotId === 'all') return masterList;
  return masterList.filter((b) => b.depotId === depotId);
}

export async function fetchRoutes(): Promise<Route[]> {
  return mockRoutes;
}

export async function resolveBusByQR(qrCode: string): Promise<Bus | null> {
  const code = qrCode.trim().toUpperCase();
  const found = mockBuses.find(
    (b) => b.qrCode.toUpperCase() === code || b.busNumber.toUpperCase() === code
  );
  return found || null;
}
