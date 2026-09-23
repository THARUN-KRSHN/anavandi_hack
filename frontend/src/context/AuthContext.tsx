import React, { createContext, useContext, useEffect, useState } from 'react';
import type { UserProfile, UserRole } from '../types/auth';
import { apiRequest, clearSession, loginWithPhone, signupWithPhone, type ApiUser } from '../services/api';
import { supabase, isSupabaseConfigured, signInWithSupabase, signUpWithSupabase, signOutSupabase } from '../lib/supabase';

function mapUser(user: ApiUser): UserProfile {
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

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isAuthenticated: boolean;
  loginUser: (phone: string, password: string) => Promise<void>;
  signUpUser: (name: string, phone: string, email: string, password?: string) => Promise<void>;
  loginStaffMember: (phone: string, password: string, role: 'depot_head' | 'admin') => Promise<void>;
  updateUserProfile: (name: string, phone: string, email: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('anavandi_user');
    return saved ? (JSON.parse(saved) as UserProfile) : null;
  });

  useEffect(() => {
    const unauthorized = () => {
      clearSession();
      signOutSupabase().catch(() => {});
      setUser(null);
    };

    const restore = async () => {
      if (!localStorage.getItem('anavandi_access_token')) return;
      try {
        const fresh = mapUser(await apiRequest<ApiUser>('/users/me'));
        setUser(fresh);
        localStorage.setItem('anavandi_user', JSON.stringify(fresh));
      } catch {
        unauthorized();
      }
    };

    void restore();

    // Attach Supabase Auth State Change Listener
    if (isSupabaseConfigured()) {
      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
          clearSession();
          setUser(null);
        } else if (session?.user && !localStorage.getItem('anavandi_access_token')) {
          const supUser: UserProfile = {
            id: session.user.id,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            phone: session.user.user_metadata?.phone || '',
            email: session.user.email || '',
            role: (session.user.user_metadata?.role as UserRole) || 'user',
          };
          setUser(supUser);
          localStorage.setItem('anavandi_user', JSON.stringify(supUser));
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
        window.removeEventListener('anavandi:unauthorized', unauthorized);
      };
    }

    window.addEventListener('anavandi:unauthorized', unauthorized);
    return () => window.removeEventListener('anavandi:unauthorized', unauthorized);
  }, []);

  const establish = (apiUser: ApiUser) => {
    const mapped = mapUser(apiUser);
    localStorage.setItem('anavandi_user', JSON.stringify(mapped));
    setUser(mapped);
  };

  const login = async (phone: string, password: string) => {
    // 1. Sync backend login
    const result = await loginWithPhone(phone, password);
    localStorage.setItem('anavandi_access_token', result.token);
    establish(result.user);

    // 2. Sync Supabase login if configured
    if (isSupabaseConfigured() && result.user.email) {
      try {
        await signInWithSupabase(result.user.email, password);
      } catch (sbErr) {
        console.warn('Supabase Auth login notice:', sbErr);
      }
    }
  };

  const signup = async (name: string, phone: string, email: string, password = 'user123') => {
    // 1. Sync backend signup
    const result = await signupWithPhone(name, phone, email, password);
    localStorage.setItem('anavandi_access_token', result.token);
    establish(result.user);

    // 2. Sync Supabase signup if configured
    if (isSupabaseConfigured()) {
      try {
        await signUpWithSupabase(email, password, { name, phone, role: 'user' });
      } catch (sbErr) {
        console.warn('Supabase Auth signup notice:', sbErr);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'user',
        isAuthenticated: !!user,
        loginUser: login,
        signUpUser: signup,
        loginStaffMember: async (phone, password, role) => {
          const result = await loginWithPhone(phone, password);
          const mapped = mapUser(result.user);
          if (mapped.role !== role) throw new Error('This account does not have the selected role.');
          localStorage.setItem('anavandi_access_token', result.token);
          establish(result.user);
        },
        updateUserProfile: async (name, phone, email) => {
          const updated = await apiRequest<ApiUser>('/users/me', {
            method: 'PUT',
            body: JSON.stringify({ name, phone, email }),
          });
          establish(updated);
        },
        logout: () => {
          clearSession();
          signOutSupabase().catch(() => {});
          setUser(null);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
