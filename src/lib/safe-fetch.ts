/**
 * Safe fetch with error logging, optional retry logic, and CSRF protection.
 */
import { logger } from './logger';

const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_COOKIE_RAW = 'csrf-token-raw';
const CSRF_STATE_CHANGING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'] as const;

export function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const trimmed = cookie.trim();
    if (trimmed.startsWith(`${CSRF_COOKIE_RAW}=`)) {
      return decodeURIComponent(trimmed.slice(CSRF_COOKIE_RAW.length + 1));
    }
  }
  const meta = document.querySelector('meta[name="csrf-token"]');
  return meta?.getAttribute('content') ?? null;
}

/**
 * Returns headers with CSRF token for state-changing requests.
 * Use this with raw fetch() calls that need CSRF protection.
 */
export function csrfHeaders(init?: HeadersInit): Headers {
  const headers = new Headers(init);
  const token = getCsrfToken();
  if (token) {
    headers.set(CSRF_HEADER_NAME, token);
  }
  return headers;
}

function isStateChanging(method: string): boolean {
  return (CSRF_STATE_CHANGING_METHODS as readonly string[]).includes(method.toUpperCase());
}

interface SafeFetchOptions extends RequestInit {
  maxRetries?: number;
  retryDelay?: number;
  onError?: (error: Error) => void;
}

export async function safeFetch<T = unknown>(url: string | URL, options: SafeFetchOptions = {}): Promise<T | null> {
  const { maxRetries = 0, retryDelay = 1000, onError, headers, ...fetchOptions } = options;

  const requestHeaders = new Headers(headers);
  if (isStateChanging(fetchOptions.method || 'GET')) {
    const token = getCsrfToken();
    if (token) {
      requestHeaders.set(CSRF_HEADER_NAME, token);
    }
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, { ...fetchOptions, headers: requestHeaders });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return (await response.json()) as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)));
      }
    }
  }

  if (lastError) {
    logger.error(`[safeFetch] Failed after ${maxRetries + 1} attempts: ${lastError.message}`);
    onError?.(lastError);
  }

  return null;
}