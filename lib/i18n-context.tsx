'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import en from '@/messages/en.json';
import sw from '@/messages/sw.json';
import fr from '@/messages/fr.json';
import de from '@/messages/de.json';
import pt from '@/messages/pt.json';
import es from '@/messages/es.json';
import hi from '@/messages/hi.json';
import she from '@/messages/she.json';

export type Locale = 'en' | 'sw' | 'fr' | 'de' | 'pt' | 'es' | 'hi' | 'she';

const STORAGE_KEY = 'ledgerhive_locale';

const VALID_LOCALES: Locale[] = ['en', 'sw', 'fr', 'de', 'pt', 'es', 'hi', 'she'];

type Messages = Record<string, Record<string, string>>;

const allMessages: Record<Locale, Messages> = {
  en: en as Messages,
  sw: sw as Messages,
  fr: fr as Messages,
  de: de as Messages,
  pt: pt as Messages,
  es: es as Messages,
  hi: hi as Messages,
  she: she as Messages,
};

function getNested(obj: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const p of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[p];
  }
  return typeof current === 'string' ? current : undefined;
}

export interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (namespace: string, key: string) => string;
}

const Context = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (stored && VALID_LOCALES.includes(stored)) setLocaleState(stored);
    } catch {}
  }, [mounted]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
  }, []);

  const messages = allMessages[locale] ?? allMessages.en;

  const t = useCallback(
    (namespace: string, key: string) => {
      const val = getNested(messages as Record<string, unknown>, `${namespace}.${key}`);
      return val ?? key;
    },
    [messages]
  );

  const value: I18nContextType = { locale, setLocale, t };

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useI18n() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
