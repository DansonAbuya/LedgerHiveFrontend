'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search } from 'lucide-react';
import {
  createCreditAccountAction,
  getCreditAccountsAction,
  type CreditAccount,
} from '@/lib/actions/credit-issuance';
import { formatRepaymentLabel } from '@/lib/credit-utils';
import { getCustomersAction, type Customer } from '@/lib/actions/customers';
import { useCurrency } from '@/lib/currency-context';

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  SUSPENDED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  CLOSED: 'bg-muted text-muted-foreground',
};

export default function CreditAccountsPage() {
  const { formatAmountWithCode } = useCurrency();
  const [accounts, setAccounts] = useState<CreditAccount[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    customerId: '',
    creditLimit: '',
  });

  useEffect(() => {
    (async () => {
      try {
        const [accRes, custRes] = await Promise.all([
          getCreditAccountsAction(0, 500),
          getCustomersAction(0, 500),
        ]);
        setAccounts(accRes.content ?? []);
        setCustomers(custRes.content ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = accounts.filter(
    (a) =>
      a.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.id?.toString().includes(searchTerm)
  );

  return (
    <div className="space-y-4 p-3 sm:p-5 bg-background min-w-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Credit Accounts</h1>
          <p className="text-muted-foreground mt-2">
            Manage approved credit accounts and limits
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
              <Plus size={18} />
              New Credit Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Credit Account</DialogTitle>
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
                <label className="text-sm font-medium text-foreground">Credit Limit</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={createForm.creditLimit}
                  onChange={(e) => setCreateForm((f) => ({ ...f, creditLimit: e.target.value }))}
                  placeholder="0.00"
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
                  if (!createForm.customerId || !createForm.creditLimit) return;
                  const created = await createCreditAccountAction({
                    customerId: createForm.customerId,
                    creditLimit: Number(createForm.creditLimit),
                  });
                  if (created) {
                    setAccounts((prev) => [created, ...prev]);
                    setCreateForm({ customerId: '', creditLimit: '' });
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
          <CardTitle>Credit Accounts</CardTitle>
          <CardDescription>{filtered.length} accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Customer</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">Credit Limit</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Repayment</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">Utilized</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">Remaining</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      Loading...
                    </td>
                  </tr>
                ) : filtered.length > 0 ? (
                  filtered.map((acc) => (
                    <tr key={acc.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium text-foreground">{acc.customerName}</td>
                      <td className="py-3 px-4 text-right">{formatAmountWithCode(acc.creditLimit)}</td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {formatRepaymentLabel(acc.repaymentType, acc.numberOfInstallments)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {acc.utilizedAmount != null ? formatAmountWithCode(acc.utilizedAmount) : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-green-600 dark:text-green-400">
                        {acc.remainingCredit != null ? formatAmountWithCode(acc.remainingCredit) : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`rounded px-2 py-0.5 text-xs ${statusColors[acc.status] ?? 'bg-muted text-muted-foreground'}`}>
                          {acc.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      No credit accounts found
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
