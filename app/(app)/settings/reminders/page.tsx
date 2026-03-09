'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, Clock } from 'lucide-react';
import { getRemindersAction, updateReminderAction, type ReminderItem } from '@/lib/actions/reminders';
import { toUserFriendlyMessage } from '@/lib/errors';
import { useAuth } from '@/lib/auth-context';

const DEFAULT_MESSAGE = 'Reminder: Please pay Invoice #{{invoiceNumber}} by {{dueDate}}.';

export default function SettingsRemindersPage() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editScheduleDays, setEditScheduleDays] = useState<string>('5');
  const [editMessage, setEditMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await getRemindersAction();
        if (!cancelled) setReminders(list ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const startEdit = (r: ReminderItem) => {
    setEditingId(r.id);
    setEditScheduleDays(String(r.scheduleDays ?? 5));
    setEditMessage(r.message ?? DEFAULT_MESSAGE);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateReminderAction(editingId, {
        scheduleDays: parseInt(editScheduleDays, 10) || 5,
        message: editMessage.trim() || undefined,
      });
      if (updated) {
        setReminders((prev) => prev.map((x) => (x.id === editingId ? updated : x)));
        setEditingId(null);
      }
    } catch (e) {
      setError(toUserFriendlyMessage(e, 'Failed to update reminder.'));
    } finally {
      setSaving(false);
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-4 p-4 sm:p-5 bg-background">
      <Link href="/settings">
        <Button variant="ghost" className="gap-2" size="sm">
          <ArrowLeft size={16} />
          Back to Settings
        </Button>
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-foreground">Payment reminders</h1>
        <p className="text-muted-foreground mt-2">
          Reminders are sent before each invoice due date. <strong>Reminder frequency (days before due) can always be adjusted by the admin.</strong> Customize the number of days and the message; use only the invoice number in the message if you prefer not to send the invoice itself.
        </p>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock size={20} />
            Reminders
          </CardTitle>
          <CardDescription>
            Reminders linked to credit-release invoices. Frequency (days before due) can always be adjusted by the admin. Default: 5 days; message can include {`{{invoiceNumber}}`} and {`{{dueDate}}`}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded px-3 py-2 mb-4">
              {error}
            </p>
          )}
          {loading ? (
            <p className="text-sm text-muted-foreground py-4">Loading...</p>
          ) : reminders.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No payment reminders yet. They are created automatically when a Manager approves credit release.
            </p>
          ) : (
            <div className="space-y-4">
              {reminders.map((r) => (
                <div
                  key={r.id}
                  className="border border-border rounded-lg p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-medium text-foreground">Customer: {r.customerName}</span>
                    {r.invoiceId && (
                      <span className="text-muted-foreground">Invoice #{r.invoiceId}</span>
                    )}
                    {r.invoiceDueDate && (
                      <span className="text-muted-foreground">Due: {r.invoiceDueDate}</span>
                    )}
                    {r.sentAt ? (
                      <span className="text-green-600 text-xs">Sent</span>
                    ) : (
                      <span className="text-amber-600 text-xs">Pending</span>
                    )}
                  </div>
                  {editingId === r.id && isAdmin ? (
                    <div className="space-y-3 pt-2">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1">Days before due date</label>
                        <Input
                          type="number"
                          min={1}
                          max={30}
                          value={editScheduleDays}
                          onChange={(e) => setEditScheduleDays(e.target.value)}
                          className="max-w-[120px]"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1">Message (use {`{{invoiceNumber}}`} and/or {`{{dueDate}}`})</label>
                        <textarea
                          className="w-full min-h-[80px] rounded-lg border border-border bg-background px-3 py-2 text-sm"
                          value={editMessage}
                          onChange={(e) => setEditMessage(e.target.value)}
                          placeholder={DEFAULT_MESSAGE}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveEdit} disabled={saving} className="gap-1">
                          <Save size={14} />
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm">
                      <p className="text-muted-foreground">
                        <strong>{r.scheduleDays ?? 5}</strong> days before due
                        {r.message && (
                          <> · Message: <span className="text-foreground">{r.message.length > 80 ? r.message.slice(0, 80) + '…' : r.message}</span></>
                        )}
                      </p>
                      {isAdmin && !r.sentAt && (
                        <Button variant="outline" size="sm" className="mt-2" onClick={() => startEdit(r)}>
                          Edit
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
