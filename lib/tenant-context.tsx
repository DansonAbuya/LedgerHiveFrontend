'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { getTenantsAction, type Tenant as ApiTenant } from '@/lib/actions/tenants';

export interface Tenant {
  id: string;
  name: string;
  adminEmail: string;
  brandingSettings: {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantContextType {
  currentTenant: Tenant | null;
  tenants: Tenant[];
  loading: boolean;
  error: string | null;
  setCurrentTenant: (tenant: Tenant) => void;
  fetchTenants: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

function toTenant(api: ApiTenant): Tenant {
  const bs = (api.brandingSettings && typeof api.brandingSettings === 'object'
    ? api.brandingSettings
    : {}) as { logoUrl?: string; primaryColor?: string; secondaryColor?: string };
  return {
    id: api.id,
    name: api.name,
    adminEmail: api.adminEmail,
    brandingSettings: { logoUrl: bs.logoUrl, primaryColor: bs.primaryColor, secondaryColor: bs.secondaryColor },
    createdAt: new Date(api.createdAt),
    updatedAt: new Date(api.updatedAt),
  };
}

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getTenantsAction();
      const mapped = list.map(toTenant);
      setTenants(mapped);
      if (mapped.length > 0 && !currentTenant) {
        setCurrentTenant(mapped[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tenants');
    } finally {
      setLoading(false);
    }
  }, [currentTenant]);

  const value: TenantContextType = {
    currentTenant,
    tenants,
    loading,
    error,
    setCurrentTenant,
    fetchTenants,
  };

  return (
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
}
