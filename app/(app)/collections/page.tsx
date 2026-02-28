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
  CheckCircle,
  Phone,
  Mail,
  AlertCircle,
  Calendar,
  User,
  Clock,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { getInvoicesAction, type Invoice } from '@/lib/actions/invoices';
import { getCustomersAction, type Customer } from '@/lib/actions/customers';
import { useCurrency } from '@/lib/currency-context';

const priorityColors = {
  Critical: 'bg-red-100 text-red-800 border border-red-200',
  High: 'bg-orange-100 text-orange-800 border border-orange-200',
  Medium: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  Low: 'bg-green-100 text-green-800 border border-green-200',
};

const statusColors = {
  'In Progress': 'bg-blue-100 text-blue-800',
  Pending: 'bg-yellow-100 text-yellow-800',
  Completed: 'bg-green-100 text-green-800',
};

type CollectionTask = {
  id: string;
  customerName: string;
  customerId: string;
  invoiceId: string;
  amount: number;
  priority: keyof typeof priorityColors;
  daysOverdue: number;
  status: keyof typeof statusColors;
  nextAction: string;
  dueDate: string;
};

export default function CollectionsPage() {
  const { formatAmountWithCode } = useCurrency();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('All');
  const [tasks, setTasks] = useState<CollectionTask[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<CollectionTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [invoicesRes, customersRes] = await Promise.all([
          getInvoicesAction(0, 500),
          getCustomersAction(0, 500),
        ]);
        if (cancelled) return;
        const invoices: Invoice[] = invoicesRes.content ?? [];
        const customers: Customer[] = customersRes.content ?? [];
        const customerMap = new Map(customers.map((c) => [c.id, c]));

        const now = new Date();
        const derived: CollectionTask[] = invoices
          .filter((inv) => inv.status !== 'Paid')
          .map((inv) => {
            const due = new Date(inv.dueDate);
            const daysOverdue = Math.floor(
              (now.getTime() - due.getTime()) / (24 * 60 * 60 * 1000),
            );
            const isOverdue = daysOverdue > 0;
            // Priority based on days overdue and amount
            let priority: keyof typeof priorityColors = 'Low';
            if (daysOverdue > 60 || Number(inv.amount) > 50000) priority = 'Critical';
            else if (daysOverdue > 30) priority = 'High';
            else if (daysOverdue > 7) priority = 'Medium';
            const customer = customerMap.get(inv.customerId) ?? null;
            const status: keyof typeof statusColors =
              inv.status === 'Overdue' || isOverdue ? 'Pending' : 'In Progress';
            const nextAction = isOverdue ? 'Call or send reminder' : 'Monitor';
            return {
              id: inv.id,
              customerName: customer?.name ?? inv.customerId,
              customerId: inv.customerId,
              invoiceId: inv.id,
              amount: Number(inv.amount),
              priority,
              daysOverdue: Math.max(daysOverdue, 0),
              status,
              nextAction,
              dueDate: inv.dueDate,
            };
          })
          .filter((t) => t.daysOverdue > 0); // collections queue = overdue only

        setTasks(derived);
        setFilteredTasks(derived);
      } catch {
        if (!cancelled) {
          setTasks([]);
          setFilteredTasks([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    filterTasks(value, filterPriority);
  };

  const handlePriorityFilter = (priority: string) => {
    setFilterPriority(priority);
    filterTasks(searchTerm, priority);
  };

  const filterTasks = (search: string, priority: string) => {
    const lower = search.toLowerCase();
    let filtered = tasks.filter(
      (task) =>
        task.customerName.toLowerCase().includes(lower) ||
        task.invoiceId.toLowerCase().includes(lower),
    );

    if (priority !== 'All') {
      filtered = filtered.filter((t) => t.priority === (priority as keyof typeof priorityColors));
    }

    setFilteredTasks(filtered);
  };

  const criticalCount = tasks.filter((t) => t.priority === 'Critical').length;
  const totalAmount = tasks.reduce((sum, t) => sum + t.amount, 0);

  const funnelData = [
    { stage: 'Total Overdue', count: tasks.length },
    { stage: 'Collected', count: 0 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <p className="text-muted-foreground">Loading collections queue...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Collections</h1>
          <p className="text-muted-foreground mt-2">
            Manage collection activities and track progress
          </p>
        </div>
        <Button className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
          <Plus size={18} />
          New Task
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase font-semibold">
                Open Tasks
              </p>
              <p className="text-2xl font-bold text-foreground">
                {tasks.length}
              </p>
              <p className="text-xs text-red-600">
                {criticalCount} critical
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase font-semibold">
                Total at Risk
              </p>
              <p className="text-2xl font-bold text-red-600">
                {formatAmountWithCode(totalAmount)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase font-semibold">
                Avg Days Overdue
              </p>
              <p className="text-2xl font-bold text-accent">
                {tasks.length > 0
                  ? (tasks.reduce((sum, t) => sum + t.daysOverdue, 0) / tasks.length).toFixed(0)
                  : '0'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase font-semibold">
                Assigned Agents
              </p>
              <p className="text-2xl font-bold text-foreground">
                3
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Collection Funnel */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Collections Funnel</CardTitle>
          <CardDescription>
            Progress through collection stages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={funnelData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" stroke="var(--muted-foreground)" />
              <YAxis dataKey="stage" type="category" stroke="var(--muted-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: `1px solid var(--border)`,
                }}
              />
              <Bar dataKey="count" fill="var(--accent)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Filters & Search */}
      <Card className="border-border">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Search by customer or invoice..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 bg-input border-border"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="border-border whitespace-nowrap"
                >
                  Priority: {filterPriority}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {['All', 'Critical', 'High', 'Medium', 'Low'].map((priority) => (
                  <DropdownMenuItem
                    key={priority}
                    onClick={() => handlePriorityFilter(priority)}
                  >
                    {priority}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Collection Tasks</CardTitle>
          <CardDescription>
            {filteredTasks.length} active collection tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">
                        Customer
                      </p>
                      <Link
                        href={`/customers/1`}
                        className="font-semibold text-foreground hover:text-accent"
                      >
                        {task.customer}
                      </Link>
                      <p className="text-sm text-muted-foreground">{task.invoice}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">
                        Amount & Days
                      </p>
                      <p className="font-semibold text-foreground">
                        {formatAmountWithCode(task.amount)}
                      </p>
                      <p className="text-sm text-red-600">
                        {task.daysOverdue}d overdue
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">
                        Assigned Agent
                      </p>
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-muted-foreground" />
                        <p className="text-sm text-foreground">{task.assignedTo}</p>
                      </div>
                    </div>
                    <div className="flex items-end justify-between lg:flex-col lg:justify-start gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">
                          Priority & Status
                        </p>
                        <div className="flex gap-2">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                              priorityColors[task.priority as keyof typeof priorityColors]
                            }`}
                          >
                            {task.priority}
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                              statusColors[task.status as keyof typeof statusColors]
                            }`}
                          >
                            {task.status}
                          </span>
                        </div>
                      </div>
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
                          <DropdownMenuItem>
                            <Phone size={16} className="mr-2" />
                            Log Call
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail size={16} className="mr-2" />
                            Send Email
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <CheckCircle size={16} className="mr-2" />
                            Mark Complete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No collection tasks found matching your filters
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
