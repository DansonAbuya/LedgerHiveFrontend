const FALLBACK_BASE = 'http://localhost:8080';

export function getApiBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_URL || FALLBACK_BASE;
  return base;
}

/** Build full API URL using WHATWG URL API (avoids url.parse() deprecation). */
export function getApiUrl(path: string): string {
  const base = getApiBaseUrl();
  try {
    return new URL(path, base.endsWith('/') ? base : `${base}/`).toString();
  } catch {
    return `${base.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
  }
}
