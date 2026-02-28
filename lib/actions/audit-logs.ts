'use server';

import axios from 'axios';
import { getApiUrl } from '@/lib/api/config';
import { getAuthToken } from './auth';

export type AuditLog = {
  id: string;
  tenantId: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  details: string | null;
  createdAt: string;
};

export type AuditLogPage = {
  content: AuditLog[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export async function getAuditLogsAction(page = 0, size = 50): Promise<AuditLogPage> {
  const token = await getAuthToken();
  if (!token) return { content: [], totalElements: 0, totalPages: 0, number: 0, size: 0 };
  try {
    const { data } = await axios.get<AuditLogPage>(
      getApiUrl(`/api/v1/audit-logs?page=${page}&size=${size}`),
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

