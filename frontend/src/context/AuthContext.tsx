import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { isAxiosError } from 'axios';
import api from '../lib/api';

export type Role = 'user' | 'admin' | 'superadmin';

const ROLE_PRIORITY: Record<Role, number> = {
  user: 1,
  admin: 2,
  superadmin: 3,
};

const isRole = (value: unknown): value is Role => typeof value === 'string' && value in ROLE_PRIORITY;

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticating: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  register: (input: { name: string; email: string; password: string }) => Promise<void>;
  signOut: () => void;
  hasRole: (roles: Role | Role[]) => boolean;
  roleAtLeast: (role: Role) => boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'datapulse.persist';
const TOKEN_KEY = 'datapulse.token';

const mapApiUser = (payload: any): AuthUser => ({
  id: payload.id ?? payload._id ?? payload.sub ?? 'current',
  name: payload.name ?? 'Usuario',
  email: payload.email,
  role: isRole(payload.role) ? payload.role : 'user',
});

const resolveErrorMessage = (error: unknown): string => {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) {
      return message[0];
    }
    if (typeof message === 'string') {
      return message;
    }
    return 'No pudimos conectar con el servidor de autenticación.';
  }
  return 'Ocurrió un error inesperado. Inténtalo de nuevo.';
};

const applyAuthHeader = (token?: string) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    const cached = localStorage.getItem(STORAGE_KEY);
    if (!cached) return null;
    try {
      return JSON.parse(cached) as AuthUser;
    } catch (error) {
      console.error('Failed to parse cached session', error);
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);

  const persistUser = useCallback((nextUser: AuthUser | null, token?: string) => {
    if (typeof window === 'undefined') {
      return;
    }

    if (nextUser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }

    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }

    applyAuthHeader(token);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const nextUser = mapApiUser(data.user);
      setUser(nextUser);
      persistUser(nextUser, data.accessToken);
    } catch (error) {
      setUser(null);
      persistUser(null);
      throw new Error(resolveErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [persistUser]);

  const register = useCallback(async (input: { name: string; email: string; password: string }) => {
    setLoading(true);
    try {
      await api.post('/auth/register', input);
      await signIn(input.email, input.password);
    } catch (error) {
      throw new Error(resolveErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [signIn]);

  const signOut = useCallback(() => {
    setUser(null);
    persistUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, [persistUser]);

  const roleAtLeast = useCallback((required: Role) => {
    if (!user) {
      return false;
    }
    const userPriority = ROLE_PRIORITY[user.role] ?? 0;
    const requiredPriority = ROLE_PRIORITY[required] ?? Number.MAX_SAFE_INTEGER;
    return userPriority >= requiredPriority;
  }, [user]);

  const hasRole = useCallback((roles: Role | Role[]) => {
    const list = Array.isArray(roles) ? roles : [roles];
    return list.some((role) => roleAtLeast(role));
  }, [roleAtLeast]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsAuthenticating(false);
      return;
    }

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      applyAuthHeader();
      setIsAuthenticating(false);
      return;
    }

    applyAuthHeader(token);

    const bootstrap = async () => {
      try {
        const { data } = await api.get('/auth/me');
        const nextUser = mapApiUser(data);
        setUser(nextUser);
        persistUser(nextUser, token);
      } catch {
        signOut();
      } finally {
        setIsAuthenticating(false);
      }
    };

    bootstrap();
  }, [signOut]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handler = () => signOut();
    window.addEventListener('datapulse:unauthorized', handler);
    return () => window.removeEventListener('datapulse:unauthorized', handler);
  }, [signOut]);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticating,
      signIn,
      register,
      signOut,
      hasRole,
      roleAtLeast,
    }),
    [hasRole, isAuthenticating, loading, register, roleAtLeast, signIn, signOut, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de AuthProvider');
  }
  return context;
};
