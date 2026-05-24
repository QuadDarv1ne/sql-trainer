/**
 * Safe fetch with error logging and optional retry logic.
 */
import { logger } from './logger';

interface SafeFetchOptions extends RequestInit {
  maxRetries?: number;
  retryDelay?: number;
  onError?: (error: Error) => void;
}

export async function safeFetch<T = unknown>(
  url: string | URL,
  options: SafeFetchOptions = {}
): Promise<T | null> {
  const { maxRetries = 0, retryDelay = 1000, onError, ...fetchOptions } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, fetchOptions);

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
