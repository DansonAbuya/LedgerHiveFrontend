'use server';

import axios from 'axios';
import { getApiUrl } from '@/lib/api/config';
import { getAuthToken } from './auth';
import { toUserFriendlyMessage } from '@/lib/errors';

export type Customer = {
  id: string;
  tenantId: string;
  name: string;
  phone?: string;
  email?: string;
  creditLimit?: number;
  paymentTermsDays?: number;
  type?: string;
  createdAt: string;
  updatedAt: string;
};

export type CustomersPage = {
  content: Customer[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export type CustomerBalance = {
  customerId: string;
  tenantId: string;
  creditLimit: number | null;
  totalInvoiced: number;
  totalPaid: number;
  outstanding: number;
  remainingCredit: number | null;
};

export async function getCustomersAction(page = 0, size = 50): Promise<CustomersPage> {
  const token = await getAuthToken();
  if (!token) return { content: [], totalElements: 0, totalPages: 0, number: 0, size: 0 };
  try {
    const { data } = await axios.get<CustomersPage>(
      getApiUrl(`/api/v1/customers?page=${page}&size=${size}`),
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
      return { content: [], totalElements: 0, totalPages: 0, number: 0, size: 0 };
    }
    throw new Error(toUserFriendlyMessage(err, 'Could not load customers. Please try again.'));
  }
}

export async function getCustomerBalanceAction(customerId: string): Promise<CustomerBalance | null> {
  const token = await getAuthToken();
  if (!token) return null;
  try {
    const { data } = await axios.get<CustomerBalance>(
      getApiUrl(`/api/v1/customers/${customerId}/balance`),
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data;
  } catch (err: any) {
    if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
      return null;
    }
    throw err;
  }
}

export async function createCustomerAction(body: {
  name: string;
  phone?: string;
  email?: string;
  creditLimit?: number;
  paymentTermsDays?: number;
  type?: string;
}): Promise<Customer | null> {
  const token = await getAuthToken();
  if (!token) return null;
  try {
    const { data } = await axios.post<Customer>(
      getApiUrl('/api/v1/customers'),
      body,
      { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
    );
    return data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
      return null;
    }
    throw new Error(toUserFriendlyMessage(err, 'Could not create customer. Please try again.'));
  }
}

export async function deleteCustomerAction(id: string): Promise<boolean> {
  const token = await getAuthToken();
  if (!token) return false;
  try {
    await axios.delete(getApiUrl(`/api/v1/customers/${id}`), {
      headers: { Authorization: `Bearer ${token}` },
    });
    return true;
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
      return false;
    }
    throw new Error(toUserFriendlyMessage(err, 'Could not delete customer. Please try again.'));
  }
}
