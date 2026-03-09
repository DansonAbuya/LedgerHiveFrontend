'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Plus,
  MoreVertical,
  Eye,
  Download,
  Upload,
  Filter,
  Send,
} from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { createInvoiceAction, getInvoicesAction, sendInvoiceAction, type Invoice } from '@/lib/actions/invoices';
import { createPaymentLinkAction } from '@/lib/actions/payment-links';
import { getCustomerBalanceAction, getCustomersAction, type Customer, type CustomerBalance } from '@/lib/actions/customers';
import { isExcelFile, parseExcelInvoices } from '@/lib/excel-import';
import { toUserFriendlyMessage } from '@/lib/errors';
import { useCurrency } from '@/lib/currency-context';
import { useAlert } from '@/lib/alert-context';
import { useAuth } from '@/lib/auth-context';

const statusColors: Record<string, string> = {
  Paid: 'bg-green-100 text-green-800',
  Current: 'bg-blue-100 text-blue-800',
  Pending: 'bg-yellow-100 text-yellow-800',
  Overdue: 'bg-red-100 text-red-800',
};

export default function InvoicesPage() {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedBalance, setSelectedBalance] = useState<CustomerBalance | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [amountEdited, setAmountEdited] = useState(false);
  const [createForm, setCreateForm] = useState({
    customerId: '',
    amount: '',
    dueDate: '',
  });
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [sendingInvoiceId, setSendingInvoiceId] = useState<string | null>(null);
  const { formatAmountWithCode } = useCurrency();
  const isCustomer = user?.role === 'customer';

  useEffect(() => {
    (async () => {
      try {
        const invRes = await getInvoicesAction(0, 500);
        setInvoices(invRes.content ?? []);
        if (!isCustomer) {
          const custRes = await getCustomersAction(0, 500);
          setCustomers(custRes.content ?? []);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [isCustomer]);

  useEffect(() => {
    if (!createOpen) {
      setSelectedBalance(null);
      setAmountEdited(false);
      return;
    }
    if (!createForm.customerId) {
      setSelectedBalance(null);
      setAmountEdited(false);
      return;
    }
    let cancelled = false;
    setBalanceLoading(true);
    (async () => {
      try {
        const b = await getCustomerBalanceAction(createForm.customerId);
        if (!cancelled) setSelectedBalance(b);
      } finally {
        if (!cancelled) setBalanceLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [createOpen, createForm.customerId]);

  // Auto-fill amount when customer balance is known.
  // Rule: strictly remainingCredit only (when credit limit exists).
  useEffect(() => {
    if (!createOpen) return;
    if (!selectedBalance) return;
    if (amountEdited) return;
    const candidate =
      selectedBalance.remainingCredit != null ? Number(selectedBalance.remainingCredit) : NaN;
    if (!Number.isFinite(candidate) || candidate <= 0) return;
    setCreateForm((f) => ({ ...f, amount: String(candidate) }));
  }, [createOpen, selectedBalance, amountEdited]);

  const filteredInvoices = invoices.filter((inv) => {
    const matchSearch =
      inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(inv.customerId).toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'All' || inv.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
  const overduAmount = filteredInvoices
    .filter((inv) => inv.status === 'Overdue')
    .reduce((sum, inv) => sum + Number(inv.amount), 0);
  const collectionRate =
    totalAmount > 0
      ? Math.round(
          (filteredInvoices.filter((inv) => inv.status === 'Paid').reduce((sum, inv) => sum + Number(inv.amount), 0) /
            totalAmount) *
            100
        )
      : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <p className="text-muted-foreground">Loading invoices...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-3 sm:p-5 bg-background min-w-0">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Invoices</h1>
          <p className="text-muted-foreground mt-2">
            Track and manage all customer invoices
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Dialog open={importOpen} onOpenChange={(open) => { setImportOpen(open); setImportError(null); setImportFile(null); }}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="border-border gap-2"
              >
                <Upload size={18} />
                Import
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import invoices from Excel</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground mb-2">
                Upload an Excel (.xlsx) file with columns: <strong>CustomerId</strong>, <strong>Amount</strong>, <strong>DueDate</strong> (YYYY-MM-DD). First row can be headers.
              </p>
              <input
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-border file:bg-muted file:text-foreground"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setImportError(null);
                  if (!file) {
                    setImportFile(null);
                    return;
                  }
                  if (!isExcelFile(file)) {
                    setImportError('Please select an Excel file (.xlsx).');
                    setImportFile(null);
                    return;
                  }
                  setImportFile(file);
                }}
              />
              {importFile && <p className="text-sm text-muted-foreground">Selected: {importFile.name}</p>}
              {importError && (
                <p className="text-sm text-destructive">{importError}</p>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setImportOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                  disabled={!importFile || importing}
                  onClick={async () => {
                    if (!importFile) return;
                    setImportError(null);
                    setImporting(true);
                    try {
                      const buffer = await importFile.arrayBuffer();
                      const rows = parseExcelInvoices(buffer);
                      if (rows.length === 0) {
                        setImportError('No valid rows found. Ensure columns: CustomerId, DueDate. Amount is optional.');
                        return;
                      }
                      let createdCount = 0;
                      for (const row of rows) {
                        const amount =
                          row.amount != null
                            ? row.amount
                            : (await (async () => {
                                const b = await getCustomerBalanceAction(row.customerId);
                                const candidate =
                                  b?.remainingCredit != null ? Number(b.remainingCredit) : NaN;
                                return Number.isFinite(candidate) && candidate > 0 ? candidate : null;
                              })());
                        if (amount == null) continue;
                        const created = await createInvoiceAction({
                          customerId: row.customerId,
                          amount,
                          dueDate: row.dueDate,
                        });
                        if (created) {
                          createdCount += 1;
                          setInvoices((prev) => [...prev, created]);
                        }
                      }
                      setImportOpen(false);
                      setImportFile(null);
                      if (createdCount < rows.length) {
                        setImportError(`Created ${createdCount} of ${rows.length} invoices. Some rows may have been skipped.`);
                      }
                    } catch (err) {
                      setImportError(toUserFriendlyMessage(err, 'Could not import file. Please check the format and try again.'));
                    } finally {
                      setImporting(false);
                    }
                  }}
                >
                  {importing ? 'Importing…' : 'Import'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) { setSelectedBalance(null); setAmountEdited(false); } }}>
            <DialogTrigger asChild>
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
                <Plus size={18} />
                Create Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create invoice</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">Customer</label>
                  <select
                    className="w-full border border-border rounded-md bg-background px-3 py-2 text-sm"
                    value={createForm.customerId}
                    onChange={(e) => { setAmountEdited(false); setCreateForm((f) => ({ ...f, customerId: e.target.value })); }}
                  >
                    <option value="">Select a customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.email ?? c.id})
                      </option>
                    ))}
                  </select>
                  <div className="text-xs text-muted-foreground">
                    {balanceLoading && createForm.customerId ? 'Loading customer balance…' : null}
                    {!balanceLoading && selectedBalance ? (
                      <div className="mt-1 space-y-1">
                        <div>
                          Outstanding:{' '}
                          <span className="font-medium">
                            {formatAmountWithCode(Number(selectedBalance.outstanding))}
                          </span>
                        </div>
                        {selectedBalance.creditLimit != null ? (
                          <div>
                            Remaining credit:{' '}
                            <span className="font-medium">
                              {formatAmountWithCode(Number(selectedBalance.remainingCredit ?? 0))}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">Amount</label>
                  <Input
                    type="number"
                    min="0"
                    value={createForm.amount}
                    onChange={(e) => { setAmountEdited(true); setCreateForm((f) => ({ ...f, amount: e.target.value })); }}
                    placeholder="1000"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">Due date</label>
                  <Input
                    type="date"
                    value={createForm.dueDate}
                    onChange={(e) => setCreateForm((f) => ({ ...f, dueDate: e.target.value }))}
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
                    if (!createForm.customerId || !createForm.amount || !createForm.dueDate) return;
                    const created = await createInvoiceAction({
                      customerId: createForm.customerId,
                      amount: Number(createForm.amount),
                      dueDate: createForm.dueDate,
                    });
                    if (created) {
                      setInvoices((prev) => [...prev, created]);
                      setCreateForm({ customerId: '', amount: '', dueDate: '' });
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
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase font-semibold">
                Total Invoices
              </p>
              <p className="text-2xl font-bold text-foreground">
                {formatAmountWithCode(totalAmount)}
              </p>
              <p className="text-xs text-muted-foreground">
                {filteredInvoices.length} invoices
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase font-semibold">
                Overdue Amount
              </p>
              <p className="text-2xl font-bold text-red-600">
                {formatAmountWithCode(overduAmount)}
              </p>
              <p className="text-xs text-muted-foreground">
                Requires immediate attention
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase font-semibold">
                Collection Rate
              </p>
              <p className="text-2xl font-bold text-accent">
                {collectionRate}%
              </p>
              <p className="text-xs text-muted-foreground">
                {filteredInvoices.filter((inv) => inv.status === 'Paid').length} paid
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="border-border">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Search invoices by ID or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-input border-border"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="border-border gap-2 whitespace-nowrap"
                >
                  <Filter size={18} />
                  {filterStatus}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {['All', 'Paid', 'Current', 'Pending', 'Overdue'].map((status) => (
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

      {/* Invoices Table */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Invoice List</CardTitle>
          <CardDescription>
            {filteredInvoices.length} invoices found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Invoice #
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Customer
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">
                    Amount
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Due Date
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Status
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="border-b border-border hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className="font-medium text-accent hover:underline"
                        >
                          {invoice.id}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        <Link
                          href={`/customers/${invoice.customerId}`}
                          className="hover:text-accent hover:underline"
                        >
                          {invoice.customerId}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-foreground">
                        {formatAmountWithCode(Number(invoice.amount))}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {invoice.dueDate}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            statusColors[invoice.status] ?? 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {invoice.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreVertical size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/invoices/${invoice.id}`}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <Eye size={16} />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={async () => {
                                const token = await createPaymentLinkAction(invoice.id);
                                if (!token) return;
                                const url = `${window.location.origin}/pay/${token}`;
                                try {
                                  await navigator.clipboard.writeText(url);
                                  // optional: toast could be added here
                                } catch {
                                  showAlert(url, 'Payment link');
                                }
                              }}
                            >
                              <Download size={16} className="mr-2" />
                              Copy Payment Link
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={async () => {
                                setSendingInvoiceId(invoice.id);
                                try {
                                  await sendInvoiceAction(invoice.id);
                                  // success - optionally toast
                                } catch (e) {
                                  showAlert(toUserFriendlyMessage(e, 'Could not send the invoice. Please try again.'), 'Send invoice');
                                } finally {
                                  setSendingInvoiceId(null);
                                }
                              }}
                              disabled={sendingInvoiceId === invoice.id}
                            >
                              <Send size={16} className="mr-2" />
                              {sendingInvoiceId === invoice.id ? 'Sending…' : 'Send Invoice'}
                            </DropdownMenuItem>
                            <DropdownMenuItem disabled>
                              <Download size={16} className="mr-2" />
                              Download PDF
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No invoices found matching your filters
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
