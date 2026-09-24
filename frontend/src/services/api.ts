const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export type ApiUser = {
  id: number;
  name: string;
  phone?: string | null;
  email: string;
  role: 'USER' | 'DEPOT_HEAD' | 'ADMIN';
  depot_id?: number | null;
  depot_name?: string;
};

type Envelope<T> = {
  success: boolean;
  data?: T;
  error?: { message?: string; code?: string };
};

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('anavandi_access_token');
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const payload = (await response.json().catch(() => ({}))) as Envelope<T>;

  if (!response.ok || payload.success === false) {
    if (response.status === 401) {
      window.dispatchEvent(new Event('anavandi:unauthorized'));
    }
    throw new Error(payload.error?.message || `Request failed (${response.status})`);
  }
  return payload.data as T;
}

export async function loginWithPhoneOrEmail(identifier: string, password: string) {
  const isEmail = identifier.includes('@');
  const body = isEmail ? { email: identifier, password } : { phone: identifier, password };
  return apiRequest<{ token: string; user: ApiUser }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function signupWithPhone(name: string, phone: string, email: string, password: string) {
  return apiRequest<{ token: string; user: ApiUser }>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name, phone, email, password }),
  });
}

export function clearSession() {
  localStorage.removeItem('anavandi_access_token');
  localStorage.removeItem('anavandi_current_user_v2');
  localStorage.removeItem('anavandi_user');
}

export async function fetchComplaintAiStatus(complaintId: string | number) {
  return apiRequest<any>(`/ai/status/${complaintId}`).catch(() => null);
}

export async function runComplaintAiAnalysis(complaintId: string | number) {
  return apiRequest<any>(`/ai/analyze/${complaintId}`, { method: 'POST' }).catch(() => null);
}

export async function runDuplicateCheck(complaintId: string | number) {
  return apiRequest<any>(`/ai/duplicates/${complaintId}`, { method: 'POST' }).catch(() => null);
}

export async function fetchAiTrends() {
  return apiRequest<any>(`/ai/trends`).catch(() => null);
}

export async function fetchAiAnomalies() {
  return apiRequest<any>(`/ai/anomalies`).catch(() => null);
}

export async function runDemoAiSimulation(scenario: string) {
  return apiRequest<any>(`/ai/demo/simulate`, {
    method: 'POST',
    body: JSON.stringify({ scenario }),
  });
}

export { API_BASE_URL };
