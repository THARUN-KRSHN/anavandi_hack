export type ComplaintStatus =
  | 'submitted'
  | 'assigned'
  | 'acknowledged'
  | 'investigating'
  | 'resolved'
  | 'reopened'
  | 'escalated';

export type ComplaintPriority = 'normal' | 'high' | 'critical';

export type ComplaintCategory =
  | 'cleanliness'
  | 'conductor_staff'
  | 'driver'
  | 'ticketing'
  | 'overcrowding'
  | 'bus_condition'
  | 'safety'
  | 'route_timing'
  | 'other';

export interface TimelineEvent {
  id: string;
  timestamp: string;
  status: ComplaintStatus;
  actorRole: 'passenger' | 'depot_manager' | 'depot_staff' | 'system_admin';
  actorName: string;
  notes?: string;
  isPublic: boolean;
}

export interface Complaint {
  id: string;
  reference: string; // e.g. GRV-10482
  category: ComplaintCategory;
  categoryLabel: string;
  description: string;
  busNumber?: string;
  routeFrom?: string;
  routeTo?: string;
  routeCode?: string;
  incidentTime?: string;
  depotId?: string;
  depotName?: string;
  dutyId?: string;
  conductorPen?: string;
  driverPen?: string;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  createdAt: string;
  updatedAt: string;
  timeline: TimelineEvent[];
  evidenceFiles?: string[]; // simulated file names
  assignedOwner?: string;
  resolutionNote?: string;
}
