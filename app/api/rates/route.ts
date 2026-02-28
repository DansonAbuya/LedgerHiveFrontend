import { NextResponse } from 'next/server';

const CACHE_MS = 15 * 60 * 1000; // 15 minutes
const FRANKFURTER_URL = 'https://api.frankfurter.app/latest';

let cached: { rates: Record<string, number>; at: number } | null = null;

export async function GET() {
  const now = Date.now();
  if (cached && now - cached.at < CACHE_MS) {
    return NextResponse.json({ base: 'KES', rates: cached.rates });
  }
  try {
    const res = await fetch(
      `${FRANKFURTER_URL}?from=KES&to=USD,EUR,GBP,ZAR,UGX,TZS`,
      { next: { revalidate: 900 } }
    );
    if (!res.ok) throw new Error('Rates fetch failed');
    const data = (await res.json()) as { rates?: Record<string, number> };
    const rates = data.rates ?? {};
    rates.KES = 1;
    cached = { rates, at: now };
    return NextResponse.json({ base: 'KES', rates });
  } catch (err) {
    if (cached) {
      return NextResponse.json({ base: 'KES', rates: cached.rates });
    }
    return NextResponse.json(
      { base: 'KES', rates: { KES: 1, USD: 0.0077, EUR: 0.0071, GBP: 0.0061, ZAR: 0.14, UGX: 28.5, TZS: 20 } },
      { status: 200 }
    );
  }
}
