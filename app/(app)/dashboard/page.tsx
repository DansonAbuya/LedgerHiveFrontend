'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, AlertCircle, Clock, DollarSign, ArrowRight, ShieldCheck } from 'lucide-react';
import { getInvoicesAction } from '@/lib/actions/invoices';
import type { Invoice } from '@/lib/actions/invoices';
import { getCreditApplicationsAction } from '@/lib/actions/credit-issuance';
import { getUsersAction, setUserPortalEnabledAction, type AdminUser } from '@/lib/actions/users';
import { useAuth } from '@/lib/auth-context';
import { useCurrency } from '@/lib/currency-context';
import { useI18n } from '@/lib/i18n-context';

const COLORS = ['#00C49F', '#FFA500', '#FF8042', '#DC2626'];

const CAN_ENABLE_PORTAL_ROLES = ['admin', 'operation_manager'];

export default function DashboardPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [creditApps, setCreditApps] = useState<{ content: Array<{ stage?: string; assignedToRole?: string }> }>({ content: [] });
  const [loading, setLoading] = useState(true);
  const [enablingId, setEnablingId] = useState<string | null>(null);
  const { user } = useAuth();
  const { formatAmountWithCode } = useCurrency();
  const { t } = useI18n();
  const canEnablePortal = user && CAN_ENABLE_PORTAL_ROLES.includes((user.role as string) ?? '');
  const creditRole = (user?.role as string) ?? '';
  const hasCreditWorkflowRole = ['admin', 'operation_manager', 'collateral_manager', 'finance_officer', 'manager'].includes(creditRole);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [invRes, usersList, appsRes] = await Promise.all([
          getInvoicesAction(0, 100),
          canEnablePortal ? getUsersAction() : Promise.resolve([]),
          hasCreditWorkflowRole ? getCreditApplicationsAction(0, 500) : Promise.resolve({ content: [] }),
        ]);
        if (!cancelled) {
          setInvoices(invRes.content ?? []);
          setUsers(usersList ?? []);
          setCreditApps(appsRes ?? { content: [] });
        }
      } catch {
        if (!cancelled) setInvoices([]);
        if (!cancelled && canEnablePortal) setUsers([]);
        if (!cancelled && hasCreditWorkflowRole) setCreditApps({ content: [] });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [canEnablePortal, hasCreditWorkflowRole]);

  const pendingPortalUsers = users.filter(
    (u) => (u.role as string) === 'customer' && u.portalEnabled === false
  );

  const myCreditQueueCount =
    hasCreditWorkflowRole && creditRole !== 'admin'
      ? creditApps.content.filter(
          (a) =>
            (a.assignedToRole?.toLowerCase() === creditRole.toLowerCase()) &&
            a.stage !== 'RELEASED' &&
            a.stage !== 'NOT_WORTHY'
        ).length
      : 0;

  const totalOutstanding = invoices
    .filter((i) => i.status !== 'Paid')
    .reduce((sum, i) => sum + Number(i.amount), 0);
  const totalPaid = invoices
    .filter((i) => i.status === 'Paid')
    .reduce((sum, i) => sum + Number(i.amount), 0);
  const overdueAmount = invoices
    .filter((i) => i.status === 'Overdue')
    .reduce((sum, i) => sum + Number(i.amount), 0);
  const recentInvoices = invoices.slice(0, 5);

  const agingBuckets = {
    current: 0,
    '30-60': 0,
    '60-90': 0,
    '90+': 0,
  };
  const now = new Date();
  invoices.forEach((inv) => {
    if (inv.status === 'Paid') return;
    const due = new Date(inv.dueDate);
    const days = Math.floor((now.getTime() - due.getTime()) / (24 * 60 * 60 * 1000));
    if (days <= 0) agingBuckets.current += Number(inv.amount);
    else if (days <= 60) agingBuckets['30-60'] += Number(inv.amount);
    else if (days <= 90) agingBuckets['60-90'] += Number(inv.amount);
    else agingBuckets['90+'] += Number(inv.amount);
  });
  const agingData = [
    { name: 'Current', value: agingBuckets.current, color: '#00C49F' },
    { name: '30-60 days', value: agingBuckets['30-60'], color: '#FFA500' },
    { name: '60-90 days', value: agingBuckets['60-90'], color: '#FF8042' },
    { name: '90+ days', value: agingBuckets['90+'], color: '#DC2626' },
  ].filter((d) => d.value > 0);

  const collectionRate =
    totalOutstanding + totalPaid > 0
      ? ((totalPaid / (totalOutstanding + totalPaid)) * 100).toFixed(1)
      : '0';

  const showGettingStarted = !loading && user?.role === 'admin' && invoices.length === 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-5 bg-background min-w-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back! Here&apos;s an overview of your collections performance.
        </p>
      </div>

      {canEnablePortal && pendingPortalUsers.length > 0 && (
        <Card className="border-border border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <CardTitle className="text-lg">{t('dashboard', 'enableCustomerPortalTitle')}</CardTitle>
                <CardDescription>{t('dashboard', 'enableCustomerPortalDescription')}</CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/settings/users">{t('dashboard', 'manageUsersLink')}</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {pendingPortalUsers.map((u) => (
                <li
                  key={u.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{u.name || u.email}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={async () => {
                      setEnablingId(u.id);
                      try {
                        const ok = await setUserPortalEnabledAction(u.id, true);
                        if (ok) setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, portalEnabled: true } : x)));
                      } finally {
                        setEnablingId(null);
                      }
                    }}
                    disabled={enablingId === u.id}
                  >
                    {enablingId === u.id ? t('dashboard', 'enabling') : t('dashboard', 'enablePortal')}
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {hasCreditWorkflowRole && myCreditQueueCount > 0 && (
        <Card className="border-border border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Credit applications needing your action</CardTitle>
              <CardDescription>
                {myCreditQueueCount} application{myCreditQueueCount !== 1 ? 's' : ''} assigned to you in the credit workflow. Review and move them to the next stage.
              </CardDescription>
            </div>
            <Button asChild>
              <Link href="/credit-applications?assignedToMe=1">Open Credit Applications</Link>
            </Button>
          </CardHeader>
        </Card>
      )}

      {showGettingStarted && (
        <Card className="border-border bg-muted/40">
          <CardHeader>
            <CardTitle>Getting started with LedgerHive</CardTitle>
            <CardDescription>
              You&apos;re logged in as the tenant administrator. Complete these steps to start
              seeing data on your dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="font-medium text-foreground mb-1">1. Add customers</p>
              <p className="text-sm text-muted-foreground mb-3">
                Create your debtors so you can raise invoices against them.
              </p>
              <Button size="sm" variant="outline" asChild>
                <Link href="/customers">Go to Customers</Link>
              </Button>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">2. Create invoices</p>
              <p className="text-sm text-muted-foreground mb-3">
                Issue invoices with due dates to start tracking receivables.
              </p>
              <Button size="sm" variant="outline" asChild>
                <Link href="/invoices">Go to Invoices</Link>
              </Button>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">3. Configure reminders</p>
              <p className="text-sm text-muted-foreground mb-3">
                Set up SMS, email, and WhatsApp reminders for overdue accounts.
              </p>
              <Button size="sm" variant="outline" asChild>
                <Link href="/collections/reminders">Reminder Settings</Link>
              </Button>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">4. Invite team members</p>
              <p className="text-sm text-muted-foreground mb-3">
                Add finance officers and collections agents to your tenant.
              </p>
              <Button size="sm" variant="outline" asChild>
                <Link href="/settings/users">Manage Users</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Outstanding Receivables</p>
                <p className="text-2xl font-bold text-foreground mt-2">
                  {formatAmountWithCode(totalOutstanding)}
                </p>
              </div>
              <DollarSign className="text-accent opacity-80" size={32} />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue Amount</p>
                <p className="text-2xl font-bold text-red-500 mt-2">
                  {formatAmountWithCode(overdueAmount)}
                </p>
              </div>
              <AlertCircle className="text-red-500 opacity-80" size={32} />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Collection Rate</p>
                <p className="text-2xl font-bold text-foreground mt-2">{collectionRate}%</p>
              </div>
              <TrendingUp className="text-green-500 opacity-80" size={32} />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Invoices</p>
                <p className="text-2xl font-bold text-foreground mt-2">{invoices.length}</p>
              </div>
              <Clock className="text-blue-500 opacity-80" size={32} />
            </div>
          </CardContent>
        </Card>
      </div>

      {agingData.length > 0 && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Aging Analysis</CardTitle>
            <CardDescription>Invoice aging distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={agingData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${formatAmountWithCode(value).replace(/\s+/g, ' ')}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {agingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatAmountWithCode(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Invoices</CardTitle>
            <CardDescription>Latest invoices awaiting collection</CardDescription>
          </div>
          <Button variant="outline" className="border-border gap-2" asChild>
            <Link href="/invoices">
              View All
              <ArrowRight size={16} />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Invoice</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Due Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">
                      No invoices yet
                    </td>
                  </tr>
                ) : (
                  recentInvoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4">
                        <Link href={`/invoices/${inv.id}`} className="font-medium text-accent hover:underline">
                          {inv.id}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-foreground">
                        {formatAmountWithCode(Number(inv.amount))}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{inv.dueDate}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            inv.status === 'Overdue'
                              ? 'bg-red-100 text-red-800'
                              : inv.status === 'Pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
