import type { UserProfile } from '../types/auth';

const CURRENT_USER_KEY = 'anavandi_current_user_v2';
const REGISTERED_USERS_KEY = 'anavandi_registered_users_v2';

export const SEED_DEPOT_HEADS: (UserProfile & { passwordHash: string })[] = [
  {
    id: 'depot_ekm',
    name: 'K. R. Somasekharan (Depot Officer)',
    phone: '+91 94470 12044',
    email: 'depot.ekm@ksrtc.kerala.gov.in',
    role: 'depot_head',
    depotId: 'DEP-EKM',
    depotName: 'Ernakulam Central Depot',
    passwordHash: 'depot123',
  },
  {
    id: 'depot_alv',
    name: 'P. V. Jayakumar (Depot Officer)',
    phone: '+91 94470 18832',
    email: 'depot.alv@ksrtc.kerala.gov.in',
    role: 'depot_head',
    depotId: 'DEP-ALV',
    depotName: 'Aluva Depot',
    passwordHash: 'depot123',
  },
  {
    id: 'depot_tcr',
    name: 'M. S. Unnikrishnan (Depot Officer)',
    phone: '+91 94470 23110',
    email: 'depot.tcr@ksrtc.kerala.gov.in',
    role: 'depot_head',
    depotId: 'DEP-TCR',
    depotName: 'Thrissur Central Depot',
    passwordHash: 'depot123',
  },
  {
    id: 'depot_clt',
    name: 'C. K. Ramachandran (Depot Officer)',
    phone: '+91 94470 34912',
    email: 'depot.clt@ksrtc.kerala.gov.in',
    role: 'depot_head',
    depotId: 'DEP-CLT',
    depotName: 'Kozhikode Central Depot',
    passwordHash: 'depot123',
  },
  {
    id: 'depot_ktm',
    name: 'T. N. Gopakumar (Depot Officer)',
    phone: '+91 94470 41109',
    email: 'depot.ktm@ksrtc.kerala.gov.in',
    role: 'depot_head',
    depotId: 'DEP-KTM',
    depotName: 'Kottayam Depot',
    passwordHash: 'depot123',
  },
  {
    id: 'depot_tvm',
    name: 'V. S. Satheesh Kumar (Depot Officer)',
    phone: '+91 94470 59001',
    email: 'depot.tvm@ksrtc.kerala.gov.in',
    role: 'depot_head',
    depotId: 'DEP-TVM',
    depotName: 'Thiruvananthapuram Central Depot',
    passwordHash: 'depot123',
  },
];

export const SEED_ADMIN: UserProfile & { passwordHash: string } = {
  id: 'admin_head',
  name: 'Kerala State Transport Directorate',
  phone: '+91 471 2323886',
  email: 'admin.directorate@ksrtc.kerala.gov.in',
  role: 'admin',
  passwordHash: 'admin123',
};

export const DEFAULT_USER: UserProfile = {
  id: 'usr-default',
  name: 'Rahul Nair',
  phone: '9876543210',
  email: 'rahul.nair@example.com',
  role: 'user',
};

export function getCurrentUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) {
      // Default initial user session for smooth testing
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(DEFAULT_USER));
      return DEFAULT_USER;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_USER;
  }
}

export function setCurrentUserSession(user: UserProfile | null): void {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

export function getRegisteredUsers(): UserProfile[] {
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY);
    if (!raw) return [DEFAULT_USER];
    return JSON.parse(raw);
  } catch {
    return [DEFAULT_USER];
  }
}

export function registerUser(name: string, phone: string, email: string): UserProfile {
  const users = getRegisteredUsers();
  const existing = users.find((u) => u.phone === phone);
  if (existing) {
    const updated = { ...existing, name, email };
    setCurrentUserSession(updated);
    return updated;
  }

  const newUser: UserProfile = {
    id: `usr-${Date.now()}`,
    name,
    phone,
    email,
    role: 'user',
  };

  const updatedList = [...users, newUser];
  localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(updatedList));
  setCurrentUserSession(newUser);
  return newUser;
}

export function loginUserWithOTP(phone: string, otp: string): UserProfile {
  if (otp !== '123456') {
    throw new Error('Invalid OTP code. Please enter 123456 for testing.');
  }

  const users = getRegisteredUsers();
  let found = users.find((u) => u.phone === phone);

  if (!found) {
    // Auto-register user with default phone name if logging in directly
    found = {
      id: `usr-${Date.now()}`,
      name: `User (${phone.slice(-4)})`,
      phone,
      email: `${phone}@ksrtc.user`,
      role: 'user',
    };
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify([...users, found]));
  }

  setCurrentUserSession(found);
  return found;
}

export function loginStaff(id: string, password: string, role: 'depot_head' | 'admin'): UserProfile {
  if (role === 'admin') {
    if (id.trim() === SEED_ADMIN.id && password === SEED_ADMIN.passwordHash) {
      setCurrentUserSession(SEED_ADMIN);
      return SEED_ADMIN;
    }
    throw new Error('Invalid Admin credentials. Use ID: admin_head, Password: admin123');
  }

  const matchedHead = SEED_DEPOT_HEADS.find(
    (dh) => dh.id.toLowerCase() === id.trim().toLowerCase() && dh.passwordHash === password
  );

  if (matchedHead) {
    setCurrentUserSession(matchedHead);
    return matchedHead;
  }

  throw new Error('Invalid Depot Head credentials. Example ID: depot_ekm, Password: depot123');
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

  return updated;
}
