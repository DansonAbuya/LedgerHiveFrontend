'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2, Check, ChevronRight, ChevronLeft, Wallet, Bell, FileText, CreditCard } from 'lucide-react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useI18n } from '@/lib/i18n-context';

const STEPS = [
  { id: 'account', key: 'stepAccount' },
  { id: 'modules', key: 'stepModules' },
  { id: 'review', key: 'stepReview' },
] as const;

const MODULE_OPTIONS = [
  { id: 'collections', key: 'moduleCollections', icon: Bell, descKey: 'moduleCollectionsDesc' },
  { id: 'issuance', key: 'moduleIssuance', icon: Wallet, descKey: 'moduleIssuanceDesc' },
  { id: 'invoices', key: 'moduleInvoices', icon: FileText, descKey: 'moduleInvoicesDesc' },
  { id: 'payments', key: 'modulePayments', icon: CreditCard, descKey: 'modulePaymentsDesc' },
] as const;

export default function SignupPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { signup, loading, error } = useAuth();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    organizationName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set(['collections', 'issuance', 'invoices', 'payments']));
  const [localError, setLocalError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleModule = (id: string) => {
    setSelectedModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const canProceedFromAccount = () =>
    !!formData.name?.trim() &&
    !!formData.organizationName?.trim() &&
    !!formData.email?.trim() &&
    !!formData.password &&
    formData.password.length >= 8 &&
    formData.password === formData.confirmPassword;

  const canProceedFromModules = () => selectedModules.size > 0;

  const handleNext = () => {
    setLocalError('');
    if (step === 0 && !canProceedFromAccount()) {
      setLocalError(t('auth', 'fillAllFields'));
      if (formData.password && formData.password.length < 8) setLocalError(t('auth', 'passwordMinLength'));
      if (formData.password !== formData.confirmPassword) setLocalError(t('auth', 'passwordsDoNotMatch'));
      return;
    }
    if (step === 1 && !canProceedFromModules()) {
      setLocalError(t('auth', 'selectAtLeastOneModule'));
      return;
    }
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const handleBack = () => {
    setLocalError('');
    if (step > 0) setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!canProceedFromAccount()) {
      setLocalError(t('auth', 'fillAllFields'));
      return;
    }
    if (!canProceedFromModules()) {
      setLocalError(t('auth', 'selectAtLeastOneModule'));
      return;
    }

    try {
      await signup(
        formData.email,
        formData.password,
        formData.name,
        formData.organizationName,
        Array.from(selectedModules),
      );
      router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : t('auth', 'signupFailed'));
    }
  };

  return (
    <div className="auth-screen h-dvh h-screen flex flex-col overflow-hidden relative">
      <div className="absolute top-4 left-3 right-3 sm:top-6 sm:right-6 sm:left-6 z-10 flex items-center justify-between gap-2 min-h-[44px]">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground underline py-2 min-h-[44px] flex items-center shrink-0">
          {t('auth', 'backToHome')}
        </Link>
        <LanguageSwitcher />
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto py-3 sm:py-4 px-3 sm:px-5 pb-[env(safe-area-inset-bottom)]">
        <div className="w-full max-w-lg mx-auto pb-4">
        <div className="text-center mb-3 sm:mb-4">
          <p className="text-muted-foreground text-xs sm:text-sm">{t('auth', 'signupTagline')}</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              <div
                className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                  i < step ? 'bg-accent text-accent-foreground' : i === step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                {i < step ? <Check size={14} className="sm:w-4 sm:h-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && <div className="w-6 sm:w-8 h-0.5 bg-muted" />}
            </React.Fragment>
          ))}
        </div>

        <Card className="border-border overflow-hidden">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-lg sm:text-xl">{t('auth', STEPS[step].key)}</CardTitle>
            <CardDescription className="text-sm">
              {step === 0 && t('auth', 'signUpToStart')}
              {step === 1 && t('auth', 'selectModulesDesc')}
              {step === 2 && t('auth', 'reviewSignupDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2 sm:pt-3">
            <form onSubmit={step === STEPS.length - 1 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} className="space-y-2 sm:space-y-3">
              {(error || localError) && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex gap-2">
                  <AlertCircle className="text-destructive flex-shrink-0" size={18} />
                  <p className="text-sm text-destructive">{error || localError}</p>
                </div>
              )}

              {/* Step 0: Account */}
              {step === 0 && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <label htmlFor="name" className="text-sm font-medium text-foreground">{t('auth', 'fullName')}</label>
                    <Input id="name" name="name" placeholder="John Doe" value={formData.name} onChange={handleInputChange} disabled={loading} className="bg-input border-border" />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <label htmlFor="organizationName" className="text-sm font-medium text-foreground">{t('auth', 'organizationName')}</label>
                    <Input id="organizationName" name="organizationName" placeholder="Acme Corp" value={formData.organizationName} onChange={handleInputChange} disabled={loading} className="bg-input border-border" />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-foreground">{t('auth', 'email')}</label>
                    <Input id="email" name="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleInputChange} disabled={loading} className="bg-input border-border" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium text-foreground">{t('auth', 'password')}</label>
                    <Input id="password" name="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleInputChange} disabled={loading} className="bg-input border-border" />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">{t('auth', 'confirmPassword')}</label>
                    <PasswordInput id="confirmPassword" name="confirmPassword" placeholder="••••••••" value={formData.confirmPassword} onChange={handleInputChange} disabled={loading} className="bg-input border-border" />
                  </div>
                </div>
              )}

              {/* Step 1: Modules */}
              {step === 1 && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">{t('auth', 'moduleConnectHint')}</p>
                  {MODULE_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = selectedModules.has(opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => toggleModule(opt.id)}
                        className={`w-full text-left p-3 sm:p-4 rounded-lg border-2 transition-all flex items-start gap-3 sm:gap-4 ${
                          isSelected ? 'border-accent bg-accent/5' : 'border-border hover:border-muted-foreground/50'
                        }`}
                      >
                        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-accent text-accent-foreground' : 'bg-muted'}`}>
                          <Icon size={18} className="sm:w-5 sm:h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground">{t('auth', opt.key)}</p>
                          <p className="text-sm text-muted-foreground mt-0.5">{t('auth', opt.descKey)}</p>
                        </div>
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-accent bg-accent' : 'border-muted-foreground'}`}>
                          {isSelected && <Check size={12} className="text-accent-foreground" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Step 2: Review */}
              {step === 2 && (
                <div className="space-y-3 sm:space-y-4 rounded-lg border border-border p-3 sm:p-4 bg-muted/30">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold">{t('auth', 'fullName')}</p>
                    <p className="font-medium text-foreground">{formData.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold">{t('auth', 'organizationName')}</p>
                    <p className="font-medium text-foreground">{formData.organizationName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold">{t('auth', 'email')}</p>
                    <p className="font-medium text-foreground">{formData.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">{t('auth', 'enabledModules')}</p>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(selectedModules).map((m) => (
                        <span key={m} className="px-2 py-1 rounded bg-accent/20 text-accent-foreground text-sm font-medium">
                          {t('auth', m === 'collections' ? 'moduleCollections' : m === 'issuance' ? 'moduleIssuance' : m === 'invoices' ? 'moduleInvoices' : 'modulePayments')}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex gap-2 pt-2">
                {step > 0 ? (
                  <Button type="button" variant="outline" onClick={handleBack} disabled={loading} className="border-border">
                    <ChevronLeft size={16} className="mr-1" />
                    {t('common', 'back')}
                  </Button>
                ) : (
                  <div />
                )}
                <div className="flex-1" />
                {step < STEPS.length - 1 ? (
                  <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    {t('auth', 'next')}
                    <ChevronRight size={16} className="ml-1" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    {loading ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        {t('auth', 'creatingAccount')}
                      </>
                    ) : (
                      t('auth', 'createAccount')
                    )}
                  </Button>
                )}
              </div>
            </form>

            <div className="mt-3 sm:mt-4 pt-3 border-t border-border text-center">
              <p className="text-sm text-muted-foreground">
                {t('auth', 'alreadyHaveAccount')}{' '}
                <Link href="/login" className="text-accent hover:underline font-medium">
                  {t('auth', 'login')}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
