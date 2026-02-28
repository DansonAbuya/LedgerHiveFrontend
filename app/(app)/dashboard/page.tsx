'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, AlertCircle, Clock, DollarSign, ArrowRight } from 'lucide-react';
import { getInvoicesAction } from '@/lib/actions/invoices';
import type { Invoice } from '@/lib/actions/invoices';
import { useAuth } from '@/lib/auth-context';
import { useCurrency } from '@/lib/currency-context';

const COLORS = ['#00C49F', '#FFA500', '#FF8042', '#DC2626'];

export default function DashboardPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { formatAmountWithCode } = useCurrency();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [invRes] = await Promise.all([
          getInvoicesAction(0, 100),
        ]);
        if (!cancelled) {
          setInvoices(invRes.content ?? []);
        }
      } catch {
        if (!cancelled) setInvoices([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

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
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 bg-background">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back! Here&apos;s an overview of your collections performance.
        </p>
      </div>

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
