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
    console.error('Failed to save SMS tokens:', err);
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
    console.error('Failed to save SMS outbox:', err);
  }
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
  // Generate random secure token
  const token = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const origin = window.location.origin;
  const updateUrl = `${origin}/u/${token}`;

  const messageContent = params.customMessage
    ? params.customMessage.replace('{token}', token).replace('{origin}', origin)
    : `ANAVANDI: Complaint ${params.complaintRef} (${params.categoryLabel}) on bus ${params.busNumber}. Update status: ${updateUrl}`;

  const now = new Date().toISOString();

  // Save token entry
  const tokenEntry: SmsToken = {
    token,
    complaintId: params.complaintId,
    complaintRef: params.complaintRef,
    categoryLabel: params.categoryLabel,
    busNumber: params.busNumber,
    conductorName: params.conductorName,
    conductorPhone: params.conductorPhone,
    sentAt: now,
    isUsed: false,
  };

  const tokens = getStoredTokens();
  tokens[token] = tokenEntry;
  saveStoredTokens(tokens);

  // Save outbox log
  const outboxLog: SmsOutboxLog = {
    id: `sms-${Date.now()}`,
    token,
    complaintId: params.complaintId,
    complaintRef: params.complaintRef,
    categoryLabel: params.categoryLabel,
    busNumber: params.busNumber,
    conductorName: params.conductorName,
    conductorPhone: params.conductorPhone,
    depotId: params.depotId,
    sentAt: now,
    messageContent,
    updateUrl,
  };

  const outbox = getStoredOutbox();
  saveStoredOutbox([outboxLog, ...outbox]);

  // Transition complaint status to "Forwarded to conductor"
  await updateComplaintStatus(
    params.complaintId,
    'forwarded_to_conductor',
    `SMS notification dispatched to conductor ${params.conductorName} (${params.conductorPhone}).`,
    'depot_manager',
    'Depot Head Desk'
  );

  return { token, outboxLog };
}

export async function getSmsToken(tokenStr: string): Promise<SmsToken | null> {
  const tokens = getStoredTokens();
  return tokens[tokenStr] || null;
}

export async function submitConductorStatusUpdate(
  tokenStr: string,
  status: 'acknowledged' | 'resolved',
  note?: string
): Promise<{ success: boolean; message: string }> {
  const tokens = getStoredTokens();
  const tokenEntry = tokens[tokenStr];

  if (!tokenEntry) {
    return { success: false, message: 'Invalid or missing access token.' };
  }

  if (tokenEntry.isUsed) {
    return { success: false, message: 'This link has expired.' };
  }

  const now = new Date().toISOString();

  // Update complaint status
  await updateComplaintStatus(
    tokenEntry.complaintId,
    status,
    note
      ? `Conductor (${tokenEntry.conductorName}): ${note}`
      : `Status updated by conductor ${tokenEntry.conductorName} via SMS link.`,
    'depot_staff',
    `Conductor - ${tokenEntry.conductorName}`
  );

  // Mark token as used
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
