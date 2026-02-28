'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { getPublicInvoice, payPublicInvoice, type PublicInvoice } from '@/lib/actions/public-payment';

export default function PublicPayPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [invoice, setInvoice] = useState<PublicInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const inv = await getPublicInvoice(token);
      if (!cancelled) {
        if (!inv) setError('This payment link is invalid or has expired.');
        setInvoice(inv);
        setLoading(false);
      }
    }
    if (token) {
      load();
    }
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handlePay = async () => {
    if (!invoice) return;
    setPaying(true);
    setError(null);
    const ok = await payPublicInvoice(token, invoice.amount);
    setPaying(false);
    if (ok) {
      setSuccess(true);
    } else {
      setError('We could not complete the payment. Please try again or contact support.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="animate-spin" size={18} />
          <span>Loading payment details...</span>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="max-w-md w-full border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle size={20} />
              Payment link error
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            This payment link is invalid or has expired. Please request a new link from the organization that sent it.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md border-border">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl">Pay Invoice {invoice.id}</CardTitle>
          <CardDescription>
            {invoice.tenantName} uses LedgerHive to process secure payments.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {success && (
            <div className="flex items-start gap-2 rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-800">
              <CheckCircle2 size={18} className="mt-0.5" />
              <div>
                <p className="font-medium">Payment successful</p>
                <p>A receipt has been recorded. You may safely close this page.</p>
              </div>
            </div>
          )}

          {error && !success && (
            <div className="flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
              <AlertCircle size={18} className="mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <div className="space-y-1">
            <p className="text-xs uppercase text-muted-foreground font-semibold">Amount due</p>
            <p className="text-3xl font-bold text-foreground">
              ${invoice.amount.toLocaleString()}
            </p>
          </div>

          <div className="flex justify-between text-sm text-muted-foreground">
            <div>
              <p className="font-medium text-foreground">Due date</p>
              <p>{invoice.dueDate}</p>
            </div>
            <div className="text-right">
              <p className="font-medium text-foreground">Status</p>
              <p>{invoice.status}</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Payment options</p>
            <p className="text-xs text-muted-foreground">
              For this demo, clicking &quot;Pay now&quot; will simulate a successful payment in LedgerHive and
              mark the invoice as paid.
            </p>
            <Button
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
              disabled={paying || success}
              onClick={handlePay}
            >
              {paying ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Processing...
                </>
              ) : success ? (
                'Paid'
              ) : (
                'Pay now'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

