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
  deliveryStatus?: string;
}

const TOKENS_STORAGE_KEY = 'anavandi_sms_tokens_v1';
const OUTBOX_STORAGE_KEY = 'anavandi_sms_outbox_v1';
const FAST2SMS_KEY_STORAGE = 'anavandi_fast2sms_key_v1';

const DEFAULT_FAST2SMS_KEY = 'q4oTG2H6hmWX9fBDdNkxlSsjZ5O3Aap1FQRzJLrv07nICPguwtAVFXd1tkqGh6Yc3bf9v87s4S2xzZwJ';

export function getFast2SMSKey(): string {
  try {
    return localStorage.getItem(FAST2SMS_KEY_STORAGE) || DEFAULT_FAST2SMS_KEY;
  } catch {
    return DEFAULT_FAST2SMS_KEY;
  }
}

export function saveFast2SMSKey(key: string) {
  try {
    localStorage.setItem(FAST2SMS_KEY_STORAGE, key.trim());
  } catch (err) {
    console.error('Failed to save Fast2SMS key:', err);
  }
}

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

/**
 * Extracts 10-digit Indian phone number from any raw string
 */
function cleanIndianPhoneNumber(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits;
}

/**
 * Sends a real SMS via Fast2SMS Bulk V2 API (Proxied through Vite dev server to bypass CORS)
 */
async function dispatchFast2Sms(targetPhone: string, messageText: string): Promise<string> {
  const apiKey = getFast2SMSKey();
  const cleanPhone = cleanIndianPhoneNumber(targetPhone);

  if (!cleanPhone || cleanPhone.length !== 10) {
    return `Simulated (Invalid 10-digit phone: ${targetPhone})`;
  }

  try {
    // 1. Try local dev proxy /fast2sms-api/dev/bulkV2
    const res = await fetch('/fast2sms-api/dev/bulkV2', {
      method: 'POST',
      headers: {
        authorization: apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        route: 'q', // Quick SMS Route
        message: messageText,
        language: 'english',
        flash: 0,
        numbers: cleanPhone,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (data && data.return === true) {
      return `Delivered via Fast2SMS to +91 ${cleanPhone}`;
    } else if (data && data.message) {
      return `Fast2SMS Info: ${data.message}`;
    }
  } catch (err) {
    console.warn('Proxy fetch failed, attempting direct GET fallback:', err);
  }

  // 2. Direct GET Fallback
  try {
    const getUrl = `https://www.fast2sms.com/dev/bulkV2?authorization=${encodeURIComponent(
      apiKey
    )}&route=q&message=${encodeURIComponent(messageText)}&language=english&flash=0&numbers=${cleanPhone}`;

    const res = await fetch(getUrl);
    const data = await res.json().catch(() => ({}));

    if (data && data.return === true) {
      return `Delivered via Fast2SMS (GET) to +91 ${cleanPhone}`;
    }
    return `Fast2SMS Status: ${data.message || 'Response received'}`;
  } catch (err: any) {
    console.error('Fast2SMS GET fetch error:', err);
    return `CORS / Network Blocked. Logged to outbox.`;
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
    : `Bus Sahayi: Complaint ${params.complaintRef} (${params.categoryLabel}) on bus ${params.busNumber}. Update status: ${updateUrl}`;

  const now = new Date().toISOString();

  // Attempt real SMS dispatch via Fast2SMS
  const deliveryStatus = await dispatchFast2Sms(params.conductorPhone, messageContent);

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
    deliveryStatus,
  };

  const outbox = getStoredOutbox();
  saveStoredOutbox([outboxLog, ...outbox]);

  // Transition complaint status to "Forwarded to conductor"
  await updateComplaintStatus(
    params.complaintId,
    'forwarded_to_conductor',
    `SMS dispatched to ${params.conductorName} (${params.conductorPhone}) [${deliveryStatus}].`,
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
