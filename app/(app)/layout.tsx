'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useTenant } from '@/lib/tenant-context';
import { AppShell } from '@/components/app-shell';
import { IdleLogout } from '@/components/IdleLogout';

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { fetchTenants } = useTenant();

  useEffect(() => {
    if (isAuthenticated) {
      fetchTenants();
    }
  }, [isAuthenticated, fetchTenants]);

  useEffect(() => {
    if (user?.mustChangePassword && pathname !== '/change-password') {
      router.replace('/change-password');
    }
  }, [user?.mustChangePassword, pathname, router]);

  return (
    <>
      <IdleLogout />
      <AppShell>{children}</AppShell>
    </>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayoutContent>{children}</AppLayoutContent>;
}
