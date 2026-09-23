import type { UserProfile } from '../types/auth';
import { apiRequest, loginWithPhone, signupWithPhone, clearSession, type ApiUser } from './api';

export function mapApiUser(user: ApiUser): UserProfile {
  return {
    id: String(user.id),
    name: user.name,
    phone: user.phone || '',
    email: user.email,
    role: user.role === 'ADMIN' ? 'admin' : user.role === 'DEPOT_HEAD' ? 'depot_head' : 'user',
    depotId: user.depot_id ? String(user.depot_id) : undefined,
    depotName: (user as any).depot_name || undefined,
  };
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  const token = localStorage.getItem('anavandi_access_token');
  if (!token) return null;
  try {
    const raw = await apiRequest<ApiUser>('/users/me');
    return mapApiUser(raw);
  } catch {
    clearSession();
    return null;
  }
}

export async function updateProfile(name: string, phone: string, email: string): Promise<UserProfile> {
  const updated = await apiRequest<ApiUser>('/users/me', {
    method: 'PUT',
    body: JSON.stringify({ name, phone, email }),
  });
  return mapApiUser(updated);
}

export { loginWithPhone, signupWithPhone, clearSession };
