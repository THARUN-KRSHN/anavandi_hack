import { apiRequest } from './api';

export interface SmsToken {
  token: string;
  complaintId: string;
  complaintRef: string;
  categoryLabel: string;
  description?: string;
  busNumber: string;
  routeFrom?: string;
  routeTo?: string;
  incidentTime?: string;
  conductorName: string;
  conductorPhone: string;
  sentAt: string;
  isUsed: boolean;
  status?: string;
  usedAt?: string;
}
export interface SmsOutboxLog {
  id: string;
  token: string;
  complaintId: string;
  complaintRef: string;
  categoryLabel: string;
  busNumber: string;
  conductorName: string;
  conductorPhone: string;
  depotId: string;
  sentAt: string;
  messageContent: string;
  updateUrl: string;
}

export async function sendConductorSms(params: {
  complaintId: string;
  complaintRef: string;
  categoryLabel: string;
  busNumber: string;
  conductorName: string;
  conductorPhone: string;
  depotId: string;
  customMessage?: string;
}): Promise<{ token: string; outboxLog: SmsOutboxLog }> {
  const result = await apiRequest<any>(`/depot/complaints/${params.complaintId}/notify-conductor`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  const actionUrl = result.action_url as string;
  const token = actionUrl.split('/').pop() || '';
  return {
    token,
    outboxLog: {
      id: String(Date.now()),
      token,
      complaintId: params.complaintId,
      complaintRef: params.complaintRef,
      categoryLabel: params.categoryLabel,
      busNumber: params.busNumber,
      conductorName: result.conductor?.name || params.conductorName,
      conductorPhone: result.conductor?.phone || params.conductorPhone,
      depotId: params.depotId,
      sentAt: new Date().toISOString(),
      messageContent: `Complaint ${params.complaintRef} action link sent by backend SMS provider.`,
      updateUrl: `/u/${token}`,
    },
  };
}

export async function getSmsToken(token: string): Promise<SmsToken | null> {
  try {
    const result = await apiRequest<any>(`/conductor/action/${token}`, { headers: {} });
    return {
      token,
      complaintId: String(result.complaint_id || result.reference_number || ''),
      complaintRef: result.reference_number,
      categoryLabel: result.category,
      description: result.description,
      busNumber: result.bus?.bus_number || '',
      routeFrom: result.route?.source || '',
      routeTo: result.route?.destination || '',
      incidentTime: `${result.reported_date || ''} ${result.reported_time || ''}`.trim(),
      conductorName: result.conductor_name || '',
      conductorPhone: '',
      sentAt: result.reported_date || '',
      isUsed: result.status === 'RESOLVED' || result.status === 'ACTION_TAKEN',
      status: result.status,
    };
  } catch {
    return null;
  }
}

export async function submitConductorStatusUpdate(
  token: string,
  status: 'acknowledged' | 'resolved' | 'unable_to_resolve',
  note?: string
): Promise<{ success: boolean; message: string }> {
  const backendStatus =
    status === 'resolved'
      ? 'RESOLVED'
      : status === 'unable_to_resolve'
      ? 'UNABLE_TO_RESOLVE'
      : 'UNDER_REVIEW';
  try {
    const result = await apiRequest<any>(`/conductor/action/${token}`, {
      method: 'POST',
      body: JSON.stringify({ status: backendStatus, comment: note }),
    });
    return { success: true, message: result.message || 'Complaint status updated successfully.' };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to update complaint.' };
  }
}

export async function fetchSmsOutbox(_depotId?: string): Promise<SmsOutboxLog[]> {
  try {
    const rows = await apiRequest<any[]>('/depot/outbox');
    return rows.map((r) => {
      const rawUrl = r.updateUrl || '';
      const token = rawUrl.split('/').pop() || '';
      return {
        id: r.id,
        token,
        complaintId: r.complaintId,
        complaintRef: r.complaintRef,
        categoryLabel: r.categoryLabel,
        busNumber: r.busNumber,
        conductorName: r.conductorName,
        conductorPhone: r.conductorPhone,
        depotId: r.depotId,
        sentAt: r.sentAt,
        messageContent: r.messageContent,
        updateUrl: token ? `/u/${token}` : rawUrl,
      };
    });
  } catch {
    return [];
  }
}
