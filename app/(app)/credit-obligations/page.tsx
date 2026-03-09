'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search } from 'lucide-react';
import {
  createCreditObligationAction,
  getCreditObligationsAction,
  getCreditAccountsAction,
  type CreditObligation,
  type CreditAccount,
} from '@/lib/actions/credit-issuance';
import { getCustomersAction, type Customer } from '@/lib/actions/customers';
import { useCurrency } from '@/lib/currency-context';

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  SETTLED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  OVERDUE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export default function CreditObligationsPage() {
  const { formatAmountWithCode } = useCurrency();
  const [obligations, setObligations] = useState<CreditObligation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [accounts, setAccounts] = useState<CreditAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    customerId: '',
    creditAccountId: '',
    amount: '',
    dueDate: '',
  });

  useEffect(() => {
    (async () => {
      try {
        const [oblRes, custRes, accRes] = await Promise.all([
          getCreditObligationsAction(0, 500),
          getCustomersAction(0, 500),
          getCreditAccountsAction(0, 500),
        ]);
        setObligations(oblRes.content ?? []);
        setCustomers(custRes.content ?? []);
        setAccounts(accRes.content ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = obligations.filter(
    (o) =>
      o.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.id?.toString().includes(searchTerm)
  );

  return (
    <div className="space-y-4 p-3 sm:p-5 bg-background min-w-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Credit Obligations</h1>
          <p className="text-muted-foreground mt-2">
            Track outstanding credit debts and obligations
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
              <Plus size={18} />
              New Obligation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Credit Obligation</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-foreground">Customer</label>
                <select
                  className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-foreground"
                  value={createForm.customerId}
                  onChange={(e) => setCreateForm((f) => ({ ...f, customerId: e.target.value }))}
                >
                  <option value="">Select customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Credit Account (optional)</label>
                <select
                  className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-foreground"
                  value={createForm.creditAccountId}
                  onChange={(e) => setCreateForm((f) => ({ ...f, creditAccountId: e.target.value }))}
                >
                  <option value="">None</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.customerName} — {formatAmountWithCode(a.creditLimit)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Amount</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={createForm.amount}
                  onChange={(e) => setCreateForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Due Date (optional)</label>
                <Input
                  type="date"
                  value={createForm.dueDate}
                  onChange={(e) => setCreateForm((f) => ({ ...f, dueDate: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
                onClick={async () => {
                  if (!createForm.customerId || !createForm.amount) return;
                  const created = await createCreditObligationAction({
                    customerId: createForm.customerId,
                    amount: Number(createForm.amount),
                    creditAccountId: createForm.creditAccountId || undefined,
                    dueDate: createForm.dueDate || undefined,
                  });
                  if (created) {
                    setObligations((prev) => [created, ...prev]);
                    setCreateForm({ customerId: '', creditAccountId: '', amount: '', dueDate: '' });
                    setCreateOpen(false);
                  }
                }}
              >
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Search by customer or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-input border-border"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Obligations</CardTitle>
          <CardDescription>{filtered.length} obligations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Customer</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Due Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">
                      Loading...
                    </td>
                  </tr>
                ) : filtered.length > 0 ? (
                  filtered.map((ob) => (
                    <tr key={ob.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium text-foreground">{ob.customerName}</td>
                      <td className="py-3 px-4 text-right">{formatAmountWithCode(ob.amount)}</td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {ob.dueDate ? new Date(ob.dueDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`rounded px-2 py-0.5 text-xs ${statusColors[ob.status] ?? 'bg-muted text-muted-foreground'}`}>
                          {ob.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">
                      No credit obligations found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
