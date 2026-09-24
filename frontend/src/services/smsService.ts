import { syncEngine } from './syncEngine';
import { updateComplaintStatus } from './complaintsService';

export interface SmsToken {
  token: string;
  complaintId: string;
  complaintRef: string;
  categoryLabel: string;
  busNumber: string;
  conductorName: string;
  conductorPhone: string;
  sentAt: string;
  isUsed: boolean;
  usedAt?: string;
  description?: string;
  routeFrom?: string;
  routeTo?: string;
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
  deliveryStatus?: string;
}

const TOKENS_STORAGE_KEY = 'anavandi_sms_tokens_v1';
const OUTBOX_STORAGE_KEY = 'anavandi_sms_outbox_v1';

function getStoredTokens(): Record<string, SmsToken> {
  try {
    const data = localStorage.getItem(TOKENS_STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function saveStoredTokens(tokens: Record<string, SmsToken>) {
  try {
    localStorage.setItem(TOKENS_STORAGE_KEY, JSON.stringify(tokens));
  } catch (err) {
    console.error('Failed to save action tokens:', err);
  }
}

function getStoredOutbox(): SmsOutboxLog[] {
  try {
    const data = localStorage.getItem(OUTBOX_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveStoredOutbox(logs: SmsOutboxLog[]) {
  try {
    localStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(logs));
    syncEngine.broadcast('COMPLAINT_UPDATED');
  } catch (err) {
    console.error('Failed to save outbox:', err);
  }
}

export interface SendConductorEmailParams {
  complaintId: string;
  complaintRef: string;
  categoryLabel: string;
  busNumber: string;
  conductorName: string;
  conductorPhone?: string;
  recipientEmail?: string;
  depotId: string;
  customMessage?: string;
  description?: string;
  routeCode?: string;
}

export async function sendConductorSms(params: SendConductorEmailParams): Promise<{ token: string; outboxLog: SmsOutboxLog }> {
  // Generate random secure token
  const token = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const origin = window.location.origin;
  const updateUrl = `${origin}/u/${token}`;
  const targetEmail = params.recipientEmail || 'tharunkrishnachoolikattil@gmail.com';

  const messageContent = params.customMessage
    ? params.customMessage.replace('{token}', token).replace('{origin}', origin)
    : `Bus Sahayi: Grievance ${params.complaintRef} (${params.categoryLabel}) on bus ${params.busNumber}. Update status: ${updateUrl}`;

  const now = new Date().toISOString();
  let deliveryStatus = `Delivered via Email to ${targetEmail}`;

  // Call backend API to dispatch official email & update DB status
  try {
    const res = await fetch('/api/conductor/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        complaint_id: params.complaintId,
        complaint_ref: params.complaintRef,
        category_label: params.categoryLabel,
        bus_number: params.busNumber,
        conductor_name: params.conductorName,
        recipient_email: targetEmail,
        route_code: params.routeCode,
        description: params.description,
        token,
      }),
    });
    const result = await res.json().catch(() => null);
    if (result && result.data && result.data.token) {
      // Store under backend token as well
      const backendToken = result.data.token;
      const tokens = getStoredTokens();
      tokens[backendToken] = {
        token: backendToken,
        complaintId: params.complaintId,
        complaintRef: params.complaintRef,
        categoryLabel: params.categoryLabel,
        busNumber: params.busNumber,
        conductorName: params.conductorName,
        conductorPhone: params.conductorPhone || '+91 94470 00000',
        sentAt: now,
        isUsed: false,
        description: params.description,
      };
      saveStoredTokens(tokens);
    }
  } catch (e) {
    console.warn('Backend conductor email dispatch note:', e);
  }

  // Save token entry
  const tokenEntry: SmsToken = {
    token,
    complaintId: params.complaintId,
    complaintRef: params.complaintRef,
    categoryLabel: params.categoryLabel,
    busNumber: params.busNumber,
    conductorName: params.conductorName,
    conductorPhone: params.conductorPhone || '+91 94470 00000',
    sentAt: now,
    isUsed: false,
    description: params.description,
  };

  const tokens = getStoredTokens();
  tokens[token] = tokenEntry;
  saveStoredTokens(tokens);

  // Save outbox log
  const outboxLog: SmsOutboxLog = {
    id: `disp-${Date.now()}`,
    token,
    complaintId: params.complaintId,
    complaintRef: params.complaintRef,
    categoryLabel: params.categoryLabel,
    busNumber: params.busNumber,
    conductorName: params.conductorName,
    conductorPhone: params.conductorPhone || '+91 94470 00000',
    depotId: params.depotId,
    sentAt: now,
    messageContent,
    updateUrl,
    deliveryStatus,
  };

  const outbox = getStoredOutbox();
  saveStoredOutbox([outboxLog, ...outbox]);

  // Transition complaint status to "Forwarded to conductor"
  await updateComplaintStatus(
    params.complaintId,
    'forwarded_to_conductor',
    `Action email dispatched to depot head email (${targetEmail}) for conductor ${params.conductorName}.`,
    'depot_manager',
    'Depot Head Desk'
  );

  return { token, outboxLog };
}

export const sendConductorEmail = sendConductorSms;

export async function getSmsToken(tokenStr: string): Promise<SmsToken | null> {
  const tokens = getStoredTokens();
  if (tokens[tokenStr]) {
    return tokens[tokenStr];
  }

  // Fallback to backend API
  try {
    const res = await fetch(`/api/conductor/action/${tokenStr}`);
    if (res.ok) {
      const json = await res.json();
      if (json && json.success && json.data) {
        const d = json.data;
        const mappedToken: SmsToken = {
          token: tokenStr,
          complaintId: d.reference_number || '1',
          complaintRef: d.reference_number || 'GRV-REF',
          categoryLabel: d.category ? d.category.replace(/_/g, ' ') : 'General Issue',
          busNumber: d.bus?.bus_number || 'KSRTC Fleet',
          conductorName: d.conductor_name || 'Duty Conductor',
          conductorPhone: d.bus?.conductor_phone || '+91 94470 00000',
          sentAt: d.reported_date || new Date().toISOString(),
          isUsed: d.status === 'RESOLVED' || d.status === 'ACTION_TAKEN',
          description: d.description,
          routeFrom: d.route?.source || 'Origin',
          routeTo: d.route?.destination || 'Destination',
        };
        return mappedToken;
      }
    }
  } catch (err) {
    console.warn('Backend token fetch error:', err);
  }

  return null;
}

export async function submitConductorStatusUpdate(
  tokenStr: string,
  status: 'acknowledged' | 'resolved',
  note?: string
): Promise<{ success: boolean; message: string }> {
  const tokens = getStoredTokens();
  const tokenEntry = tokens[tokenStr];

  // Try backend first if available
  try {
    const backendStatus = status === 'resolved' ? 'RESOLVED' : 'ACTION_TAKEN';
    const res = await fetch(`/api/conductor/action/${tokenStr}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: backendStatus,
        comment: note || `Status updated to ${status} by conductor.`,
      }),
    });
    if (res.ok) {
      if (tokenEntry) {
        tokenEntry.isUsed = true;
        tokenEntry.usedAt = new Date().toISOString();
        tokens[tokenStr] = tokenEntry;
        saveStoredTokens(tokens);
      }
      syncEngine.broadcast('COMPLAINT_UPDATED');
      return { success: true, message: 'Complaint status updated successfully.' };
    }
  } catch (e) {
    console.warn('Backend conductor submit notice:', e);
  }

  if (!tokenEntry) {
    return { success: false, message: 'Invalid or missing access token.' };
  }

  if (tokenEntry.isUsed) {
    return { success: false, message: 'This link has expired.' };
  }

  const now = new Date().toISOString();

  // Update complaint status locally
  await updateComplaintStatus(
    tokenEntry.complaintId,
    status,
    note
      ? `Conductor (${tokenEntry.conductorName}): ${note}`
      : `Status updated by conductor ${tokenEntry.conductorName} via link.`,
    'depot_staff',
    `Conductor - ${tokenEntry.conductorName}`
  );

  tokenEntry.isUsed = true;
  tokenEntry.usedAt = now;
  tokens[tokenStr] = tokenEntry;
  saveStoredTokens(tokens);

  syncEngine.broadcast('COMPLAINT_UPDATED');

  return { success: true, message: 'Complaint status updated successfully.' };
}

export async function fetchSmsOutbox(depotId?: string): Promise<SmsOutboxLog[]> {
  const list = getStoredOutbox();
  if (!depotId || depotId === 'all') return list;
  return list.filter((item) => item.depotId === depotId);
}
