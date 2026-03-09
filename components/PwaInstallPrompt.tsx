'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download } from 'lucide-react';
import { useI18n } from '@/lib/i18n-context';

const SW_URL = '/sw.js';
const DISMISS_KEY = 'pwa-install-dismissed';
const DISMISS_DAYS = 7;

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

function wasDismissedRecently(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const at = parseInt(raw, 10);
    if (Number.isNaN(at)) return false;
    const daysSince = (Date.now() - at) / (24 * 60 * 60 * 1000);
    return daysSince < DISMISS_DAYS;
  } catch {
    return false;
  }
}

function setDismissed(): void {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {}
}

export function PwaInstallPrompt() {
  const { t } = useI18n();
  const [deferredPrompt, setDeferredPrompt] = useState<{ prompt: () => Promise<{ outcome: string }> } | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;

    if (isStandalone()) return;
    if (wasDismissedRecently()) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const evt = e as unknown as { prompt: () => Promise<{ outcome: string }> };
      setDeferredPrompt({ prompt: () => evt.prompt() });
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register(SW_URL).catch(() => {});
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [mounted]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      setShowBanner(false);
      setDeferredPrompt(null);
    } catch {
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    setDismissed();
    setShowBanner(false);
  };

  if (!showBanner || !mounted) return null;

  return (
    <div
      className="fixed bottom-4 left-3 right-3 sm:left-4 sm:right-4 md:left-auto md:right-4 md:max-w-sm z-[100] rounded-xl border border-border bg-card shadow-lg p-4 pb-[env(safe-area-inset-bottom)] md:pb-4"
      role="dialog"
      aria-label={t('pwa', 'installBannerTitle')}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Download className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-foreground text-sm">
            {t('pwa', 'installBannerTitle')}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t('pwa', 'installBannerDescription')}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" className="min-h-[36px]" onClick={handleInstall}>
              {t('pwa', 'installButton')}
            </Button>
            <Button size="sm" variant="ghost" className="min-h-[36px]" onClick={handleDismiss}>
              {t('pwa', 'notNow')}
            </Button>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 h-8 w-8 rounded-full"
          onClick={handleDismiss}
          aria-label={t('common', 'cancel')}
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
