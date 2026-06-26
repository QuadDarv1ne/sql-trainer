/**
 * API route timing wrapper.
 * Wraps route handlers to measure execution time and log slow requests.
 *
 * Usage:
 *   export const GET = withTiming(async (req) => { ... });
 *   export const POST = withTiming(async (req) => { ... });
 */
import { NextResponse } from 'next/server';
import { logger } from './logger';

const SLOW_THRESHOLD_MS = 1000;

type RouteHandler = (req: Request, ctx?: unknown) => Promise<NextResponse>;

export function withTiming(handler: RouteHandler, routeName?: string): RouteHandler {
  return async (req: Request, ctx?: unknown) => {
    const start = performance.now();
    const method = req.method;
    const path = routeName ?? new URL(req.url).pathname;

    try {
      const response = await handler(req, ctx);
      const duration = Math.round(performance.now() - start);

      if (duration > SLOW_THRESHOLD_MS) {
        logger.warn('Slow API response', {
          method,
          path,
          status: response.status,
          duration,
        });
      }

      response.headers.set('X-Response-Time', `${duration}ms`);
      return response;
    } catch (error) {
      const duration = Math.round(performance.now() - start);
      logger.error('API route error', error, { method, path, duration });
      throw error;
    }
  };
}
