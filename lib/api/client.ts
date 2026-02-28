import axios, { type AxiosInstance } from 'axios';
import { getApiBaseUrl } from './config';

export function createApiClient(token?: string | null): AxiosInstance {
  const client = axios.create({
    baseURL: getApiBaseUrl(),
    headers: { 'Content-Type': 'application/json' },
  });
  if (token) {
    client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  return client;
}
