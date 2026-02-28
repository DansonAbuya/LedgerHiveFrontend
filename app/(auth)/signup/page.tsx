'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import { AppLogo } from '@/components/AppLogo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useI18n } from '@/lib/i18n-context';

export default function SignupPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { signup, loading, error } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    organizationName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [localError, setLocalError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!formData.name || !formData.organizationName || !formData.email || !formData.password || !formData.confirmPassword) {
      setLocalError(t('auth', 'fillAllFields'));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setLocalError(t('auth', 'passwordsDoNotMatch'));
      return;
    }

    if (formData.password.length < 8) {
      setLocalError(t('auth', 'passwordMinLength'));
      return;
    }

    try {
      await signup(formData.email, formData.password, formData.name, formData.organizationName);
      router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : t('auth', 'signupFailed'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4 relative">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <AppLogo size={64} />
          </div>
          <h1 className="text-3xl font-bold text-foreground">{t('app', 'ledgerHive')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('auth', 'signupTagline')}
          </p>
        </div>

        {/* Signup Card */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>{t('auth', 'getStarted')}</CardTitle>
            <CardDescription>
              {t('auth', 'signUpToStart')}
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                <label htmlFor="name" className="text-sm font-medium text-foreground">
                  {t('auth', 'fullName')}
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={loading}
                  className="bg-input border-border"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="organizationName" className="text-sm font-medium text-foreground">
                  {t('auth', 'organizationName')}
                </label>
                <Input
                  id="organizationName"
                  name="organizationName"
                  type="text"
                  placeholder="Acme Corp"
                  value={formData.organizationName}
                  onChange={handleChange}
                  disabled={loading}
                  className="bg-input border-border"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  {t('auth', 'email')}
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  className="bg-input border-border"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  {t('auth', 'password')}
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
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
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
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
                    {t('auth', 'creatingAccount')}
                  </>
                ) : (
                  t('auth', 'createAccount')
                )}
              </Button>
            </form>

            <div className="mt-6 space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-card text-muted-foreground">
                    {t('auth', 'alreadyHaveAccount')}
                  </span>
                </div>
              </div>
              <Link href="/login">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-border"
                >
                  {t('auth', 'login')}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
