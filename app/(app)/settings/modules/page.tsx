'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { getTenantModulesAction, setTenantModuleAction } from '@/lib/actions/tenants';
import { getModuleLabel, TENANT_MODULES } from '@/lib/tenant-modules';

export default function ModulesSettingsPage() {
  const [enabled, setEnabled] = useState<Set<string>>(new Set(TENANT_MODULES));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    getTenantModulesAction().then((mods) => {
      setEnabled(new Set(mods));
    }).finally(() => setLoading(false));
  }, []);

  const handleToggle = async (module: string, currentlyEnabled: boolean) => {
    setSaving(module);
    const result = await setTenantModuleAction(module, !currentlyEnabled);
    setSaving(null);
    if (result) setEnabled(new Set(result));
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
        <h1 className="text-3xl font-bold text-foreground">Modules</h1>
        <p className="text-muted-foreground mt-2">
          Enable or disable modules for your organization. When both Credit Issuance and Collections are enabled,
          overdue credit obligations automatically appear in Collections.
        </p>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Available Modules</CardTitle>
          <CardDescription>
            Add modules later and they will connect automatically. Credit Issuance + Collections track
            credit from application through collection.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            TENANT_MODULES.map((module) => {
              const isEnabled = enabled.has(module);
              const desc =
                module === 'issuance'
                  ? 'Credit applications, accounts, obligations. Connects to Collections when overdue.'
                  : module === 'collections'
                    ? 'Track overdue invoices and credit obligations.'
                    : module === 'invoices'
                      ? 'Create and manage customer invoices.'
                      : 'Record and track payments.';
              return (
                <div
                  key={module}
                  className="flex items-center justify-between gap-3 p-3 sm:p-4 rounded-lg border border-border"
                >
                  <div>
                    <h3 className="font-semibold text-foreground">{getModuleLabel(module)}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{desc}</p>
                  </div>
                  <Button
                    variant={isEnabled ? 'outline' : 'default'}
                    size="sm"
                    disabled={saving !== null}
                    onClick={() => handleToggle(module, isEnabled)}
                  >
                    {saving === module ? '...' : isEnabled ? 'Disable' : 'Enable'}
                  </Button>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
