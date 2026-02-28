'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import { AppLogo } from '@/components/AppLogo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useI18n } from '@/lib/i18n-context';
import { setPasswordWithOtpAndLoginAction } from '@/lib/actions/auth';

function SetPasswordForm() {
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const tenantId = searchParams.get('tenantId') ?? null;
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email?.trim()) {
      setError(t('auth', 'fillAllFields'));
      return;
    }
    if (!code?.trim()) {
      setError(t('auth', 'fillAllFields'));
      return;
    }
    if (newPassword.length < 8) {
      setError(t('auth', 'passwordMinLength'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('auth', 'passwordsDoNotMatch'));
      return;
    }
    setLoading(true);
    try {
      await setPasswordWithOtpAndLoginAction(email.trim(), code.trim(), newPassword, tenantId);
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid or expired code');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4 sm:p-6 relative">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md min-w-0">
        <div className="flex justify-center mb-8">
          <AppLogo size={80} />
        </div>
        <Card className="border-border">
          <CardHeader>
            <CardTitle>{t('auth', 'setPasswordTitle')}</CardTitle>
            <CardDescription>{t('auth', 'setPasswordDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex gap-2">
                  <AlertCircle className="text-destructive flex-shrink-0" size={18} />
                  <p className="text-sm text-destructive">{error}</p>
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
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="000000"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  disabled={loading}
                  className="bg-input border-border font-mono text-lg tracking-widest"
                />
                <p className="text-xs text-muted-foreground">{t('auth', 'inviteOtpHint')}</p>
              </div>
              <div className="space-y-2">
                <label htmlFor="newPassword" className="text-sm font-medium text-foreground">
                  {t('auth', 'newPassword')}
                </label>
                <PasswordInput
                  id="newPassword"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                  {t('auth', 'confirmPassword')}
                </label>
                <PasswordInput
                  id="confirmPassword"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                    {t('auth', 'settingPassword')}
                  </>
                ) : (
                  t('auth', 'setPasswordAndSignIn')
                )}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              <Link href="/login" className="underline hover:text-foreground">
                {t('auth', 'alreadyHaveAccount')} {t('auth', 'login')}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    }>
      <SetPasswordForm />
    </Suspense>
  );
}
