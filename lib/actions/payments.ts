'use server';

import axios from 'axios';
import { getApiUrl } from '@/lib/api/config';
import { getAuthToken } from './auth';

export type Payment = {
  id: string;
  tenantId: string;
  invoiceId: string;
  amount: number;
  status: string;
  reference?: string;
  createdAt: string;
  updatedAt: string;
};

export type PaymentsPage = {
  content: Payment[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export async function getPaymentsAction(page = 0, size = 50): Promise<PaymentsPage> {
  const token = await getAuthToken();
  if (!token) return { content: [], totalElements: 0, totalPages: 0, number: 0, size: 0 };
  try {
    const { data } = await axios.get<PaymentsPage>(
      getApiUrl(`/api/v1/payments?page=${page}&size=${size}`),
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data;
  } catch (err: any) {
    if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
      return { content: [], totalElements: 0, totalPages: 0, number: 0, size: 0 };
    }
    throw err;
  }
}

export async function recordPaymentAction(input: {
  invoiceId: string;
  amount: number;
  status?: string;
  reference?: string;
}): Promise<Payment | null> {
  const token = await getAuthToken();
  if (!token) return null;
  try {
    const { data } = await axios.post<Payment>(
      getApiUrl('/api/v1/payments'),
      {
        invoiceId: Number(input.invoiceId),
        amount: input.amount,
        status: input.status,
        reference: input.reference,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return data;
  } catch (err: any) {
    if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
      return null;
    }
    throw err;
  }
}
