'use server';

import axios from 'axios';
import { getApiUrl } from '@/lib/api/config';
import { getAuthToken } from './auth';
import { TENANT_MODULES } from '@/lib/tenant-modules';

export type EffectiveBranding = {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
};

export type Tenant = {
  id: string;
  name: string;
  adminEmail: string;
  brandingSettings: Record<string, unknown>;
  whiteLabelEnabled?: boolean;
  /** Resolved branding for the whole app: tenant's if white label, else platform default. */
  effectiveBranding?: EffectiveBranding;
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

export async function getTenantModulesAction(): Promise<string[]> {
  const token = await getAuthToken();
  if (!token) return [...TENANT_MODULES];
  try {
    const { data } = await axios.get<{ enabledModules: string[] }>(
      getApiUrl('/api/v1/tenants/me/modules'),
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data.enabledModules ?? [...TENANT_MODULES];
  } catch {
    return [...TENANT_MODULES];
  }
}

export async function setTenantModuleAction(module: string, enable: boolean): Promise<string[] | null> {
  const token = await getAuthToken();
  if (!token) return null;
  try {
    const { data } = await axios.put<{ enabledModules: string[] }>(
      getApiUrl('/api/v1/tenants/me/modules'),
      { module, enable },
      { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
    );
    return data.enabledModules ?? null;
  } catch {
    return null;
  }
}

export type TenantBranding = {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
};

export async function setTenantBrandingAction(branding: TenantBranding): Promise<Tenant | null> {
  const token = await getAuthToken();
  if (!token) return null;
  try {
    const { data } = await axios.put<Tenant>(
      getApiUrl('/api/v1/tenants/me/branding'),
      branding,
      { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
    );
    return data ?? null;
  } catch {
    return null;
  }
}
