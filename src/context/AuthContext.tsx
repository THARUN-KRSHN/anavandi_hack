import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile, UserRole } from '../types/auth';
import {
  getCurrentUser,
  setCurrentUserSession,
  registerUser,
  loginUserWithOTP,
  loginStaff,
  updateProfile,
} from '../services/authService';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isAuthenticated: boolean;
  loginUser: (phone: string, otp: string) => void;
  signUpUser: (name: string, phone: string, email: string) => void;
  loginStaffMember: (id: string, password: string, role: 'depot_head' | 'admin') => void;
  updateUserProfile: (name: string, phone: string, email: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => getCurrentUser());

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'anavandi_current_user_v2') {
        setUser(getCurrentUser());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const loginUser = (phone: string, otp: string) => {
    const u = loginUserWithOTP(phone, otp);
    setUser(u);
  };

  const signUpUser = (name: string, phone: string, email: string) => {
    const u = registerUser(name, phone, email);
    setUser(u);
  };

  const loginStaffMember = (id: string, password: string, role: 'depot_head' | 'admin') => {
    const u = loginStaff(id, password, role);
    setUser(u);
  };

  const updateUserProfile = (name: string, phone: string, email: string) => {
    const u = updateProfile(name, phone, email);
    setUser(u);
  };

  const logout = () => {
    setCurrentUserSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'user',
        isAuthenticated: !!user,
        loginUser,
        signUpUser,
        loginStaffMember,
        updateUserProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
