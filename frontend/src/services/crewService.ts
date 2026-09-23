import type { CrewMember, DutyRoster } from '../types/crew';
import { apiRequest } from './api';

function mapCrew(raw: any): CrewMember { return { pen: raw.pen, name: raw.name, role: 'conductor', depotId: String(raw.depot_id), depotName: raw.depot?.name || '', phone: raw.phone || '', rating: 0, totalTripsCompleted: 0, joinedDate: raw.created_at || '' }; }
export async function fetchCrewMembers(depotId?: string): Promise<CrewMember[]> {
  try {
    const rows = await apiRequest<any[]>('/depot/conductors');
    return rows.map(mapCrew).filter((crew) => !depotId || depotId === 'all' || crew.depotId === depotId);
  } catch {
    return [];
  }
}

export async function fetchCrewByPEN(pen: string): Promise<CrewMember | null> {
  return (await fetchCrewMembers()).find((crew) => crew.pen.toUpperCase() === pen.toUpperCase()) || null;
}

export async function getDutyRosterForBus(busNumber: string, _timestamp?: string): Promise<DutyRoster | null> {
  try {
    const assignments = await apiRequest<any[]>('/depot/duty-assignments');
    const matched = assignments.find((a) => a.bus_number?.toUpperCase() === busNumber?.toUpperCase());
    if (!matched) return null;
    return {
      id: String(matched.id),
      busNumber: matched.bus_number,
      routeId: String(matched.route_id),
      routeCode: matched.route_code || '',
      conductorPen: matched.conductor_pen || '',
      conductorName: matched.conductor_name || '',
      conductorPhone: matched.conductor_phone || '',
      dutyDate: matched.duty_date,
      startTime: matched.shift_start || '',
      endTime: matched.shift_end || '',
      shiftSchedule: `${matched.shift_start || ''} - ${matched.shift_end || ''}`,
      status: matched.status || 'SCHEDULED',
    };
  } catch {
    return null;
  }
}
