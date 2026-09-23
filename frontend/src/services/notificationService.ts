import { syncEngine } from './syncEngine';

export interface DepotNotification {
  id: string;
  depotId: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  type: 'complaint' | 'admin_message';
  referenceId?: string;
  senderName?: string;
}

const STORAGE_KEY = 'anavandi_notifications_v1';

const initialNotifications: DepotNotification[] = [
  {
    id: 'notif-1',
    depotId: 'DEP-EKM',
    title: 'New Complaint Filed: GRV-10481',
    message: 'Bus Cleanliness & Hygiene issue reported on bus KL-15-B-1190.',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    read: false,
    type: 'complaint',
    referenceId: 'GRV-10481',
  },
  {
    id: 'notif-2',
    depotId: 'DEP-EKM',
    title: 'Admin Directive: High Backlog Notice',
    message: 'Please review and dispatch conductors for pending complaints from yesterday.',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    read: false,
    type: 'admin_message',
    senderName: 'State HQ Admin (Thiruvananthapuram)',
  },
  {
    id: 'notif-3',
    depotId: 'DEP-TCR',
    title: 'Urgent: Backlog SLA Breach',
    message: 'Thrissur depot unresolved complaints ratio is currently at 77%. Please take action.',
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    read: false,
    type: 'admin_message',
    senderName: 'Central Admin Desk',
  }
];

function getStoredNotifications(): DepotNotification[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialNotifications));
      return initialNotifications;
    }
    return JSON.parse(data);
  } catch {
    return initialNotifications;
  }
}

function saveStoredNotifications(items: DepotNotification[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    syncEngine.broadcast('NOTIFICATION_UPDATED');
  } catch (err) {
    console.error('Failed to save notifications:', err);
  }
}

export async function fetchNotifications(depotId?: string): Promise<DepotNotification[]> {
  const all = getStoredNotifications();
  if (!depotId) return all;
  return all
    .filter((n) => n.depotId === depotId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function addNotification(
  depotId: string,
  title: string,
  message: string,
  type: 'complaint' | 'admin_message',
  referenceId?: string,
  senderName?: string
): Promise<DepotNotification> {
  const all = getStoredNotifications();
  const newNotif: DepotNotification = {
    id: `notif-${Date.now()}`,
    depotId,
    title,
    message,
    createdAt: new Date().toISOString(),
    read: false,
    type,
    referenceId,
    senderName,
  };
  const updated = [newNotif, ...all];
  saveStoredNotifications(updated);
  return newNotif;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  const all = getStoredNotifications();
  const index = all.findIndex((n) => n.id === id);
  if (index !== -1) {
    all[index].read = true;
    saveStoredNotifications(all);
  }
}

export async function markAllNotificationsAsRead(depotId: string): Promise<void> {
  const all = getStoredNotifications();
  const updated = all.map((n) => (n.depotId === depotId ? { ...n, read: true } : n));
  saveStoredNotifications(updated);
}
