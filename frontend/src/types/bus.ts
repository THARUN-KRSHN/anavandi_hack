export interface Bus {
  id?: number;
  busNumber: string; // e.g. KL-15-A-4021
  registrationNumber: string;
  depotId: string;
  depotName: string;
  routeId: string;
  routeName: string;
  type: 'Fast Passenger' | 'Super Fast' | 'Low Floor AC' | 'Ordinary Express';
  status: 'active' | 'maintenance' | 'depot_bound';
  capacity: number;
  activeComplaintsCount: number;
  qrCode: string;
}

export interface BusMaster {
  id: string;
  busNumber: string;
  busType: string;
  depotId: string;
  depotName: string;
  routeId: string;
  routeName: string;
  conductorName: string;
  conductorPhone: string;
  shiftSchedule: string;
  status: string;
}

export type BusMasterType = BusMaster;

export interface Route {
  id: string; // e.g. RT-102
  code: string;
  name: string; // e.g. Trivandrum Central - Kollam Junction
  origin: string;
  destination: string;
  depotId: string;
  totalStops: number;
  activeBusesCount: number;
  distanceKm: number;
}

export interface Depot {
  id: string; // e.g. DEP-TVM
  name: string; // e.g. Trivandrum Central Depot
  code: string;
  district: string;
  location: string;
  totalBuses: number;
  totalCrew: number;
  openComplaints: number;
  overdueComplaints: number;
  resolvedToday: number;
  avgResolutionHours: number;
  phone: string;
  email: string;
}
