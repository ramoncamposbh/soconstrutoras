'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { authApi } from './api';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      authApi.me()
        .then((res) => setUser(res.data))
        .catch(() => Cookies.remove('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await authApi.login({ email, password });
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    Cookies.set('token', data.access_token, { expires: 7, secure: isHttps, sameSite: 'lax' });
    setUser(data.user);
  };

  const loginWithGoogle = async (credential: string) => {
    const { data } = await authApi.loginComGoogle(credential);
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    Cookies.set('token', data.access_token, { expires: 7, secure: isHttps, sameSite: 'lax' });
    setUser(data.user);
  };

  const logout = () => {
    Cookies.remove('token');
    setUser(null);
    window.location.href = '/auth/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
