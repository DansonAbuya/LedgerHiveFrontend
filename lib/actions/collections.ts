'use server';

import axios from 'axios';
import { getApiUrl } from '@/lib/api/config';
import { getAuthToken } from './auth';

export type ReminderSummary = {
  channel?: string;
  scheduleDays?: number;
  messagePreview?: string;
};

export type CollectionTask = {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
  sourceType: 'INVOICE' | 'CREDIT_OBLIGATION';
  sourceId: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: string;
  reminders?: ReminderSummary[];
};

export async function getCollectionsOverdueAction(): Promise<CollectionTask[]> {
  const token = await getAuthToken();
  if (!token) return [];
  try {
    const { data } = await axios.get<CollectionTask[]>(
      getApiUrl('/api/v1/collections/overdue'),
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data ?? [];
  } catch (err: any) {
    if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
      return [];
    }
    throw err;
  }
}
