import { NextResponse } from 'next/server';
import { logger } from './logger';

export interface ApiErrorResponse {
  error: string;
  correlationId: string;
}

export function generateCorrelationId(): string {
  return crypto.randomUUID().slice(0, 8);
}

export function apiError(
  message: string,
  status: number,
  correlationId?: string,
  error?: unknown,
): NextResponse<ApiErrorResponse> {
  const id = correlationId || generateCorrelationId();
  logger.error(`[${id}] ${message}`, error);
  return NextResponse.json({ error: message, correlationId: id }, { status });
}

export function apiServerError(
  context: string,
  correlationId?: string,
  error?: unknown,
): NextResponse<ApiErrorResponse> {
  const id = correlationId || generateCorrelationId();
  logger.error(`[${id}] ${context} failed`, error);
  return NextResponse.json({ error: 'Internal server error', correlationId: id }, { status: 500 });
}
