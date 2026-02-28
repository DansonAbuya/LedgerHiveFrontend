'use server';

import axios from 'axios';
import { getApiUrl } from '@/lib/api/config';
import { getAuthToken } from './auth';

export async function createPaymentLinkAction(invoiceId: string, ttlMinutes = 60): Promise<string | null> {
  const token = await getAuthToken();
  if (!token) return null;
  try {
    const { data } = await axios.post<{ token: string }>(
      getApiUrl('/api/v1/payment-links'),
      { invoiceId: Number(invoiceId), ttlMinutes },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return data.token;
  } catch {
    return null;
  }
}

