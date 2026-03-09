'use server';

import axios from 'axios';
import { getApiUrl } from '@/lib/api/config';
import { getAuthToken } from './auth';

export type AnalyticsOverviewData = {
  totalOutstanding: number;
  totalInvoiced: number;
  totalPaid: number;
  overdueAmount: number;
  collectionRatePercent: number;
  invoiceCount: number;
  overdueCount: number;
};

export type AnalyticsAgingBucket = {
  bucket: string;
  amount: number;
  count: number;
};

export type AnalyticsPaymentsTrendData = {
  months: { period: string; amount: number; count: number }[];
};

export type AnalyticsCreditFunnelData = {
  stages: { stage: string; count: number }[];
  totalApplications: number;
};

export type BestPerformingCustomer = {
  customerId: string;
  customerName: string;
  totalPaid: number;
  totalInvoiced: number;
  paymentRatePercent: number;
  rank: number;
};

export type AnalyticsBestCustomersData = {
  customers: BestPerformingCustomer[];
};

export type AnalyticsCustomerAcquisitionData = {
  acquisitionByMonth: { period: string; newCustomers: number }[];
  amountDistribution: { bucket: string; count: number }[];
  totalCustomers: number;
};

export type AnalyticsRemindersData = {
  byChannel: { channel: string; total: number; sent: number; pending: number }[];
  totalSent: number;
  totalPending: number;
  sentByMonth: { period: string; sentCount: number }[];
};

export type AnalyticsSection = {
  id: string;
  name: string;
  description?: string;
  requiredRole: string;
  data:
    | AnalyticsOverviewData
    | { agingBuckets: AnalyticsAgingBucket[] }
    | AnalyticsPaymentsTrendData
    | AnalyticsCreditFunnelData
    | AnalyticsBestCustomersData
    | AnalyticsCustomerAcquisitionData
    | AnalyticsRemindersData;
};

export async function getAnalyticsAction(): Promise<AnalyticsSection[]> {
  const token = await getAuthToken();
  if (!token) return [];
  try {
    const { data } = await axios.get<AnalyticsSection[]>(getApiUrl('/api/v1/analytics'), {
      headers: { Authorization: `Bearer ${token}` },
    });
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
