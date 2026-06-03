/**
 * Safe fetch with error logging, optional retry logic, and CSRF protection.
 */
import { logger } from './logger';

const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_STATE_CHANGING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'] as const;

function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const meta = document.querySelector('meta[name="csrf-token"]');
  return meta?.getAttribute('content') ?? null;
}

function isStateChanging(method: string): boolean {
  return (CSRF_STATE_CHANGING_METHODS as readonly string[]).includes(method.toUpperCase());
}

// eslint-disable-next-line no-undef -- RequestInit is a valid browser global
interface SafeFetchOptions extends RequestInit {
  maxRetries?: number;
  retryDelay?: number;
  onError?: (error: Error) => void;
}

export async function safeFetch<T = unknown>(url: string | URL, options: SafeFetchOptions = {}): Promise<T | null> {
  const { maxRetries = 0, retryDelay = 1000, onError, headers, ...fetchOptions } = options;

  // Attach CSRF token for state-changing requests
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
