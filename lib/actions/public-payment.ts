'use server';

import axios from 'axios';
import { getApiUrl } from '@/lib/api/config';

export type PublicInvoice = {
  id: string;
  tenantName: string;
  amount: number;
  dueDate: string;
  status: string;
};

export async function getPublicInvoice(token: string): Promise<PublicInvoice | null> {
  try {
    const { data } = await axios.get<PublicInvoice>(getApiUrl(`/api/public/pay/${token}`));
    return data;
  } catch {
    return null;
  }
}

export async function payPublicInvoice(token: string, amount?: number, reference?: string): Promise<boolean> {
  try {
    await axios.post(
      getApiUrl(`/api/public/pay/${token}/pay`),
      { amount, reference },
      { headers: { 'Content-Type': 'application/json' } },
    );
    return true;
  } catch {
    return false;
  }
}

