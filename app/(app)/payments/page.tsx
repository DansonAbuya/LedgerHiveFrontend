'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Plus, MoreVertical, Eye, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { getPaymentsAction, recordPaymentAction, type Payment } from '@/lib/actions/payments';
import { getInvoicesAction, type Invoice } from '@/lib/actions/invoices';
import { useCurrency } from '@/lib/currency-context';
import { useAuth } from '@/lib/auth-context';

const statusColors: Record<string, string> = {
  Completed: 'bg-green-100 text-green-800',
  Reconciled: 'bg-green-100 text-green-800',
  Cleared: 'bg-blue-100 text-blue-800',
  Processing: 'bg-blue-100 text-blue-800',
  Pending: 'bg-yellow-100 text-yellow-800',
  Failed: 'bg-red-100 text-red-800',
};

export default function PaymentsPage() {
  const { user } = useAuth();
  const { formatAmountWithCode } = useCurrency();
  const isCustomer = user?.role === 'customer';
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [createOpen, setCreateOpen] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [form, setForm] = useState({
    invoiceId: '',
    amount: '',
    reference: '',
  });

  const loadPayments = async () => {
    setLoading(true);
    try {
      const res = await getPaymentsAction(0, 500);
      setPayments(res.content ?? []);
    } catch {
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await loadPayments();
      if (!isCustomer) {
        const inv = await getInvoicesAction(0, 200);
        setInvoices(inv.content ?? []);
      }
    })();
  }, [isCustomer]);

  const filtered = payments.filter((p) => {
    const matchSearch =
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.reference ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.invoiceId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'All' || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalProcessed = filtered
    .filter((p) => p.status === 'Completed' || p.status === 'Reconciled' || p.status === 'Cleared')
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const totalPending = filtered
    .filter((p) => p.status === 'Pending')
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const avgPayment =
    filtered.length > 0
      ? (
          filtered.reduce((sum, p) => sum + Number(p.amount), 0) / filtered.length
        ).toFixed(2)
      : '0';

  return (
    <div className="space-y-4 p-3 sm:p-5 bg-background min-w-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payments</h1>
          <p className="text-muted-foreground mt-2">
            Record and track payment transactions
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
              <Plus size={18} />
              Record Payment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record payment</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Invoice</label>
                <select
                  className="w-full border border-border rounded-md bg-background px-3 py-2 text-sm"
                  value={form.invoiceId}
                  onChange={(e) => setForm((f) => ({ ...f, invoiceId: e.target.value }))}
                >
                  <option value="">Select invoice</option>
                  {invoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.id} - {inv.dueDate} - {formatAmountWithCode(Number(inv.amount))}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Amount</label>
                <Input
                  type="number"
                  min="0"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Reference</label>
                <Input
                  value={form.reference}
                  onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
                  placeholder="MPESA/Bank ref"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
                onClick={async () => {
                  if (!form.invoiceId || !form.amount) return;
                  const created = await recordPaymentAction({
                    invoiceId: form.invoiceId,
                    amount: Number(form.amount),
                    status: 'Completed',
                    reference: form.reference || undefined,
                  });
                  if (created) {
                    setPayments((prev) => [...prev, created]);
                    setForm({ invoiceId: '', amount: '', reference: '' });
                    setCreateOpen(false);
                  }
                }}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Completed</p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  {formatAmountWithCode(totalProcessed)}
                </p>
              </div>
              <TrendingUp className="text-green-600 opacity-80" size={32} />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Pending</p>
                <p className="text-2xl font-bold text-yellow-600 mt-2">
                  {formatAmountWithCode(totalPending)}
                </p>
              </div>
              <AlertCircle className="text-yellow-600 opacity-80" size={32} />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Average Payment</p>
                <p className="text-2xl font-bold text-accent mt-2">{formatAmountWithCode(Number(avgPayment))}</p>
              </div>
              <DollarSign className="text-accent opacity-80" size={32} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={18}
              />
              <Input
                placeholder="Search by payment ID, invoice, or reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-input border-border"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-border whitespace-nowrap">
                  {filterStatus}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {['All', 'Completed', 'Reconciled', 'Cleared', 'Pending'].map((status) => (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => setFilterStatus(status)}
                  >
                    {status}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Payment Transactions</CardTitle>
          <CardDescription>{filtered.length} payments found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Payment ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Invoice ID</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Reference</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Status</th>
                  <th className="text-center py-3 px-4 font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      Loading...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      No payments found
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-border hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-medium text-foreground">{p.id}</td>
                      <td className="py-3 px-4 text-muted-foreground">{p.invoiceId}</td>
                      <td className="py-3 px-4 text-right font-semibold text-foreground">
                        {formatAmountWithCode(Number(p.amount))}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{p.reference ?? '—'}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            statusColors[p.status] ?? 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye size={16} className="mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>Print Receipt</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
