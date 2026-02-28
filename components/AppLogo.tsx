'use client';

import React from 'react';
import Image from 'next/image';
import { useI18n } from '@/lib/i18n-context';

interface AppLogoProps {
  /** Size of the logo in pixels (width and height). Default 40. */
  size?: number;
  /** Show app name next to the logo. */
  showText?: boolean;
  /** Optional class name for the wrapper. */
  className?: string;
}

export function AppLogo({ size = 40, showText = false, className = '' }: AppLogoProps) {
  const { t } = useI18n();
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Image
        src="/logo.png"
        alt={t('app', 'ledgerHive')}
        width={size}
        height={size}
        className="rounded-lg object-contain"
        priority
      />
      {showText && (
        <span className="font-bold text-sidebar-foreground text-lg">{t('app', 'ledgerHive')}</span>
      )}
    </div>
  );
}
