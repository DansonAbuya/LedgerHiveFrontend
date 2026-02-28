'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useTenant } from '@/lib/tenant-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  Bell,
  Settings,
  ListOrdered,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { AppLogo } from '@/components/AppLogo';
import { CurrencySelector } from '@/components/CurrencySelector';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useI18n } from '@/lib/i18n-context';

const navigationItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'finance_officer', 'manager', 'collections_agent'],
  },
  {
    label: 'Customers',
    href: '/customers',
    icon: Users,
    roles: ['admin', 'finance_officer', 'manager', 'collections_agent'],
  },
  {
    label: 'Invoices',
    href: '/invoices',
    icon: FileText,
    roles: ['admin', 'finance_officer', 'manager', 'collections_agent'],
  },
  {
    label: 'Payments',
    href: '/payments',
    icon: CreditCard,
    roles: ['admin', 'finance_officer', 'manager'],
  },
  {
    label: 'Collections',
    href: '/collections',
    icon: Bell,
    roles: ['admin', 'manager', 'collections_agent'],
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    roles: ['admin'],
  },
  {
    label: 'Audit Logs',
    href: '/settings/audit-logs',
    icon: ListOrdered,
    roles: ['admin'],
  },
];

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { user, logout } = useAuth();
  const { currentTenant } = useTenant();
  const { t } = useI18n();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLabels: Record<string, string> = {
    Dashboard: t('nav', 'dashboard'),
    Customers: t('nav', 'customers'),
    Invoices: t('nav', 'invoices'),
    Payments: t('nav', 'payments'),
    Collections: t('nav', 'collections'),
    Settings: t('nav', 'settings'),
    'Audit Logs': t('nav', 'auditLogs'),
  };

  const visibleNavItems = navigationItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch {
      window.location.href = '/login';
    }
  };

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-sidebar border-r border-sidebar-border transition-all duration-300 hidden lg:flex flex-col`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <AppLogo size={40} showText={sidebarOpen} />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  sidebarOpen ? 'justify-start' : 'justify-center'
                } hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground`}
              >
                <Icon size={20} />
                {sidebarOpen && <span className="text-sm">{navLabels[item.label] ?? item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse Button */}
        <div className="p-4 border-t border-sidebar-border">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border min-h-16 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2 sticky top-0 z-40">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden"
            >
              <Menu size={20} />
            </Button>

            {currentTenant && (
              <div>
                <h1 className="text-sm font-semibold text-foreground">
                  {currentTenant.name}
                </h1>
              </div>
            )}
            <div className="flex items-center gap-2 flex-shrink-0">
              <LanguageSwitcher />
              <CurrencySelector />
            </div>
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                    <span className="text-accent-foreground text-xs font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-foreground">
                      {user.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.role.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <ChevronDown size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium text-foreground">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings/profile">{t('nav', 'profileSettings')}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">{t('nav', 'organizationSettings')}</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut size={16} className="mr-2" />
                {t('auth', 'logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Mobile Sidebar */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-sidebar border-b border-sidebar-border p-4">
            <nav className="space-y-2">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon size={20} />
                    <span className="text-sm">{navLabels[item.label] ?? item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
