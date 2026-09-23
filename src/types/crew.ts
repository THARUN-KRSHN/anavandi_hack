export type CrewRole = 'conductor' | 'driver';

export interface CrewMember {
  pen: string; // Employee Identification Number (e.g. PEN-88421)
  name: string;
  role: CrewRole;
  depotId: string;
  depotName: string;
  phone: string;
  email?: string;
  currentDutyId?: string;
  currentBusNumber?: string;
  rating: number;
  totalTripsCompleted: number;
  joinedDate: string;
}

export interface DutyRoster {
  id: string; // e.g. D-104
  date: string;
  shift: 'morning' | 'evening' | 'night';
  busNumber: string;
  routeId: string;
  routeName: string;
  routeCode?: string;
  depotId: string;
  conductorPen: string;
  conductorName: string;
  conductorPhone?: string;
  driverPen: string;
  driverName: string;
  driverPhone?: string;
  startTime: string; // e.g. 06:00
  endTime: string;   // e.g. 14:00
  shiftSchedule?: string;
  status: 'scheduled' | 'on_duty' | 'completed';
}
