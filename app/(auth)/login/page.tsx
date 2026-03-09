'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useI18n } from '@/lib/i18n-context';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const { login, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const inactiveReason = searchParams.get('reason') === 'inactive';
  const tenantId = searchParams.get('tenantId') ?? searchParams.get('tenant') ?? null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!email || !password) {
      setLocalError(t('auth', 'fillAllFields'));
      return;
    }

    try {
      const user = await login(email, password, tenantId);
      router.push(user.mustChangePassword ? '/change-password' : '/dashboard');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <div className="auth-screen min-h-screen min-h-dvh overflow-y-auto py-3 sm:py-4 px-3 sm:px-5 relative pb-[env(safe-area-inset-bottom)]">
      <div className="absolute top-4 left-3 right-3 sm:top-6 sm:right-6 sm:left-6 z-10 flex items-center justify-between gap-2 min-h-[44px]">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground underline py-2 min-h-[44px] flex items-center">
          {t('auth', 'backToHome')}
        </Link>
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md min-w-0 mx-auto flex flex-col justify-center min-h-[calc(100vh-3rem)] sm:min-h-[calc(100vh-4rem)] pt-12 sm:pt-14">
        {/* Login Card */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>{t('auth', 'welcomeBack')}</CardTitle>
            <CardDescription>
              {t('auth', 'signInToContinue')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {inactiveReason && (
              <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
                {t('auth', 'inactiveMessage')}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              {(error || localError) && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex gap-2">
                  <AlertCircle className="text-destructive flex-shrink-0" size={18} />
                  <p className="text-sm text-destructive">
                    {error || localError}
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
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  {t('auth', 'password')}
                </label>
                <PasswordInput
                  id="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="bg-input border-border"
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
                    {t('auth', 'signingIn')}
                  </>
                ) : (
                  t('auth', 'login')
                )}
              </Button>
            </form>

            <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-card text-muted-foreground">
                    {t('auth', 'dontHaveAccount')}
                  </span>
                </div>
              </div>
              <Link href="/signup">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-border"
                >
                  {t('auth', 'createAccount')}
                </Button>
              </Link>
              <p className="text-center text-sm text-muted-foreground">
                <Link href="/set-password" className="underline hover:text-foreground">
                  {t('auth', 'invitedByAdmin')}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="auth-screen min-h-screen min-h-dvh flex items-center justify-center py-4 px-4">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
