'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, MessageSquare, Smartphone, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function IntegrationsSettingsPage() {
  return (
    <div className="space-y-6 p-6 bg-background">
      <Link href="/settings">
        <Button variant="ghost" className="gap-2" size="sm">
          <ArrowLeft size={16} />
          Back to Settings
        </Button>
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-foreground">Integrations</h1>
        <p className="text-muted-foreground mt-2">
          Configure email, SMS/WhatsApp, and payment integrations used by LedgerHive.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="text-accent" size={18} />
              Postmark (Email)
            </CardTitle>
            <CardDescription>Used for verification emails and reminders.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              The backend is already configured with your Postmark server token and sender address via
              environment variables.
            </p>
            <p>
              To change credentials, update <code>POSTMARK_SERVER_TOKEN</code> and related env vars and restart the backend.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="text-accent" size={18} />
              Twilio (SMS &amp; WhatsApp)
            </CardTitle>
            <CardDescription>Used for SMS and WhatsApp reminders.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Twilio account SID, auth token, and from numbers are configured in the backend via environment
              variables.
            </p>
            <p>
              To rotate keys or numbers, update the Twilio env vars and restart the backend.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="text-accent" size={18} />
              M-Pesa (Daraja)
            </CardTitle>
            <CardDescription>Used for mobile money payments and reconciliations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              M-Pesa consumer key, secret, shortcode, and callback URL are configured in the backend.
            </p>
            <p>
              To change these values, update the M-Pesa env vars and redeploy.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

