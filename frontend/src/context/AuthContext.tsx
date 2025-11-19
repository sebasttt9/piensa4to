import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import api from '../lib/api';

type Role = 'admin' | 'user';

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  register: (input: { name: string; email: string; password: string }) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'datapulse.persist';

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

  const persistUser = (nextUser: AuthUser | null, token?: string) => {
    if (typeof window === 'undefined') {
      return;
    }

    if (nextUser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }

    if (token) {
      localStorage.setItem('datapulse.token', token);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const nextUser: AuthUser = {
        id: data.user.id ?? data.user._id ?? data.user.sub ?? 'current',
        name: data.user.name ?? 'Usuario',
        email: data.user.email,
        role: data.user.role as Role,
      };
      setUser(nextUser);
      persistUser(nextUser, data.accessToken);
    } catch (error) {
      console.warn('Using offline mode. Backend no disponible todavía.', error);
      const fallbackUser: AuthUser = {
        id: 'local-user',
        name: 'Demo DataPulse',
        email,
        role: 'admin',
      };
      setUser(fallbackUser);
      persistUser(fallbackUser, 'demo-token');
    } finally {
      setLoading(false);
    }
  };

  const register = async (input: { name: string; email: string; password: string }) => {
    setLoading(true);
    try {
      await api.post('/auth/register', input);
      await signIn(input.email, input.password);
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    setUser(null);
    persistUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('datapulse.token');
    }
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      signIn,
      register,
      signOut,
    }),
    [loading, user],
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
