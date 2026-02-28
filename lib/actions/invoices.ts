'use server';

import axios from 'axios';
import { getApiUrl } from '@/lib/api/config';
import { getAuthToken } from './auth';

export type Invoice = {
  id: string;
  tenantId: string;
  customerId: string;
  amount: number;
  dueDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type InvoicesPage = {
  content: Invoice[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export async function getInvoicesAction(page = 0, size = 50): Promise<InvoicesPage> {
  const token = await getAuthToken();
  if (!token) return { content: [], totalElements: 0, totalPages: 0, number: 0, size: 0 };
  try {
    const { data } = await axios.get<InvoicesPage>(
      getApiUrl(`/api/v1/invoices?page=${page}&size=${size}`),
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

export async function createInvoiceAction(input: {
  customerId: string;
  amount: number;
  dueDate: string;
  status?: string;
}): Promise<Invoice | null> {
  const token = await getAuthToken();
  if (!token) return null;
  try {
    const { data } = await axios.post<Invoice>(
      getApiUrl('/api/v1/invoices'),
      {
        customerId: Number(input.customerId),
        amount: input.amount,
        dueDate: input.dueDate,
        status: input.status,
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
