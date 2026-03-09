'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldCheck, FileText, Lock } from 'lucide-react';

export default function ComplianceSettingsPage() {
  return (
    <div className="space-y-4 p-4 sm:p-5 bg-background">
      <Link href="/settings">
        <Button variant="ghost" className="gap-2" size="sm">
          <ArrowLeft size={16} />
          Back to Settings
        </Button>
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-foreground">Compliance &amp; Legal</h1>
        <p className="text-muted-foreground mt-2">
          Access your organization&apos;s legal, privacy, and compliance information.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="text-accent" size={18} />
              Terms of Service
            </CardTitle>
            <CardDescription>Agreement governing use of LedgerHive.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              In a production deployment, this section would link to the current version of your LedgerHive terms of
              service.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="text-accent" size={18} />
              Privacy Policy
            </CardTitle>
            <CardDescription>How customer and debtor data is handled.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              This would normally describe data retention, processing locations, and how LedgerHive meets local data
              protection regulations.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="text-accent" size={18} />
              Security Overview
            </CardTitle>
            <CardDescription>Security practices and certifications.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Use this area to summarize your security posture (encryption, backups, access controls) and link to any
              formal certifications.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

