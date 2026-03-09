'use server';

import axios from 'axios';
import { getApiUrl } from '@/lib/api/config';
import { getAuthToken } from './auth';
import { toUserFriendlyMessage } from '@/lib/errors';

export type ReminderItem = {
  id: string;
  customerId: string;
  customerName: string;
  invoiceId?: string;
  channel?: string;
  scheduleDays?: number;
  message?: string;
  sentAt?: string;
  invoiceDueDate?: string;
  createdAt: string;
};

export async function getRemindersAction(): Promise<ReminderItem[]> {
  const token = await getAuthToken();
  if (!token) return [];
  try {
    const { data } = await axios.get<ReminderItem[]>(getApiUrl('/api/v1/reminders'), {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data ?? [];
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) return [];
    throw new Error(toUserFriendlyMessage(err, 'Could not load reminders.'));
  }
}

export async function updateReminderAction(
  id: string,
  payload: { scheduleDays?: number; message?: string }
): Promise<ReminderItem | null> {
  const token = await getAuthToken();
  if (!token) return null;
  try {
    const { data } = await axios.put<ReminderItem>(getApiUrl(`/api/v1/reminders/${id}`), payload, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });
    return data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) return null;
    throw new Error(toUserFriendlyMessage(err, 'Could not update reminder.'));
  }
}
