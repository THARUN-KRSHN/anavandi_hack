import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiRequest, clearSession, login, signup, type ApiUser } from '../services/api';

type AuthContextValue = {
  user: ApiUser | null;
  isLoading: boolean;
  signIn: (phone: string, password: string) => Promise<ApiUser>;
  signUp: (name: string, phone: string, password: string, email?: string) => Promise<ApiUser>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ApiUser | null>(() => {
    const stored = localStorage.getItem('anavandi_user');
    return stored ? JSON.parse(stored) as ApiUser : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleUnauthorized = () => {
      clearSession();
      setUser(null);
    };
    window.addEventListener('anavandi:unauthorized', handleUnauthorized);
    if (user) {
      apiRequest<ApiUser>('/users/me').then((freshUser) => {
        setUser(freshUser);
        localStorage.setItem('anavandi_user', JSON.stringify(freshUser));
      }).catch(handleUnauthorized).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
    return () => window.removeEventListener('anavandi:unauthorized', handleUnauthorized);
  }, []);

  const establishSession = (result: { token: string; user: ApiUser }) => {
    localStorage.setItem('anavandi_access_token', result.token);
    localStorage.setItem('anavandi_user', JSON.stringify(result.user));
    setUser(result.user);
    return result.user;
  };

  const value: AuthContextValue = {
    user,
    isLoading,
    signIn: async (phone, password) => establishSession(await login(phone, password)),
    signUp: async (name, phone, password, email) => establishSession(await signup(name, phone, password, email)),
    signOut: () => { clearSession(); setUser(null); },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
