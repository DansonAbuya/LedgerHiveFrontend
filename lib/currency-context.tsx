'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export const DEFAULT_CURRENCY = 'KES';

export type CurrencyCode = 'KES' | 'USD' | 'EUR' | 'GBP' | 'ZAR' | 'UGX' | 'TZS';

export interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
  rateFromKES: number;
  loading: boolean;
  formatAmount: (amountKES: number) => string;
  formatAmountWithCode: (amountKES: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(DEFAULT_CURRENCY);
  const [rates, setRates] = useState<Record<string, number>>({ KES: 1 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/rates')
      .then((res) => res.json())
      .then((data: { rates?: Record<string, number> }) => {
        if (!cancelled && data.rates) {
          setRates({ ...data.rates, KES: 1 });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const setCurrency = useCallback((code: CurrencyCode) => {
    setCurrencyState(code);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('ledgerhive_currency', code);
      } catch {}
    }
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('ledgerhive_currency') as CurrencyCode | null;
      if (stored && ['KES', 'USD', 'EUR', 'GBP', 'ZAR', 'UGX', 'TZS'].includes(stored)) {
        setCurrencyState(stored);
      }
    } catch {}
  }, []);

  const rateFromKES = rates[currency] ?? 1;

  const formatAmount = useCallback(
    (amountKES: number) => {
      const value = amountKES * rateFromKES;
      return new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(value);
    },
    [rateFromKES]
  );

  const formatAmountWithCode = useCallback(
    (amountKES: number) => {
      const value = amountKES * rateFromKES;
      const formatted = new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(value);
      const symbols: Record<CurrencyCode, string> = {
        KES: 'KSh',
        USD: '$',
        EUR: '€',
        GBP: '£',
        ZAR: 'R',
        UGX: 'USh',
        TZS: 'TSh',
      };
      const prefix = symbols[currency] ?? currency;
      return `${prefix} ${formatted}`;
    },
    [currency, rateFromKES]
  );

  const value: CurrencyContextType = {
    currency,
    setCurrency,
    rateFromKES,
    loading,
    formatAmount,
    formatAmountWithCode,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
}
