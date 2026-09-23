import { apiRequest } from './api';

export interface DepotNotification { id: string; depotId: string; title: string; message: string; createdAt: string; read: boolean; type: 'complaint' | 'admin_message'; referenceId?: string; senderName?: string; }

export async function fetchNotifications(_depotId?: string): Promise<DepotNotification[]> { const result = await apiRequest<any>('/notifications/mine'); return (result.notifications || []).map((item: any) => ({ id: String(item.id), depotId: String(item.recipient_id || ''), title: item.title, message: item.message, createdAt: item.created_at, read: item.read_at != null, type: item.complaint_id ? 'complaint' : 'admin_message', referenceId: item.complaint_id ? String(item.complaint_id) : undefined })); }
export async function addNotification(depotId: string, title: string, message: string, _type: 'complaint' | 'admin_message', _referenceId?: string, _senderName?: string): Promise<DepotNotification> { await apiRequest(`/admin/depots/${depotId}/notify`, { method: 'POST', body: JSON.stringify({ subject: title, message }) }); return { id: `server-${Date.now()}`, depotId, title, message, createdAt: new Date().toISOString(), read: false, type: 'admin_message' }; }
export async function markNotificationAsRead(id: string): Promise<void> {
  try {
    await apiRequest(`/notifications/${id}/read`, { method: 'POST' });
  } catch (err) {
    console.warn('Failed to mark notification as read:', err);
  }
}

export async function markAllNotificationsAsRead(_depotId?: string): Promise<void> {
  try {
    await apiRequest('/notifications/read-all', { method: 'POST' });
  } catch (err) {
    console.warn('Failed to mark all notifications as read:', err);
  }
}
