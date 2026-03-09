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

  // Portal gate only for customers/applicants (added by Ops Manager). Staff (admin, operation_manager, etc.) can always log in.
  const isCustomer = user?.role === 'customer';
  const portalDisabled = user && isCustomer && user.portalEnabled === false;

  return (
    <>
      <IdleLogout />
      {portalDisabled ? (
        <div className="min-h-screen min-h-dvh flex items-center justify-center p-4">
          <div className="max-w-md text-center space-y-4">
            <h1 className="text-xl font-semibold text-foreground">Portal access is disabled</h1>
            <p className="text-muted-foreground">
              Your account does not have portal access yet. An admin or Operation Manager must enable your access. Please contact your administrator.
            </p>
          </div>
        </div>
      ) : (
        <AppShell>{children}</AppShell>
      )}
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
