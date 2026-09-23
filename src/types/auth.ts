export type UserRole = 'user' | 'depot_head' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  depotId?: string; // For depot_head (e.g. 'DEP-EKM')
  depotName?: string;
}

export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
}
