'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Edit, Phone, Mail, MapPin } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Mock customer data
const mockCustomer = {
  id: '1',
  name: 'Acme Corporation',
  email: 'contact@acme.com',
  phone: '(555) 123-4567',
  address: '123 Business Street, Suite 100, New York, NY 10001',
  type: 'Corporate',
  creditLimit: 50000,
  outstandingBalance: 12500,
  totalRevenue: 150000,
  lastPaymentDate: '2024-02-28',
  lastPaymentAmount: 8500,
  status: 'Active',
  paymentTerms: 'Net 30',
  yearEstablished: 2015,
};

const paymentHistory = [
  { month: 'Jan', amount: 8500 },
  { month: 'Feb', amount: 7200 },
  { month: 'Mar', amount: 9100 },
  { month: 'Apr', amount: 8800 },
  { month: 'May', amount: 10200 },
  { month: 'Jun', amount: 8500 },
];

const recentTransactions = [
  {
    id: 'TXN-001',
    date: '2024-03-10',
    type: 'Payment',
    amount: '-$8,500',
    balance: '$12,500',
  },
  {
    id: 'TXN-002',
    date: '2024-02-28',
    type: 'Invoice',
    amount: '+$7,200',
    balance: '$21,000',
  },
  {
    id: 'TXN-003',
    date: '2024-02-15',
    type: 'Payment',
    amount: '-$7,200',
    balance: '$13,800',
  },
];

export default function CustomerDetailPage() {
  const params = useParams();
  const customerId = params.id;

  return (
    <div className="space-y-6 p-6 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/customers">
          <Button variant="ghost" className="gap-2" size="sm">
            <ArrowLeft size={16} />
            Back to Customers
          </Button>
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" className="border-border gap-2" size="sm">
            <Download size={16} />
            Export
          </Button>
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2" size="sm">
            <Edit size={16} />
            Edit
          </Button>
        </div>
      </div>

      {/* Customer Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {mockCustomer.name}
                </h1>
                <p className="text-muted-foreground mt-2">
                  {mockCustomer.type} · Est. {mockCustomer.yearEstablished}
                </p>
                <div className="flex flex-wrap gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-muted-foreground" />
                    <a
                      href={`mailto:${mockCustomer.email}`}
                      className="text-accent hover:underline"
                    >
                      {mockCustomer.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-muted-foreground" />
                    <a
                      href={`tel:${mockCustomer.phone}`}
                      className="text-accent hover:underline"
                    >
                      {mockCustomer.phone}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <MapPin size={16} className="text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {mockCustomer.address}
                  </p>
                </div>
              </div>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  mockCustomer.status === 'Active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {mockCustomer.status}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="space-y-4">
          <Card className="border-border">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase font-semibold">
                  Outstanding Balance
                </p>
                <p className="text-2xl font-bold text-foreground">
                  ${mockCustomer.outstandingBalance.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase font-semibold">
                  Credit Limit
                </p>
                <p className="text-2xl font-bold text-foreground">
                  ${mockCustomer.creditLimit.toLocaleString()}
                </p>
                <p className="text-xs text-accent mt-1">
                  {(
                    ((mockCustomer.creditLimit - mockCustomer.outstandingBalance) /
                      mockCustomer.creditLimit) *
                    100
                  ).toFixed(1)}% available
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase font-semibold">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold text-foreground">
                  ${mockCustomer.totalRevenue.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment History Chart */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            Monthly payment amounts over the last 6 months
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={paymentHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: `1px solid var(--border)`,
                }}
                formatter={(value) => `$${value.toLocaleString()}`}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="var(--accent)"
                strokeWidth={2}
                dot={{ fill: 'var(--accent)', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            Latest payment and invoice activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentTransactions.map((txn) => (
              <div
                key={txn.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div>
                  <p className="font-medium text-foreground">{txn.type}</p>
                  <p className="text-xs text-muted-foreground">{txn.date}</p>
                </div>
                <div className="text-right">
                  <p
                    className={`font-semibold ${
                      txn.amount.includes('-')
                        ? 'text-accent'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {txn.amount}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
