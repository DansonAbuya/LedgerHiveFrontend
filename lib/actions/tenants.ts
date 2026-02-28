'use server';

import axios from 'axios';
import { getApiUrl } from '@/lib/api/config';
import { getAuthToken } from './auth';

export type Tenant = {
  id: string;
  name: string;
  adminEmail: string;
  brandingSettings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export async function getTenantsAction(): Promise<Tenant[]> {
  const token = await getAuthToken();
  const url = getApiUrl('/api/tenants');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const { data } = await axios.get<{ tenants: Tenant[] }>(url, { headers });
  return data.tenants ?? [];
}
