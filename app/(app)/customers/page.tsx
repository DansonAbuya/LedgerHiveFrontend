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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Plus, MoreVertical, Eye, Edit, Trash2, Upload } from 'lucide-react';
import { createCustomerAction, getCustomersAction, type Customer } from '@/lib/actions/customers';
import { isExcelFile, parseExcelCustomers } from '@/lib/excel-import';
import { useCurrency } from '@/lib/currency-context';

export default function CustomersPage() {
  const { formatAmountWithCode } = useCurrency();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    phone: '',
    creditLimit: '',
    paymentTermsDays: '',
    type: '',
  });
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    getCustomersAction(0, 500).then((res) => {
      setCustomers(res.content ?? []);
    }).finally(() => setLoading(false));
  }, []);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.email ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 p-4 sm:p-6 bg-background">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground mt-2">
            Manage your customer accounts and credit information
          </p>
        </div>
        <div className="flex gap-2">
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
                <DialogTitle>Import customers from Excel</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground mb-2">
                Upload an Excel (.xlsx) file with columns: <strong>Name</strong>, <strong>Email</strong>, <strong>Phone</strong>. First row can be headers.
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setImportOpen(false)}
                >
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
                      const rows = parseExcelCustomers(buffer);
                      if (rows.length === 0) {
                        setImportError('No valid rows found. Ensure a Name column.');
                        return;
                      }
                      let createdCount = 0;
                      for (const row of rows) {
                        const created = await createCustomerAction({
                          name: row.name,
                          email: row.email,
                          phone: row.phone,
                        });
                        if (created) {
                          createdCount += 1;
                          setCustomers((prev) => [...prev, created]);
                        }
                      }
                      setImportOpen(false);
                      setImportFile(null);
                      if (createdCount < rows.length) {
                        setImportError(`Created ${createdCount} of ${rows.length} customers. Some rows may have been skipped.`);
                      }
                    } catch (err) {
                      setImportError(err instanceof Error ? err.message : 'Failed to parse Excel file.');
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

          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
                <Plus size={18} />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add customer</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">Name</label>
                  <Input
                    value={addForm.name}
                    onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Customer name"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <Input
                    type="email"
                    value={addForm.email}
                    onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="customer@example.com"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">Phone</label>
                  <Input
                    value={addForm.phone}
                    onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="+2547..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                  onClick={async () => {
                    if (!addForm.name) return;
                    const created = await createCustomerAction({
                      name: addForm.name,
                      email: addForm.email || undefined,
                      phone: addForm.phone || undefined,
                    });
                    if (created) {
                      setCustomers((prev) => [...prev, created]);
                      setAddForm({ name: '', email: '', phone: '', creditLimit: '', paymentTermsDays: '', type: '' });
                      setAddOpen(false);
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

      {/* Filters & Search */}
      <Card className="border-border">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-input border-border"
              />
            </div>
            <select className="px-4 py-2 rounded-lg border border-border bg-card text-foreground hover:bg-muted transition-colors">
              <option>All Types</option>
              <option>Corporate</option>
              <option>Retail</option>
              <option>Insurer</option>
            </select>
            <select className="px-4 py-2 rounded-lg border border-border bg-card text-foreground hover:bg-muted transition-colors">
              <option>All Status</option>
              <option>Active</option>
              <option>Overdue</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
          <CardDescription>
            Total customers: {filteredCustomers.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Name
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Phone
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Type
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">
                    Credit Limit
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      Loading...
                    </td>
                  </tr>
                ) : filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="border-b border-border hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <span className="font-medium text-foreground">
                          {customer.name}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {customer.email ?? '—'}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {customer.phone ?? '—'}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {customer.type ?? '—'}
                      </td>
                      <td className="py-3 px-4 text-right text-foreground font-medium">
                        {customer.creditLimit != null ? formatAmountWithCode(customer.creditLimit) : '—'}
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
                                href={`/customers/${customer.id}`}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <Eye size={16} />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit size={16} className="mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 size={16} className="mr-2" />
                              Delete
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
                      No customers found
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
