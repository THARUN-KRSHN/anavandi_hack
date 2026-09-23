import type { UserProfile, UserRole } from '../types/auth';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { loginWithPhoneOrEmail, signupWithPhone, clearSession } from './api';

const CURRENT_USER_KEY = 'anavandi_current_user_v2';
const REGISTERED_USERS_KEY = 'anavandi_registered_users_v2';

export function getCurrentUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setCurrentUserSession(user: UserProfile | null): void {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    clearSession();
  }
}

export function getRegisteredUsers(): UserProfile[] {
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Synchronizes user data to Supabase Authentication (auth.users)
 * and Supabase Table Editor (public.users)
 */
async function syncUserToSupabase(params: {
  email: string;
  password?: string;
  name: string;
  phone: string;
  role: UserRole;
  depotId?: string;
  depotName?: string;
}): Promise<string | undefined> {
  if (!isSupabaseConfigured()) return undefined;

  const cleanPhone = params.phone.replace(/\D/g, '').slice(-10);
  const targetEmail = params.email.trim() || `passenger_${cleanPhone || 'anon'}@bussahayi.org`;
  let rawPass = params.password || `Pass#${cleanPhone || '123456'}`;
  // Ensure password is at least 6 characters for Supabase GoTrue
  if (rawPass.length < 6) {
    rawPass = `${rawPass}#${cleanPhone || '2026'}`;
  }
  const targetPassword = rawPass;

  let authUserId: string | undefined;

  try {
    // 1. Try signing in first
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: targetEmail,
      password: targetPassword,
    });

    if (!signInError && signInData?.user) {
      authUserId = signInData.user.id;
      await supabase.auth.updateUser({
        data: {
          name: params.name,
          phone: cleanPhone,
          role: params.role,
          ...(params.depotId ? { depot_id: params.depotId, depot_name: params.depotName } : {}),
        },
      }).catch(() => {});
    } else {
      // 2. If not signed in, create the user in Supabase Auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: targetEmail,
        password: targetPassword,
        options: {
          data: {
            name: params.name,
            phone: cleanPhone,
            role: params.role,
            ...(params.depotId ? { depot_id: params.depotId, depot_name: params.depotName } : {}),
          },
        },
      });

      if (!signUpError && signUpData?.user) {
        authUserId = signUpData.user.id;
      }
    }

    // 3. Upsert into public.users table in Supabase PostgreSQL
    try {
      await supabase.from('users').upsert(
        {
          email: targetEmail,
          name: params.name,
          phone: cleanPhone,
          role: params.role.toUpperCase(),
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      );
    } catch (tblErr) {
      console.warn('Supabase public.users sync notice:', tblErr);
    }

    return authUserId;
  } catch (err) {
    console.warn('Supabase Auth user sync notice:', err);
  }
  return undefined;
}

export async function registerUser(
  name: string,
  phone: string,
  email: string,
  password?: string
): Promise<UserProfile> {
  const cleanPhone = phone.replace(/\D/g, '').slice(-10);
  const userEmail = email.trim() || `passenger_${cleanPhone}@bussahayi.org`;
  const userPassword = password || `Pass#${cleanPhone || '123456'}`;

  // 1. Sync to Supabase Auth so user record appears immediately in Supabase
  const supabaseUserId = await syncUserToSupabase({
    name,
    phone: cleanPhone,
    email: userEmail,
    password: userPassword,
    role: 'user',
  });

  // 2. Sync to Backend REST API
  try {
    const res = await signupWithPhone(name, cleanPhone, userEmail, userPassword);
    if (res?.token) {
      localStorage.setItem('anavandi_access_token', res.token);
    }
  } catch (backendErr) {
    console.warn('Backend API signup fallback:', backendErr);
  }

  const users = getRegisteredUsers();
  const existing = users.find((u) => u.phone === cleanPhone);
  if (existing) {
    const updated = {
      ...existing,
      name,
      email: userEmail,
      id: supabaseUserId || existing.id,
      ...(password ? { password } : {}),
    };
    setCurrentUserSession(updated);
    return updated;
  }

  const newUser: UserProfile = {
    id: supabaseUserId || `usr-${Date.now()}`,
    name,
    phone: cleanPhone,
    email: userEmail,
    ...(password ? { password } : {}),
    role: 'user',
  };

  const updatedList = [...users, newUser];
  localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(updatedList));
  setCurrentUserSession(newUser);
  return newUser;
}

export async function loginUserWithPassword(phone: string, password: string): Promise<UserProfile> {
  const cleanPhone = phone.replace(/\D/g, '').slice(-10);
  const users = getRegisteredUsers();
  const existing = users.find((u) => u.phone === cleanPhone);
  const userEmail = existing?.email || `passenger_${cleanPhone}@bussahayi.org`;
  const userName = existing?.name || `Passenger (${cleanPhone.slice(-4)})`;

  // 1. Sync to Supabase Auth
  const supabaseUserId = await syncUserToSupabase({
    name: userName,
    phone: cleanPhone,
    email: userEmail,
    password,
    role: 'user',
  });

  // 2. Sync to Backend API
  try {
    const res = await loginWithPhoneOrEmail(cleanPhone, password);
    if (res?.token) {
      localStorage.setItem('anavandi_access_token', res.token);
    }
  } catch (backendErr) {
    console.warn('Backend API login notice:', backendErr);
  }

  let found = existing;
  if (!found) {
    found = {
      id: supabaseUserId || `usr-${Date.now()}`,
      name: userName,
      phone: cleanPhone,
      email: userEmail,
      role: 'user',
    };
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify([...users, found]));
  }

  setCurrentUserSession(found);
  return found;
}

export async function loginUserWithOTP(phone: string, otp: string): Promise<UserProfile> {
  const cleanPhone = phone.replace(/\D/g, '').slice(-10);
  if (otp.length < 4) {
    throw new Error('Please enter a valid OTP code.');
  }

  const users = getRegisteredUsers();
  const existing = users.find((u) => u.phone === cleanPhone);
  const userEmail = existing?.email || `passenger_${cleanPhone}@bussahayi.org`;
  const userName = existing?.name || `Passenger (${cleanPhone.slice(-4)})`;
  const userPassword = existing?.password || `Pass#${cleanPhone}`;

  // 1. Sync user data to Supabase Auth
  const supabaseUserId = await syncUserToSupabase({
    name: userName,
    phone: cleanPhone,
    email: userEmail,
    password: userPassword,
    role: 'user',
  });

  // 2. Sync to Backend API
  try {
    const res = await loginWithPhoneOrEmail(cleanPhone, userPassword).catch(() =>
      signupWithPhone(userName, cleanPhone, userEmail, userPassword)
    );
    if (res?.token) {
      localStorage.setItem('anavandi_access_token', res.token);
    }
  } catch (backendErr) {
    console.warn('Backend API OTP fallback notice:', backendErr);
  }

  let found = existing;
  if (!found) {
    found = {
      id: supabaseUserId || `usr-${Date.now()}`,
      name: userName,
      phone: cleanPhone,
      email: userEmail,
      role: 'user',
    };
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify([...users, found]));
  }

  setCurrentUserSession(found);
  return found;
}

export async function loginStaff(
  id: string,
  password: string,
  role: 'depot_head' | 'admin'
): Promise<UserProfile> {
  const staffId = id.trim();
  const staffEmail = staffId.includes('@') ? staffId : `${staffId.toLowerCase()}@ksrtc.kerala.gov.in`;

  // 1. Sync staff user to Supabase Auth
  const supabaseUserId = await syncUserToSupabase({
    name: role === 'admin' ? 'State Transport Admin' : `Depot Head (${staffId})`,
    phone: '',
    email: staffEmail,
    password,
    role,
    depotId: role === 'depot_head' ? staffId.toUpperCase() : undefined,
  });

  // 2. Sync to Backend API
  try {
    const res = await loginWithPhoneOrEmail(staffEmail, password);
    if (res?.token) {
      localStorage.setItem('anavandi_access_token', res.token);
    }
  } catch (backendErr) {
    console.warn('Backend API staff login notice:', backendErr);
  }

  const staffUser: UserProfile = {
    id: supabaseUserId || staffId,
    name: role === 'admin' ? 'Kerala State Transport Directorate' : `Depot Officer (${staffId})`,
    phone: '',
    email: staffEmail,
    role,
    depotId: role === 'depot_head' ? staffId.toUpperCase() : undefined,
    depotName: role === 'depot_head' ? `${staffId.toUpperCase()} Depot` : undefined,
  };

  setCurrentUserSession(staffUser);
  return staffUser;
}

export function updateProfile(name: string, phone: string, email: string): UserProfile {
  const current = getCurrentUser();
  if (!current) throw new Error('No user logged in');

  const updated: UserProfile = {
    ...current,
    name,
    phone,
    email,
  };

  setCurrentUserSession(updated);

  if (current.role === 'user') {
    const users = getRegisteredUsers();
    const idx = users.findIndex((u) => u.id === current.id);
    if (idx !== -1) {
      users[idx] = updated;
      localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
    }
  }

  // Sync update to Supabase Auth metadata
  if (isSupabaseConfigured()) {
    supabase.auth.updateUser({
      data: { name, phone },
    }).catch(console.warn);

    // Also update public.users table
    void supabase.from('users').update({
      name,
      phone,
      updated_at: new Date().toISOString(),
    }).eq('email', email).then(undefined, console.warn);
  }

  return updated;
}
