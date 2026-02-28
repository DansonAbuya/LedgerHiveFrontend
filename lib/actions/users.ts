'use server';

import axios from 'axios';
import { getApiUrl } from '@/lib/api/config';
import { getAuthToken } from './auth';

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'finance_officer' | 'collections_agent' | 'manager';
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  mustChangePassword: boolean;
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
  role: AdminUser['role'];
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
  } catch (err: any) {
    if (axios.isAxiosError(err) && err.response?.data?.message) {
      throw new Error(err.response.data.message);
    }
    throw new Error('Failed to invite user');
  }
}

