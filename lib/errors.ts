/**
 * Centralized error handling: convert technical errors into user-friendly messages.
 * Prevents stack traces, internal paths, and developer jargon from reaching users.
 */

import axios from 'axios';

/** Technical patterns we never want to show to users */
const TECHNICAL_PATTERNS = [
  /stack\s*trace/i,
  /at\s+[\w.$]+\s*\(/,
  /\n\s+at\s+/,
  /AxiosError|TypeError|ReferenceError|SyntaxError/,
  /Request failed with status code \d+/,
  /ECONNREFUSED|ENOTFOUND|ETIMEDOUT|ECONNRESET|ENETUNREACH/,
  /localhost|127\.0\.0\.1|:\d{4,5}/,
  /java\.|org\.|com\.|SELECT|INSERT|UPDATE|DELETE|org\.hibernate|SQLException/,
  /Error:\s*$/,
];

function looksTechnical(msg: string): boolean {
  if (!msg || msg.length > 200) return true;
  return TECHNICAL_PATTERNS.some((re) => re.test(msg));
}

function extractApiMessage(err: unknown): string | null {
  if (!axios.isAxiosError(err) || !err.response?.data) return null;
  const d = err.response.data as Record<string, unknown>;
  const raw = d.message ?? d.error ?? d.msg ?? d.detail;
  if (!raw) return null;
  const msg = Array.isArray(raw) ? (raw[0] && typeof raw[0] === 'string' ? raw[0] : null) : typeof raw === 'string' ? raw : null;
  if (!msg || looksTechnical(msg)) return null;
  return msg;
}

const STATUS_MESSAGES: Record<number, string> = {
  400: 'Invalid request. Please check your input and try again.',
  401: 'Your session has expired. Please sign in again.',
  403: 'You don\'t have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'This action conflicts with current data. Please refresh and try again.',
  422: 'The data you entered could not be processed. Please check and try again.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'Something went wrong on our end. Please try again later.',
  502: 'The service is temporarily unavailable. Please try again soon.',
  503: 'The service is temporarily unavailable. Please try again soon.',
};

/**
 * Convert any error into a user-friendly message. Use this whenever displaying
 * errors to end users.
 */
export function toUserFriendlyMessage(err: unknown, fallback: string): string {
  // 1. Try API response body (if it looks safe)
  const apiMsg = extractApiMessage(err);
  if (apiMsg) return apiMsg;

  // 2. Map HTTP status to friendly message
  if (axios.isAxiosError(err) && err.response?.status) {
    const statusMsg = STATUS_MESSAGES[err.response.status];
    if (statusMsg) return statusMsg;
  }

  // 3. Network / connection errors
  if (axios.isAxiosError(err)) {
    const code = (err as { code?: string }).code;
    const msg = String(err.message || '').toLowerCase();
    if (code === 'ERR_NETWORK' || msg.includes('network') || msg.includes('failed to fetch')) {
      return 'Unable to connect. Please check your internet connection and try again.';
    }
    if (code === 'ECONNABORTED' || msg.includes('timeout')) {
      return 'The request took too long. Please try again.';
    }
  }

  // 4. Standard Error with message - only if not technical
  if (err instanceof Error && err.message) {
    if (!looksTechnical(err.message)) return err.message;
  }

  return fallback;
}
