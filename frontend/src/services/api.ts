const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

export type ApiUser = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: 'USER' | 'DEPOT_HEAD' | 'ADMIN';
  depot_id?: number | null;
};

type ApiEnvelope<T> = { success: boolean; data?: T; error?: { message?: string } };

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('anavandi_access_token');
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const payload = (await response.json().catch(() => ({}))) as ApiEnvelope<T>;
  if (!response.ok || payload.success === false) {
    if (response.status === 401) window.dispatchEvent(new Event('anavandi:unauthorized'));
    throw new Error(payload.error?.message || `Request failed (${response.status})`);
  }
  return payload.data as T;
}

export async function login(email: string, password: string) {
  return apiRequest<{ token: string; user: ApiUser }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function signup(name: string, email: string, password: string, phone?: string) {
  return apiRequest<{ token: string; user: ApiUser }>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, phone }),
  });
}

export function clearSession() {
  localStorage.removeItem('anavandi_access_token');
  localStorage.removeItem('anavandi_user');
}

export { API_BASE_URL };
