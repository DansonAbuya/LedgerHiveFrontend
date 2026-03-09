'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bell } from 'lucide-react';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState({
    overdue: true,
    payments: true,
    reports: true,
    system: true,
  });

  const handleToggle = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-4 p-4 sm:p-5 bg-background">
      <Link href="/settings">
        <Button variant="ghost" className="gap-2" size="sm">
          <ArrowLeft size={16} />
          Back to Settings
        </Button>
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-foreground">Notification Preferences</h1>
        <p className="text-muted-foreground mt-2">
          Configure how and when you receive alerts
        </p>
      </div>

      {/* Email Notifications */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell size={20} className="text-accent" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Choose which notifications you want to receive via email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: 'overdue', label: 'Overdue Invoices', desc: 'Alert when invoices become overdue' },
            { key: 'payments', label: 'Payment Alerts', desc: 'Notify when payments are received' },
            { key: 'reports', label: 'Daily Reports', desc: 'Receive daily collection reports' },
            { key: 'system', label: 'System Updates', desc: 'Important system and security updates' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div>
                <p className="font-medium text-foreground">{label}</p>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
              <button
                onClick={() => handleToggle(key as keyof typeof notifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications[key as keyof typeof notifications]
                    ? 'bg-accent'
                    : 'bg-muted'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications[key as keyof typeof notifications]
                      ? 'translate-x-6'
                      : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex gap-2">
        <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
          Save Preferences
        </Button>
        <Link href="/settings">
          <Button variant="outline" className="border-border">
            Cancel
          </Button>
        </Link>
      </div>
    </div>
  );
}
