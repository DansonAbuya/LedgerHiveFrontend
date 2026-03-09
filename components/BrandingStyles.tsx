'use client';

import React, { useEffect } from 'react';
import { useTenant } from '@/lib/tenant-context';

/**
 * Applies effective branding (primary/secondary colors) from API to the document root
 * so the whole app uses tenant or platform branding.
 */
export function BrandingStyles() {
  const { currentTenant } = useTenant();
  const primary = currentTenant?.effectiveBranding?.primaryColor;
  const secondary = currentTenant?.effectiveBranding?.secondaryColor;

  useEffect(() => {
    const root = document.documentElement;
    if (primary) root.style.setProperty('--primary', primary);
    else root.style.removeProperty('--primary');
    if (secondary) root.style.setProperty('--accent', secondary);
    else root.style.removeProperty('--accent');
    return () => {
      root.style.removeProperty('--primary');
      root.style.removeProperty('--accent');
    };
  }, [primary, secondary]);

  return null;
}
