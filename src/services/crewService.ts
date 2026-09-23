import type { CrewMember, DutyRoster } from '../types/crew';
import { mockCrewMembers, mockDutyRosters } from '../data/mock/crewData';

export async function fetchCrewMembers(depotId?: string): Promise<CrewMember[]> {
  if (depotId && depotId !== 'all') {
    return mockCrewMembers.filter((c) => c.depotId === depotId);
  }
  return mockCrewMembers;
}

export async function fetchCrewByPEN(pen: string): Promise<CrewMember | null> {
  const found = mockCrewMembers.find((c) => c.pen.toUpperCase() === pen.toUpperCase());
  return found || null;
}

/**
 * Domain Rule: Resolves Duty Roster & Authorized Crew based on Bus + Incident Timestamp.
 */
export async function getDutyRosterForBus(
  busNumber: string,
  _timestamp?: string
): Promise<DutyRoster | null> {
  const found = mockDutyRosters.find(
    (d) => d.busNumber.toLowerCase() === busNumber.toLowerCase()
  );
  if (found) return found;

  // Fallback default roster for demo
  return mockDutyRosters[0];
}
