export interface DepotMaster {
  id: string; // e.g. 'DEP-EKM'
  name: string; // e.g. 'Ernakulam Central Depot'
  code: string;
  district: string;
  location: string;
  lat: number;
  lng: number;
  depotHeadId: string;
  depotHeadName: string;
  depotHeadPhone: string;
  totalBuses: number;
  totalCrew: number;
  openComplaints: number;
  resolvedComplaints: number;
  totalComplaints: number;
  phone: string;
  email: string;
  slaCompliance?: number;
}

export interface SMSOutboxLog {
  id: string;
  depotId: string;
  complaintRef: string;
  conductorName: string;
  conductorPhone: string;
  messageText: string;
  token: string;
  sentAt: string;
}

export interface DepotNotification {
  id: string;
  depotId: string;
  type: 'new_complaint' | 'admin_message';
  title: string;
  message: string;
  complaintRef?: string;
  senderName: string;
  createdAt: string;
  read: boolean;
}
