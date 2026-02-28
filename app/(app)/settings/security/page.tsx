'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Key, Lock, Shield } from 'lucide-react';

export default function SecurityPage() {
  return (
    <div className="space-y-6 p-6 bg-background">
      <Link href="/settings">
        <Button variant="ghost" className="gap-2" size="sm">
          <ArrowLeft size={16} />
          Back to Settings
        </Button>
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-foreground">Security & Permissions</h1>
        <p className="text-muted-foreground mt-2">
          Manage access controls and security settings
        </p>
      </div>

      {/* Password & Authentication */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lock size={20} className="text-accent" />
              Password & Authentication
            </CardTitle>
            <CardDescription>
              Change your password and enable two-factor authentication
            </CardDescription>
          </div>
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
            Update Password
          </Button>
        </CardHeader>
      </Card>

      {/* API Keys */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Key size={20} className="text-accent" />
              API Keys
            </CardTitle>
            <CardDescription>
              Manage API keys for integrations
            </CardDescription>
          </div>
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
            Generate New Key
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-sm">
            No API keys created yet. Create one to get started with integrations.
          </div>
        </CardContent>
      </Card>

      {/* Access & Permissions */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield size={20} className="text-accent" />
            Access & Permissions
          </CardTitle>
          <CardDescription>
            Configure role-based access control
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Manage custom permissions for user roles in the User Management settings.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
