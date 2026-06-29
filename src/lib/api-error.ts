import { NextResponse } from 'next/server';
import { logger } from './logger';

export interface ApiErrorResponse {
  error: string;
  correlationId: string;
  details?: string;
}

export function generateCorrelationId(): string {
  return crypto.randomUUID().slice(0, 8);
}

/**
 * Format an error message for API responses.
 * Avoids leaking internal details in production.
 */
function formatErrorMessage(context: string, error: unknown, isDev: boolean): string {
  if (!isDev) return 'An unexpected error occurred';

  const message = error instanceof Error ? error.message : String(error);
  return `[${context}] ${message}`;
}

export function apiError(
  message: string,
  status: number,
  correlationId?: string,
  error?: unknown,
): NextResponse<ApiErrorResponse> {
  const id = correlationId || generateCorrelationId();
  logger.error(`[${id}] ${message}`, error);
  return NextResponse.json(
    { error: message, correlationId: id, details: error instanceof Error ? error.message : undefined },
    { status },
  );
}

export function apiServerError(
  context: string,
  correlationId?: string,
  error?: unknown,
): NextResponse<ApiErrorResponse> {
  const id = correlationId || generateCorrelationId();
  const isDev = process.env.NODE_ENV === 'development';
  const message = formatErrorMessage(context, error, isDev);
  logger.error(`[${id}] ${context} failed`, error);
  return NextResponse.json(
    { error: 'Internal server error', correlationId: id, details: isDev ? message : undefined },
    { status: 500 },
  );
}
