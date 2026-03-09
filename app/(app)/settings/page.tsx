'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Building,
  Users,
  Lock,
  Bell,
  Zap,
  CreditCard,
  FileText,
  ChevronRight,
  Puzzle,
  Clock,
  GitBranch,
} from 'lucide-react';

const settingsSections = [
  {
    icon: Puzzle,
    title: 'Modules',
    description: 'Enable or disable Credit Issuance, Collections, and other modules',
    href: '/settings/modules',
  },
  {
    icon: Building,
    title: 'Organization Settings',
    description: 'Manage company name, branding, and general settings',
    href: '/settings/organization',
  },
  {
    icon: Users,
    title: 'User Management',
    description: 'Add, remove, and manage team members and their roles',
    href: '/settings/users',
  },
  {
    icon: GitBranch,
    title: 'Credit Workflow',
    description: 'Define adjustable credit approval steps and assignees',
    href: '/settings/credit-workflow',
  },
  {
    icon: Lock,
    title: 'Security & Permissions',
    description: 'Manage access levels, API keys, and security settings',
    href: '/settings/security',
  },
  {
    icon: Bell,
    title: 'Notifications',
    description: 'Configure email alerts and notification preferences',
    href: '/settings/notifications',
  },
  {
    icon: Clock,
    title: 'Payment reminders',
    description: 'Reminder frequency (days before due) can always be adjusted by the admin; customize message and quote invoice number only',
    href: '/settings/reminders',
  },
  {
    icon: Zap,
    title: 'Integrations',
    description: 'Connect with third-party services and APIs',
    href: '/settings/integrations',
  },
  {
    icon: CreditCard,
    title: 'Billing & Subscription',
    description: 'Manage payment methods and subscription plans',
    href: '/settings/billing',
  },
  {
    icon: FileText,
    title: 'Compliance & Legal',
    description: 'View terms, privacy policies, and compliance documents',
    href: '/settings/compliance',
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-4 p-4 sm:p-5 bg-background">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your organization and account preferences
        </p>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.href} href={section.href}>
              <Card className="border-border hover:border-accent transition-colors cursor-pointer h-full">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Icon className="text-accent" size={24} />
                        <h3 className="font-semibold text-foreground text-lg">
                          {section.title}
                        </h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {section.description}
                      </p>
                    </div>
                    <ChevronRight
                      className="text-muted-foreground flex-shrink-0"
                      size={20}
                    />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Support Section */}
      <Card className="border-border bg-gradient-to-r from-accent/10 to-transparent">
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
          <CardDescription>
            Can't find what you're looking for?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="outline" className="border-border">
              View Documentation
            </Button>
            <Button variant="outline" className="border-border">
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
