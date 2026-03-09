'use server';

import axios from 'axios';
import { getApiUrl } from '@/lib/api/config';
import { getAuthToken } from './auth';
import { toUserFriendlyMessage } from '@/lib/errors';

export type IntegrationApiKey = {
  id: string;
  tenantId: string;
  name: string;
  scopes: string;
  createdAt: string;
  revokedAt?: string | null;
  lastUsedAt?: string | null;
  apiKey?: string; // only on create
};

export type IntegrationWebhook = {
  id: string;
  tenantId: string;
  name: string;
  url: string;
  events: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  secret?: string; // only on create
};

export async function listIntegrationApiKeysAction(): Promise<IntegrationApiKey[]> {
  const token = await getAuthToken();
  if (!token) return [];
  const { data } = await axios.get<IntegrationApiKey[]>(
    getApiUrl('/api/v1/integrations/api-keys'),
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data ?? [];
}

export async function createIntegrationApiKeyAction(input: {
  name: string;
  scopes?: string;
}): Promise<IntegrationApiKey> {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');
  try {
    const { data } = await axios.post<IntegrationApiKey>(
      getApiUrl('/api/v1/integrations/api-keys'),
      { name: input.name, scopes: input.scopes ?? '' },
      { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
    );
    return data;
  } catch (err: any) {
    throw new Error(axios.isAxiosError(err) ? getErrorMessage(err, 'Failed to create API key') : 'Failed to create API key');
  }
}

export async function revokeIntegrationApiKeyAction(id: string): Promise<boolean> {
  const token = await getAuthToken();
  if (!token) return false;
  await axios.delete(getApiUrl(`/api/v1/integrations/api-keys/${id}`), {
    headers: { Authorization: `Bearer ${token}` },
  });
  return true;
}

export async function listIntegrationWebhooksAction(): Promise<IntegrationWebhook[]> {
  const token = await getAuthToken();
  if (!token) return [];
  const { data } = await axios.get<IntegrationWebhook[]>(
    getApiUrl('/api/v1/integrations/webhooks'),
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data ?? [];
}

export async function createIntegrationWebhookAction(input: {
  name: string;
  url: string;
  events?: string;
  secret?: string;
}): Promise<IntegrationWebhook> {
  const token = await getAuthToken();
  if (!token) throw new Error('Please sign in to continue.');
  try {
    const { data } = await axios.post<IntegrationWebhook>(
      getApiUrl('/api/v1/integrations/webhooks'),
      { name: input.name, url: input.url, events: input.events ?? '', secret: input.secret ?? '' },
      { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
    );
    return data;
  } catch (err) {
    throw new Error(toUserFriendlyMessage(err, 'Could not create webhook. Please try again.'));
  }
}

export async function deleteIntegrationWebhookAction(id: string): Promise<boolean> {
  const token = await getAuthToken();
  if (!token) return false;
  await axios.delete(getApiUrl(`/api/v1/integrations/webhooks/${id}`), {
    headers: { Authorization: `Bearer ${token}` },
  });
  return true;
}

