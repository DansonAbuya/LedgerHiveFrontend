'use server';

import axios from 'axios';
import { getApiUrl } from '@/lib/api/config';
import { getAuthToken } from './auth';

export type AvailableReport = {
  id: string;
  name: string;
  description: string;
  formats: string[];
  requiredRole: string;
};

export async function getAvailableReportsAction(): Promise<AvailableReport[]> {
  const token = await getAuthToken();
  if (!token) return [];
  try {
    const { data } = await axios.get<AvailableReport[]>(getApiUrl('/api/v1/reports'), {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data ?? [];
  } catch {
    return [];
  }
}

export type ReportDownloadParams = {
  creditAccountId?: number;
  customerId?: number;
  applicationId?: number;
  fromDate?: string;
  toDate?: string;
};

/**
 * Request report file from backend and return base64 data + suggested filename for client-side download.
 * Params: creditAccountId (credit-schedule), customerId (customer-statement), fromDate/toDate (payments-summary).
 */
export async function getReportDownloadAction(
  reportId: string,
  format: 'pdf' | 'xlsx',
  params?: ReportDownloadParams
): Promise<{ data: string; filename: string } | null> {
  const token = await getAuthToken();
  if (!token) return null;
  const ext = format;
  const search = new URLSearchParams();
  if (params?.creditAccountId != null) search.set('creditAccountId', String(params.creditAccountId));
  if (params?.customerId != null) search.set('customerId', String(params.customerId));
  if (params?.applicationId != null) search.set('applicationId', String(params.applicationId));
  if (params?.fromDate) search.set('fromDate', params.fromDate);
  if (params?.toDate) search.set('toDate', params.toDate);
  const qs = search.toString();
  const url = qs
    ? getApiUrl(`/api/v1/reports/${reportId}.${ext}?${qs}`)
    : getApiUrl(`/api/v1/reports/${reportId}.${ext}`);
  try {
    const { data, headers } = await axios.get<ArrayBuffer>(url, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'arraybuffer',
    });
    const contentDisposition = headers['content-disposition'];
    const filename =
      (typeof contentDisposition === 'string' &&
        /filename="?([^";]+)"?/.exec(contentDisposition)?.[1]) ||
      `${reportId}.${ext}`;
    const base64 = Buffer.from(data).toString('base64');
    return { data: base64, filename };
  } catch {
    return null;
  }
}
