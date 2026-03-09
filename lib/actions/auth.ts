'use server';

import axios from 'axios';
import { cookies } from 'next/headers';
import { getApiUrl } from '@/lib/api/config';
import { toUserFriendlyMessage } from '@/lib/errors';

const AUTH_COOKIE = 'ledgerhive_token';

export type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  mustChangePassword: boolean;
};

export type AuthResult = { user: User; token: string };

/**
 * Login. When tenantId is provided (e.g. from invite link ?tenantId=xxx), backend should
 * look up the user by email within that tenant (users table scoped by tenant) so that
 * invited users can sign in with their temporary password.
 */
export async function loginAction(
  email: string,
  password: string,
  tenantId?: string | null
): Promise<AuthResult> {
  try {
    const body: { email: string; password: string; tenantId?: string } = {
      email: (email ?? '').trim(),
      password: (password ?? '').trim(),
    };
    if (tenantId != null && tenantId.trim()) body.tenantId = tenantId.trim();
    const { data } = await axios.post<{ user: User; token: string }>(
      getApiUrl('/api/auth/login'),
      body,
      { headers: { 'Content-Type': 'application/json' } }
    );
    return { user: data.user, token: data.token };
  } catch (err) {
    throw new Error(toUserFriendlyMessage(err, 'Invalid email or password. Please try again.'));
  }
}

export async function signupAction(
  email: string,
  password: string,
  name: string,
  organizationName: string,
  modules?: string[],
): Promise<AuthResult> {
  try {
    const body: Record<string, unknown> = { email, password, name, organizationName };
    if (modules != null && modules.length > 0) body.modules = modules;
    const { data } = await axios.post<{ user: User; token: string }>(
      getApiUrl('/api/auth/signup'),
      body,
      { headers: { 'Content-Type': 'application/json' } },
    );
    return { user: data.user, token: data.token };
  } catch (err) {
    throw new Error(toUserFriendlyMessage(err, 'Unable to create account. Please try again.'));
  }
}

export async function setAuthCookie(token: string): Promise<void> {
  const c = await cookies();
  const isProd = process.env.NODE_ENV === 'production';
  c.set(AUTH_COOKIE, token, {
    path: '/',
    maxAge: 60 * 60 * 24,
    sameSite: 'lax',
    httpOnly: true,
    secure: isProd,
  });
}

export async function clearAuthCookie(): Promise<void> {
  const c = await cookies();
  c.delete(AUTH_COOKIE);
}

export async function logoutAction(): Promise<void> {
  try {
    const token = await getAuthToken();
    await axios.post(
      getApiUrl('/api/auth/logout'),
      token ? { token } : {},
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch {
    // ignore
  }
  await clearAuthCookie();
}

export async function getAuthToken(): Promise<string | null> {
  const c = await cookies();
  return c.get(AUTH_COOKIE)?.value ?? null;
}

export async function getCurrentUserAction(): Promise<User | null> {
  const token = await getAuthToken();
  if (!token) return null;
  try {
    const { data } = await axios.get<User>(getApiUrl('/api/auth/me'), {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  } catch {
    return null;
  }
}

export async function verifyEmailAction(email: string, code: string): Promise<void> {
  try {
    await axios.post(
      getApiUrl('/api/auth/verify-email'),
      { email, code },
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    throw new Error(toUserFriendlyMessage(err, 'Invalid or expired verification code. Please try again.'));
  }
}

/** Invited-user flow: verify OTP and set password; returns user + token. tenantId from invite link ensures lookup in correct tenant schema. */
export async function setPasswordWithOtpAction(
  email: string,
  code: string,
  newPassword: string,
  tenantId?: string | null
): Promise<AuthResult> {
  try {
    const body: Record<string, string> = {
      email: (email ?? '').trim(),
      code: (code ?? '').trim(),
      newPassword: (newPassword ?? '').trim(),
    };
    if (tenantId != null && tenantId.trim()) body.tenantId = tenantId.trim();
    const { data } = await axios.post<{ user: User; token: string }>(
      getApiUrl('/api/auth/set-password-with-otp'),
      body,
      { headers: { 'Content-Type': 'application/json' } }
    );
    return { user: data.user, token: data.token };
  } catch (err) {
    throw new Error(toUserFriendlyMessage(err, 'Invalid or expired code. Please check the code and try again.'));
  }
}

/** Invited-user flow: verify OTP, set password, set auth cookie, and return user (then redirect to dashboard). */
export async function setPasswordWithOtpAndLoginAction(
  email: string,
  code: string,
  newPassword: string,
  tenantId?: string | null
): Promise<User> {
  const result = await setPasswordWithOtpAction(email, code, newPassword, tenantId);
  await setAuthCookie(result.token);
  return result.user;
}

export async function changePasswordAction(currentPassword: string, newPassword: string): Promise<void> {
  const token = await getAuthToken();
  if (!token) throw new Error('Please sign in to continue.');
  try {
    await axios.post(
      getApiUrl('/api/auth/change-password'),
      { currentPassword, newPassword },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );
  } catch (err) {
    throw new Error(toUserFriendlyMessage(err, 'Could not update password. Please check your current password and try again.'));
  }
}
