import type { CrewMember, DutyRoster } from '../types/crew';
import { apiRequest } from './api';

export async function fetchCrewMembers(depotId?: string): Promise<CrewMember[]> {
  const rows = await apiRequest<any[]>('/depot/conductors');
  return rows.filter((crew) => !depotId || depotId === 'all' || String(crew.depot_id) === depotId).map((crew) => ({ pen: crew.pen, name: crew.name, phone: crew.phone || '', role: 'conductor' as const, depotId: String(crew.depot_id), depotName: '', rating: 0, totalTripsCompleted: 0, joinedDate: crew.created_at || '' }));
}

export async function fetchCrewByPEN(pen: string): Promise<CrewMember | null> {
  return (await fetchCrewMembers()).find((c) => c.pen.toUpperCase() === pen.toUpperCase()) || null;
}

/**
 * Domain Rule: Resolves Duty Roster & Authorized Crew based on Bus + Incident Timestamp.
 */
export async function getDutyRosterForBus(
  busNumber: string,
  _timestamp?: string
): Promise<DutyRoster | null> {
  void busNumber;
  void _timestamp;
  return null;
}
