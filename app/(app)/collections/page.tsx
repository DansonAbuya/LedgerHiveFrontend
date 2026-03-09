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
  User,
  Bell,
  Send,
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
import { getCollectionsOverdueAction, type CollectionTask } from '@/lib/actions/collections';
import { sendInvoiceAction } from '@/lib/actions/invoices';
import { toUserFriendlyMessage } from '@/lib/errors';
import { useCurrency } from '@/lib/currency-context';
import { useAlert } from '@/lib/alert-context';

const priorityColors: Record<string, string> = {
  Critical: 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/30 dark:text-red-400',
  High: 'bg-orange-100 text-orange-800 border border-orange-200 dark:bg-orange-900/30 dark:text-orange-400',
  Medium: 'bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400',
  Low: 'bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-400',
};

const statusColors: Record<string, string> = {
  'In Progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  Completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

const sourceLabels: Record<string, string> = {
  INVOICE: 'Invoice',
  CREDIT_OBLIGATION: 'Credit Obligation',
};

export default function CollectionsPage() {
  const { formatAmountWithCode } = useCurrency();
  const { showAlert } = useAlert();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('All');
  const [tasks, setTasks] = useState<CollectionTask[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<CollectionTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingTaskId, setSendingTaskId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getCollectionsOverdueAction();
        if (!cancelled) {
          setTasks(data);
          setFilteredTasks(data);
        }
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
    return () => { cancelled = true; };
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
        task.sourceId.toLowerCase().includes(lower) ||
        task.id.toLowerCase().includes(lower),
    );
    if (priority !== 'All') {
      filtered = filtered.filter((t) => t.priority === priority);
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
    <div className="space-y-4 p-3 sm:p-5 bg-background min-w-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Collections</h1>
          <p className="text-muted-foreground mt-2">
            Track credit from issuance through collection. Overdue invoices and credit obligations.
          </p>
        </div>
        <Button className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
          <Plus size={18} />
          New Task
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase font-semibold">Open Tasks</p>
              <p className="text-2xl font-bold text-foreground">{tasks.length}</p>
              <p className="text-xs text-red-600">{criticalCount} critical</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase font-semibold">Total at Risk</p>
              <p className="text-2xl font-bold text-red-600">{formatAmountWithCode(totalAmount)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase font-semibold">Avg Days Overdue</p>
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
              <p className="text-xs text-muted-foreground uppercase font-semibold">Assigned Agents</p>
              <p className="text-2xl font-bold text-foreground">—</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Collections Funnel</CardTitle>
          <CardDescription>Progress through collection stages</CardDescription>
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

      <Card className="border-border">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Search by customer, invoice, or obligation..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 bg-input border-border"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-border whitespace-nowrap">
                  Priority: {filterPriority}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {['All', 'Critical', 'High', 'Medium', 'Low'].map((priority) => (
                  <DropdownMenuItem key={priority} onClick={() => handlePriorityFilter(priority)}>
                    {priority}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Collection Tasks</CardTitle>
          <CardDescription>
            {filteredTasks.length} active collection tasks (invoices + credit obligations + customer reminders)
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
                      <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Customer</p>
                      <Link
                        href={`/customers/${task.customerId}`}
                        className="font-semibold text-foreground hover:text-accent"
                      >
                        {task.customerName}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {sourceLabels[task.sourceType] ?? task.sourceType} #{task.sourceId}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Amount & Days</p>
                      <p className="font-semibold text-foreground">{formatAmountWithCode(task.amount)}</p>
                      <p className="text-sm text-red-600">{task.daysOverdue}d overdue</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Source</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                          {sourceLabels[task.sourceType] ?? task.sourceType}
                        </span>
                      </div>
                      {task.reminders && task.reminders.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground uppercase font-semibold mb-1 flex items-center gap-1">
                            <Bell size={12} />
                            Reminders
                          </p>
                          <div className="space-y-1">
                            {task.reminders.map((rem, i) => (
                              <p key={i} className="text-xs text-foreground">
                                {rem.channel ?? 'N/A'}
                                {rem.scheduleDays != null && ` • ${rem.scheduleDays}d`}
                                {rem.messagePreview && ` — ${rem.messagePreview}`}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-end justify-between lg:flex-col lg:justify-start gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">
                          Priority & Status
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                              priorityColors[task.priority] ?? 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {task.priority}
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                              statusColors[task.status] ?? 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {task.status}
                          </span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {task.sourceType === 'INVOICE' && (
                            <DropdownMenuItem
                              onClick={async () => {
                                setSendingTaskId(task.id);
                                try {
                                  await sendInvoiceAction(task.sourceId);
                                } catch (e) {
                                  showAlert(toUserFriendlyMessage(e, 'Could not send the invoice. Please try again.'), 'Send invoice');
                                } finally {
                                  setSendingTaskId(null);
                                }
                              }}
                              disabled={sendingTaskId === task.id}
                            >
                              <Send size={16} className="mr-2" />
                              {sendingTaskId === task.id ? 'Sending…' : 'Send Invoice'}
                            </DropdownMenuItem>
                          )}
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
                No collection tasks found. Overdue invoices and credit obligations appear here when both modules are enabled.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
