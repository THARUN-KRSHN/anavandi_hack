import type { Bus, Route } from '../types/bus';
import { mockBuses, mockRoutes } from '../data/mock/busesData';

export async function fetchBuses(): Promise<Bus[]> {
  return mockBuses;
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
