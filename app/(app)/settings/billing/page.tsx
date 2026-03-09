'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, Receipt, Info } from 'lucide-react';

export default function BillingSettingsPage() {
  return (
    <div className="space-y-4 p-4 sm:p-5 bg-background">
      <Link href="/settings">
        <Button variant="ghost" className="gap-2" size="sm">
          <ArrowLeft size={16} />
          Back to Settings
        </Button>
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-foreground">Billing &amp; Subscription</h1>
        <p className="text-muted-foreground mt-2">
          Manage your LedgerHive subscription and billing details.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="text-accent" size={18} />
              Current Plan
            </CardTitle>
            <CardDescription>Subscription plan and renewal information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              In this demo, billing is managed outside the app. In production, this page would integrate with your
              payment processor (e.g. Stripe) to manage plans, invoices, and payment methods.
            </p>
            <p>
              Please contact your LedgerHive representative to update your plan or billing details.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="text-accent" size={18} />
              Billing History
            </CardTitle>
            <CardDescription>Download invoices and receipts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Billing history is not persisted in this demo environment. In a full deployment this section would show
              your LedgerHive subscription invoices with PDF download links.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="text-accent" size={18} />
            How billing works
          </CardTitle>
          <CardDescription>High-level overview of LedgerHive billing.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            LedgerHive is billed per-tenant, with usage-based limits for customers, invoices, and reminders. Your
            exact pricing and billing cadence are defined in your commercial agreement.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

