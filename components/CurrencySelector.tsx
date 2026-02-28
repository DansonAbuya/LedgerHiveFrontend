'use client';

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCurrency, type CurrencyCode } from '@/lib/currency-context';

const CURRENCIES: { code: CurrencyCode; label: string }[] = [
  { code: 'KES', label: 'KES (KSh)' },
  { code: 'USD', label: 'USD ($)' },
  { code: 'EUR', label: 'EUR (€)' },
  { code: 'GBP', label: 'GBP (£)' },
  { code: 'ZAR', label: 'ZAR (R)' },
  { code: 'UGX', label: 'UGX (USh)' },
  { code: 'TZS', label: 'TZS (TSh)' },
];

export function CurrencySelector() {
  const { currency, setCurrency, loading } = useCurrency();

  return (
    <Select
      value={currency}
      onValueChange={(v) => setCurrency(v as CurrencyCode)}
      disabled={loading}
    >
      <SelectTrigger className="w-[130px] h-9 border-border bg-muted/50 text-foreground">
        <SelectValue placeholder="Currency" />
      </SelectTrigger>
      <SelectContent>
        {CURRENCIES.map((c) => (
          <SelectItem key={c.code} value={c.code}>
            {c.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
