'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/password-input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n-context';

export default function ChangePasswordPage() {
  const { user, changePassword, loading } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError(t('auth', 'fillAllFields'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('auth', 'passwordsDoNotMatch'));
      return;
    }
    if (newPassword.length < 8) {
      setError(t('auth', 'passwordMinLength'));
      return;
    }
    try {
      await changePassword(currentPassword, newPassword);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    }
  };

  if (user && !user.mustChangePassword) {
    router.replace('/dashboard');
    return null;
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border">
        <CardHeader>
          <CardTitle>{t('auth', 'changePasswordTitle')}</CardTitle>
          <CardDescription>{t('auth', 'changePasswordDescription')}</CardDescription>
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
              <label htmlFor="currentPassword" className="text-sm font-medium text-foreground">
                {t('auth', 'currentPassword')}
              </label>
              <PasswordInput
                id="currentPassword"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={loading}
                className="bg-input border-border"
              />
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
                  {t('auth', 'changingPassword')}
                </>
              ) : (
                t('auth', 'setNewPassword')
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
