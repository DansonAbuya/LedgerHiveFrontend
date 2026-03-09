'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getAnalyticsAction,
  type AnalyticsSection,
  type AnalyticsOverviewData,
  type AnalyticsAgingBucket,
  type AnalyticsPaymentsTrendData,
  type AnalyticsCreditFunnelData,
  type AnalyticsBestCustomersData,
  type AnalyticsCustomerAcquisitionData,
  type AnalyticsRemindersData,
} from '@/lib/actions/analytics';
import { useCurrency } from '@/lib/currency-context';
import { useAuth } from '@/lib/auth-context';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { DollarSign, AlertCircle, TrendingUp, FileText } from 'lucide-react';

const AGING_COLORS: Record<string, string> = {
  current: 'hsl(var(--chart-1))',
  '1-30': 'hsl(var(--chart-2))',
  '31-60': 'hsl(var(--chart-3))',
  '61-90': 'hsl(var(--chart-4))',
  '90+': 'hsl(var(--chart-5))',
};

export default function AnalyticsPage() {
  const [sections, setSections] = useState<AnalyticsSection[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { formatAmountWithCode } = useCurrency();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getAnalyticsAction();
        if (!cancelled) setSections(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const staffRoles = ['admin', 'operation_manager', 'collateral_manager', 'finance_officer', 'manager'];
  const canView = user?.role && (user.role === 'admin' || staffRoles.includes(user.role));

  if (!user) {
    return (
      <div className="p-4 sm:p-5">
        <p className="text-muted-foreground">Please sign in to view analytics.</p>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="p-4 sm:p-5">
        <p className="text-muted-foreground">You do not have access to analytics.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-3 sm:p-5 bg-background min-w-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Key metrics and trends. Only sections applicable to your role are shown.
        </p>
      </div>

      {sections.length === 0 ? (
        <Card className="border-border">
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center py-8">No analytics data available.</p>
          </CardContent>
        </Card>
      ) : (
        sections.map((section) => (
          <SectionBlock key={section.id} section={section} formatAmountWithCode={formatAmountWithCode} />
        ))
      )}
    </div>
  );
}

function SectionBlock({
  section,
  formatAmountWithCode,
}: {
  section: AnalyticsSection;
  formatAmountWithCode: (n: number) => string;
}) {
  if (section.id === 'overview') {
    const d = section.data as AnalyticsOverviewData;
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle>{section.name}</CardTitle>
          <CardDescription>{section.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="text-sm text-muted-foreground">Outstanding</p>
                <p className="text-xl font-bold text-foreground mt-1">{formatAmountWithCode(d.totalOutstanding ?? 0)}</p>
              </div>
              <DollarSign className="text-muted-foreground h-8 w-8" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-400 mt-1">
                  {formatAmountWithCode(d.overdueAmount ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground">{d.overdueCount ?? 0} invoices</p>
              </div>
              <AlertCircle className="text-red-500 h-8 w-8" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="text-sm text-muted-foreground">Collection rate</p>
                <p className="text-xl font-bold text-foreground mt-1">{d.collectionRatePercent?.toFixed(1) ?? 0}%</p>
              </div>
              <TrendingUp className="text-green-600 dark:text-green-400 h-8 w-8" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="text-sm text-muted-foreground">Total invoices</p>
                <p className="text-xl font-bold text-foreground mt-1">{d.invoiceCount ?? 0}</p>
              </div>
              <FileText className="text-muted-foreground h-8 w-8" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (section.id === 'collections') {
    const data = section.data as { agingBuckets: AnalyticsAgingBucket[] };
    const buckets = data?.agingBuckets ?? [];
    const chartData = buckets.map((b) => ({
      name: b.bucket === 'current' ? 'Current' : b.bucket + ' days',
      value: b.amount,
      count: b.count,
      fill: AGING_COLORS[b.bucket] ?? 'hsl(var(--chart-1))',
    })).filter((d) => d.value > 0);
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle>{section.name}</CardTitle>
          <CardDescription>{section.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No aging data.</p>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, value }) => `${name}: ${formatAmountWithCode(value)}`}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatAmountWithCode(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (section.id === 'payments') {
    const data = section.data as AnalyticsPaymentsTrendData;
    const months = data?.months ?? [];
    const chartData = months.map((m) => ({
      period: m.period,
      amount: m.amount ?? 0,
      count: m.count ?? 0,
      label: formatAmountWithCode(m.amount ?? 0),
    }));
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle>{section.name}</CardTitle>
          <CardDescription>{section.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No payment trend data.</p>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(0)}k` : v)} />
                  <Tooltip formatter={(value: number) => [formatAmountWithCode(value), 'Amount']} labelFormatter={(p) => `Period: ${p}`} />
                  <Bar dataKey="amount" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} name="Collected" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (section.id === 'credit') {
    const data = section.data as AnalyticsCreditFunnelData;
    const stages = data?.stages ?? [];
    const total = data?.totalApplications ?? 0;
    const chartData = stages.map((s) => ({ stage: s.stage, count: s.count }));
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle>{section.name}</CardTitle>
          <CardDescription>{section.description} — Total: {total} applications</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No credit application data.</p>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="stage" width={70} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: number) => [value, 'Count']} />
                  <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} name="Applications" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (section.id === 'best-customers') {
    const data = section.data as AnalyticsBestCustomersData;
    const customers = data?.customers ?? [];
    const chartData = customers.map((c) => ({ name: c.customerName?.slice(0, 20) ?? `#${c.rank}`, paid: c.totalPaid ?? 0, rate: c.paymentRatePercent ?? 0 }));
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle>{section.name}</CardTitle>
          <CardDescription>{section.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {customers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No customer payment data yet.</p>
          ) : (
            <>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 60, left: 90, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(0)}k` : v)} />
                    <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(value: number, name: string) => [name === 'paid' ? formatAmountWithCode(value) : `${value.toFixed(1)}%`, name === 'paid' ? 'Total paid' : 'Payment rate']} />
                    <Bar dataKey="paid" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} name="Total paid" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 font-medium text-foreground">#</th>
                      <th className="text-left py-2 font-medium text-foreground">Customer</th>
                      <th className="text-right py-2 font-medium text-foreground">Total paid</th>
                      <th className="text-right py-2 font-medium text-foreground">Invoiced</th>
                      <th className="text-right py-2 font-medium text-foreground">Rate %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c) => (
                      <tr key={c.customerId} className="border-b border-border/50">
                        <td className="py-2 text-muted-foreground">{c.rank}</td>
                        <td className="py-2 font-medium text-foreground">{c.customerName}</td>
                        <td className="py-2 text-right text-foreground">{formatAmountWithCode(c.totalPaid ?? 0)}</td>
                        <td className="py-2 text-right text-muted-foreground">{formatAmountWithCode(c.totalInvoiced ?? 0)}</td>
                        <td className="py-2 text-right text-foreground">{(c.paymentRatePercent ?? 0).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  if (section.id === 'customer-acquisition') {
    const data = section.data as AnalyticsCustomerAcquisitionData;
    const acquisition = data?.acquisitionByMonth ?? [];
    const distribution = data?.amountDistribution ?? [];
    const total = data?.totalCustomers ?? 0;
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle>{section.name}</CardTitle>
          <CardDescription>{section.description} — Total customers: {total}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3">New customers by month</h4>
            {acquisition.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4">No acquisition data.</p>
            ) : (
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={acquisition.map((a) => ({ period: a.period, newCustomers: a.newCustomers }))} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value: number) => [value, 'New customers']} />
                    <Bar dataKey="newCustomers" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="New customers" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3">Distribution by total invoiced amount</h4>
            {distribution.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4">No distribution data.</p>
            ) : (
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={distribution.filter((d) => d.count > 0).map((d) => ({ bucket: d.bucket, count: d.count }))} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="bucket" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value: number) => [value, 'Customers']} />
                    <Bar dataKey="count" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} name="Customers" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (section.id === 'reminders') {
    const data = section.data as AnalyticsRemindersData;
    const byChannel = data?.byChannel ?? [];
    const sentByMonth = data?.sentByMonth ?? [];
    const totalSent = data?.totalSent ?? 0;
    const totalPending = data?.totalPending ?? 0;
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle>{section.name}</CardTitle>
          <CardDescription>{section.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground">Reminders sent</p>
              <p className="text-2xl font-bold text-foreground mt-1">{totalSent}</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground">Reminders pending</p>
              <p className="text-2xl font-bold text-foreground mt-1">{totalPending}</p>
            </div>
          </div>
          {byChannel.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3">By channel</h4>
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byChannel.map((c) => ({ channel: c.channel, sent: c.sent, pending: c.pending }))} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="channel" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="sent" stackId="a" fill="hsl(var(--chart-1))" name="Sent" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="pending" stackId="a" fill="hsl(var(--chart-4))" name="Pending" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          {sentByMonth.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3">Sent by month</h4>
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sentByMonth.map((m) => ({ period: m.period, sentCount: m.sentCount }))} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value: number) => [value, 'Sent']} />
                    <Bar dataKey="sentCount" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Sent" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          {byChannel.length === 0 && sentByMonth.length === 0 && totalSent === 0 && totalPending === 0 && (
            <p className="text-muted-foreground text-center py-6">No reminder data yet.</p>
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
}
