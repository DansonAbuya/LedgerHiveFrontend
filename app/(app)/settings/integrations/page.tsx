'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, MessageSquare, Smartphone, ArrowLeft, Key, Webhook } from 'lucide-react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  createIntegrationApiKeyAction,
  createIntegrationWebhookAction,
  deleteIntegrationWebhookAction,
  listIntegrationApiKeysAction,
  listIntegrationWebhooksAction,
  revokeIntegrationApiKeyAction,
  type IntegrationApiKey,
  type IntegrationWebhook,
} from '@/lib/actions/integrations';
import { toUserFriendlyMessage } from '@/lib/errors';

export default function IntegrationsSettingsPage() {
  const [apiKeys, setApiKeys] = useState<IntegrationApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<IntegrationWebhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [createKeyError, setCreateKeyError] = useState<string | null>(null);
  const [createWebhookError, setCreateWebhookError] = useState<string | null>(null);

  const [createKeyOpen, setCreateKeyOpen] = useState(false);
  const [createdKey, setCreatedKey] = useState<IntegrationApiKey | null>(null);
  const [keyForm, setKeyForm] = useState({ name: '', scopes: 'customers:read,customers:write,invoices:read,invoices:write' });

  const [createWebhookOpen, setCreateWebhookOpen] = useState(false);
  const [createdWebhook, setCreatedWebhook] = useState<IntegrationWebhook | null>(null);
  const [webhookForm, setWebhookForm] = useState({
    name: '',
    url: '',
    events: 'customer.created,customer.updated,customer.deleted,invoice.created,invoice.updated,invoice.deleted',
  });

  useEffect(() => {
    (async () => {
      try {
        const [k, w] = await Promise.all([listIntegrationApiKeysAction(), listIntegrationWebhooksAction()]);
        setApiKeys(k);
        setWebhooks(w);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const sortedKeys = useMemo(() => {
    return [...apiKeys].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
  }, [apiKeys]);

  const sortedWebhooks = useMemo(() => {
    return [...webhooks].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
  }, [webhooks]);

  return (
    <div className="space-y-4 p-4 sm:p-5 bg-background">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="text-accent" size={18} />
                Integration API Keys
              </CardTitle>
              <CardDescription>
                Create API keys for ERP/POS or partner systems to push customers/invoices into LedgerHive.
              </CardDescription>
            </div>

            <Dialog open={createKeyOpen} onOpenChange={(open) => { setCreateKeyOpen(open); if (!open) { setCreatedKey(null); setCreateKeyError(null); } }}>
              <DialogTrigger asChild>
                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">Create key</Button>
              </DialogTrigger>
              <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create API key</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  {createKeyError && (
                    <p className="text-sm text-destructive">{createKeyError}</p>
                  )}
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">Name</label>
                    <Input value={keyForm.name} onChange={(e) => setKeyForm((f) => ({ ...f, name: e.target.value }))} placeholder="ERP integration" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">Scopes (comma-separated)</label>
                    <Input
                      value={keyForm.scopes}
                      onChange={(e) => setKeyForm((f) => ({ ...f, scopes: e.target.value }))}
                      placeholder="customers:read,customers:write,invoices:read,invoices:write"
                    />
                  </div>

                  {createdKey?.apiKey ? (
                    <div className="rounded-md border border-border bg-muted p-3">
                      <p className="text-sm font-medium text-foreground mb-1">API key (copy now — shown once)</p>
                      <code className="break-all text-xs">{createdKey.apiKey}</code>
                    </div>
                  ) : null}
                </div>
                <DialogFooter>
                  <Button variant="outline" type="button" onClick={() => setCreateKeyOpen(false)}>Close</Button>
                  <Button
                    type="button"
                    className="bg-accent hover:bg-accent/90 text-accent-foreground"
                    disabled={!keyForm.name.trim()}
                    onClick={async () => {
                      setCreateKeyError(null);
                      try {
                        const created = await createIntegrationApiKeyAction({ name: keyForm.name.trim(), scopes: keyForm.scopes.trim() });
                        setCreatedKey(created);
                        setApiKeys((prev) => [created, ...prev]);
                      } catch (err) {
                        setCreateKeyError(toUserFriendlyMessage(err, 'Could not create API key. Please try again.'));
                      }
                    }}
                  >
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>

          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : sortedKeys.length === 0 ? (
              <p className="text-sm text-muted-foreground">No API keys yet.</p>
            ) : (
              <div className="space-y-2">
                {sortedKeys.map((k) => (
                  <div key={k.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-md border border-border p-3">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{k.name}</p>
                      <p className="text-xs text-muted-foreground break-words">{k.scopes}</p>
                    </div>
                    <Button
                      variant="outline"
                      className="sm:w-auto"
                      onClick={async () => {
                        await revokeIntegrationApiKeyAction(k.id);
                        setApiKeys((prev) => prev.filter((x) => x.id !== k.id));
                      }}
                    >
                      Revoke
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="text-accent" size={18} />
                Webhooks
              </CardTitle>
              <CardDescription>
                Receive events when customers/invoices change. Payloads are signed with HMAC SHA-256.
              </CardDescription>
            </div>

            <Dialog open={createWebhookOpen} onOpenChange={(open) => { setCreateWebhookOpen(open); if (!open) setCreatedWebhook(null); }}>
              <DialogTrigger asChild>
                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">Add webhook</Button>
              </DialogTrigger>
              <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create webhook</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  {createWebhookError && (
                    <p className="text-sm text-destructive">{createWebhookError}</p>
                  )}
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">Name</label>
                    <Input value={webhookForm.name} onChange={(e) => setWebhookForm((f) => ({ ...f, name: e.target.value }))} placeholder="Partner webhook" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">URL</label>
                    <Input value={webhookForm.url} onChange={(e) => setWebhookForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://example.com/webhooks/ledgerhive" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">Events (comma-separated, empty = all)</label>
                    <Input value={webhookForm.events} onChange={(e) => setWebhookForm((f) => ({ ...f, events: e.target.value }))} />
                  </div>

                  {createdWebhook?.secret ? (
                    <div className="rounded-md border border-border bg-muted p-3">
                      <p className="text-sm font-medium text-foreground mb-1">Webhook secret (copy now — shown once)</p>
                      <code className="break-all text-xs">{createdWebhook.secret}</code>
                    </div>
                  ) : null}
                </div>
                <DialogFooter>
                  <Button variant="outline" type="button" onClick={() => setCreateWebhookOpen(false)}>Close</Button>
                  <Button
                    type="button"
                    className="bg-accent hover:bg-accent/90 text-accent-foreground"
                    disabled={!webhookForm.name.trim() || !webhookForm.url.trim()}
                    onClick={async () => {
                      setCreateWebhookError(null);
                      try {
                        const created = await createIntegrationWebhookAction({
                          name: webhookForm.name.trim(),
                          url: webhookForm.url.trim(),
                          events: webhookForm.events.trim(),
                        });
                        setCreatedWebhook(created);
                        setWebhooks((prev) => [created, ...prev]);
                      } catch (err) {
                        setCreateWebhookError(toUserFriendlyMessage(err, 'Could not create webhook. Please try again.'));
                      }
                    }}
                  >
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>

          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : sortedWebhooks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No webhooks yet.</p>
            ) : (
              <div className="space-y-2">
                {sortedWebhooks.map((w) => (
                  <div key={w.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-md border border-border p-3">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{w.name}</p>
                      <p className="text-xs text-muted-foreground break-words">{w.url}</p>
                      <p className="text-xs text-muted-foreground break-words">Events: {w.events || 'all'}</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={async () => {
                        await deleteIntegrationWebhookAction(w.id);
                        setWebhooks((prev) => prev.filter((x) => x.id !== w.id));
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

