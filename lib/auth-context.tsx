'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { loginAction, signupAction, logoutAction, setAuthCookie, getCurrentUserAction, changePasswordAction, type User as ApiUser } from '@/lib/actions/auth';
import { toUserFriendlyMessage } from '@/lib/errors';

import type { Role } from '@/lib/roles';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role | string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  mustChangePassword: boolean;
  portalEnabled?: boolean;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, tenantId?: string | null) => Promise<User>;
  signup: (email: string, password: string, name: string, organizationName: string, modules?: string[]) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function toUser(api: ApiUser): User {
  return {
    id: api.id,
    email: api.email,
    name: api.name,
    role: (api.role as User['role']) || 'manager',
    portalEnabled: (api as { portalEnabled?: boolean }).portalEnabled,
    tenantId: api.tenantId,
    createdAt: new Date(api.createdAt),
    updatedAt: new Date(api.updatedAt),
    mustChangePassword: api.mustChangePassword ?? false,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Bootstrap user from backend on initial mount (using cookie token)
  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      setLoading(true);
      try {
        const apiUser = await getCurrentUserAction();
        if (!cancelled && apiUser) {
          setUser(toUser(apiUser));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string, tenantId?: string | null): Promise<User> => {
    setLoading(true);
    setError(null);
    try {
      const { user: u, token } = await loginAction(email, password, tenantId);
      await setAuthCookie(token);
      const userObj = toUser(u);
      setUser(userObj);
      return userObj;
    } catch (err) {
      setError(toUserFriendlyMessage(err, 'Unable to sign in. Please try again.'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string, organizationName: string, modules?: string[]) => {
    setLoading(true);
    setError(null);
    try {
      await signupAction(email, password, name, organizationName, modules);
      // Do not auto-login; user must verify email first using OTP
    } catch (err) {
      setError(toUserFriendlyMessage(err, 'Unable to create account. Please try again.'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await logoutAction();
      setUser(null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    setLoading(true);
    setError(null);
    try {
      await changePasswordAction(currentPassword, newPassword);
      const apiUser = await getCurrentUserAction();
      if (apiUser) setUser(toUser(apiUser));
    } catch (err) {
      setError(toUserFriendlyMessage(err, 'Could not update password. Please try again.'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
