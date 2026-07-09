'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { AuthenticatedUserDto } from '@casa/shared-types';
import { apiClient } from './api-client';

interface AuthContextValue {
  user: AuthenticatedUserDto | null;
  accessToken: string | null;
  loading: boolean;
  login: (name: string, pin: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const ACCESS_TOKEN_KEY = 'casa.accessToken';
const REFRESH_TOKEN_KEY = 'casa.refreshToken';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUserDto | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedAccess = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!storedAccess) {
      setLoading(false);
      return;
    }

    apiClient
      .me(storedAccess)
      .then((profile) => {
        setUser(profile);
        setAccessToken(storedAccess);
      })
      .catch(() => {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (name: string, pin: string) => {
    const tokens = await apiClient.pinLogin(name, pin);
    const profile = await apiClient.me(tokens.accessToken);
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    setAccessToken(tokens.accessToken);
    setUser(profile);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setAccessToken(null);
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, accessToken, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  }
  return ctx;
}
