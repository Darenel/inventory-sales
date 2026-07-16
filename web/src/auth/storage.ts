export type UserRole = 'admin' | 'vendedor' | 'almacen';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};

export const AUTH_STORAGE_KEY = 'inventory.auth';

export function readAuthSession(): AuthSession | null {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function writeAuthSession(session: AuthSession): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearAuthSession(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}
