import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { api } from '../lib/api';
import {
  AuthSession,
  AuthUser,
  clearAuthSession,
  readAuthSession,
  UserRole,
  writeAuthSession,
} from './storage';

type LoginResponse = {
  accessToken: string;
  user: AuthUser;
};

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  role: UserRole | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => readAuthSession());

  const login = useCallback(async (email: string, password: string) => {
    const response = await api<LoginResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    const nextSession = { token: response.accessToken, user: response.user };

    writeAuthSession(nextSession);
    setSession(nextSession);
  }, []);

  const logout = useCallback(() => {
    clearAuthSession();
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token: session?.token ?? null,
      user: session?.user ?? null,
      role: session?.user.role ?? null,
      login,
      logout,
    }),
    [login, logout, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
