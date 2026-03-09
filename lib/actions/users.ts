'use server';

import axios from 'axios';
import { getApiUrl } from '@/lib/api/config';
import { getAuthToken } from './auth';
import { toUserFriendlyMessage } from '@/lib/errors';

import type { Role } from '@/lib/roles';

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: Role | string; // string for backward compat e.g. collections_agent
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  mustChangePassword: boolean;
  /** Portal access enabled by Admin or Operation Manager */
  portalEnabled?: boolean;
  /** Only present in invite (create) response; one-time temp password for admin to share. */
  temporaryPassword?: string;
};

export async function getUsersAction(): Promise<AdminUser[]> {
  const token = await getAuthToken();
  if (!token) return [];
  try {
    const { data } = await axios.get<AdminUser[]>(getApiUrl('/api/v1/users'), {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  } catch {
    return [];
  }
}

export async function inviteUserAction(input: {
  name: string;
  email: string;
  role: Role;
}): Promise<AdminUser | null> {
  const token = await getAuthToken();
  if (!token) return null;
  try {
    const { data } = await axios.post<AdminUser>(
      getApiUrl('/api/v1/users'),
      input,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return data;
  } catch (err) {
    throw new Error(toUserFriendlyMessage(err, 'Could not invite user. Please try again.'));
  }
}

/** Enable or disable a user's portal access. Only Admin or Operation Manager. */
export async function setUserPortalEnabledAction(userId: string, enabled: boolean): Promise<boolean> {
  const token = await getAuthToken();
  if (!token) return false;
  try {
    await axios.put(
      getApiUrl(`/api/v1/users/${userId}/portal-enabled`),
      { enabled },
      { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
    );
    return true;
  } catch {
    return false;
  }
}

