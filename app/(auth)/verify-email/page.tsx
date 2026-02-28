'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import { verifyEmailAction } from '@/lib/actions/auth';
import { AppLogo } from '@/components/AppLogo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useI18n } from '@/lib/i18n-context';

function VerifyEmailInner() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') ?? '';

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email || !code) {
      setError(t('auth', 'enterEmailAndCode'));
      return;
    }

    setLoading(true);
    try {
      await verifyEmailAction(email, code);
      setSuccess(t('auth', 'emailVerifiedSuccess'));
      setTimeout(() => router.push('/login'), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth', 'verificationFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4 relative">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <AppLogo size={64} />
          </div>
          <h1 className="text-3xl font-bold text-foreground">{t('auth', 'verifyEmailTitle')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('auth', 'verifyEmailDescription')}
          </p>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>{t('auth', 'verifyEmailCardTitle')}</CardTitle>
            <CardDescription>
              {t('auth', 'verifyEmailCardDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {(error || success) && (
                <div
                  className={`border rounded-lg p-3 flex gap-2 ${
                    error
                      ? 'bg-destructive/10 border-destructive/20'
                      : 'bg-emerald-50 border-emerald-200'
                  }`}
                >
                  <AlertCircle
                    className={error ? 'text-destructive flex-shrink-0' : 'text-emerald-600 flex-shrink-0'}
                    size={18}
                  />
                  <p className={`text-sm ${error ? 'text-destructive' : 'text-emerald-700'}`}>
                    {error || success}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  {t('auth', 'email')}
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="bg-input border-border"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="code" className="text-sm font-medium text-foreground">
                  {t('auth', 'verificationCode')}
                </label>
                <Input
                  id="code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={loading}
                  className="bg-input border-border tracking-[0.3em] text-center"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    {t('auth', 'verifying')}
                  </>
                ) : (
                  t('auth', 'verifyEmail')
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen p-6">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <VerifyEmailInner />
    </Suspense>
  );
}

