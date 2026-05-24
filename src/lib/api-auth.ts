/**
 * Reusable auth check helpers for API routes.
 * Reduces boilerplate for session validation and role checks.
 */
import { auth } from '@/lib/auth-internal';
import { NextResponse } from 'next/server';
import type { UserRole } from '@/lib/db-users';
import type { Role } from '@/lib/rbac';
import { hasRole } from '@/lib/rbac';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

interface AuthSession {
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    role: UserRole;
  };
}

export async function requireAdmin() {
  const session = (await auth()) as AuthSession | null;
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), session: null };
  }
  const userRole = session.user.role;
  if (!userRole || !hasRole(userRole, 'admin')) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), session: null };
  }
  return { error: null, session };
}

export async function requireTeacher() {
  const session = (await auth()) as AuthSession | null;
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), session: null };
  }
  const userRole = session.user.role;
  if (!userRole || !hasRole(userRole, 'teacher')) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), session: null };
  }
  return { error: null, session };
}

export function parseDateParams(searchParams: URLSearchParams) {
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const start = startDate ? parseInt(startDate, 10) : NaN;
  const end = endDate ? parseInt(endDate, 10) : NaN;
  return {
    startDate: isNaN(start) ? null : start,
    endDate: isNaN(end) ? null : end,
  };
}

type RouteHandlerContext = {
  session: AuthSession;
  request: Request;
  params?: Record<string, string>;
};

type AnalyticsHandlerContext = {
  session: AuthSession;
  startDate: number | null;
  endDate: number | null;
  searchParams: URLSearchParams;
};

export function withAdminAuth(
  handler: (ctx: RouteHandlerContext) => Promise<NextResponse>
) {
  return async (
    request: Request,
    context?: { params?: Promise<Record<string, string>> | Record<string, string> }
  ): Promise<NextResponse> => {
    const authResult = await requireAdmin();
    if (!authResult.session) {
      return authResult.error ?? NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }

    // Rate limit admin requests: 30 per minute per user
    const userId = authResult.session.user.id;
    const limitResult = rateLimit(`admin:${userId}`, { max: 30, windowMs: 60_000 });
    if (!limitResult.success) {
      return NextResponse.json({ error: 'Слишком много запросов. Подождите немного' }, { status: 429 });
    }

    const params = context?.params
      ? 'then' in context.params
        ? await context.params
        : context.params
      : undefined;

    try {
      return await handler({ session: authResult.session, request, params });
    } catch (error) {
      logger.error('Admin handler error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  };
}

export function withTeacherAuth(
  handler: (ctx: RouteHandlerContext) => Promise<NextResponse>
) {
  return async (
    request: Request,
    context?: { params?: Promise<Record<string, string>> | Record<string, string> }
  ): Promise<NextResponse> => {
    const authResult = await requireTeacher();
    if (!authResult.session) {
      return authResult.error ?? NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }

    // Rate limit teacher requests: 30 per minute per user
    const userId = authResult.session.user.id;
    const limitResult = rateLimit(`teacher:${userId}`, { max: 30, windowMs: 60_000 });
    if (!limitResult.success) {
      return NextResponse.json({ error: 'Слишком много запросов. Подождите немного' }, { status: 429 });
    }

    const params = context?.params
      ? 'then' in context.params
        ? await context.params
        : context.params
      : undefined;

    try {
      return await handler({ session: authResult.session, request, params });
    } catch (error) {
      logger.error('Teacher handler error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  };
}

/**
 * Higher-order wrapper for analytics GET routes.
 * Handles admin auth + date param parsing in one call.
 * Replaces the ~18 lines of boilerplate repeated across 50+ analytics routes.
 */
export function withAnalyticsAuth(
  handler: (ctx: AnalyticsHandlerContext) => NextResponse | Promise<NextResponse>
) {
  return async (request: Request): Promise<NextResponse> => {
    const authResult = await requireAdmin();
    if (!authResult.session) {
      return authResult.error ?? NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }

    // Rate limit analytics requests: 30 per minute per user
    const userId = authResult.session.user.id;
    const limitResult = rateLimit(`analytics:${userId}`, { max: 30, windowMs: 60_000 });
    if (!limitResult.success) {
      return NextResponse.json({ error: 'Слишком много запросов. Подождите немного' }, { status: 429 });
    }

    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const { startDate, endDate } = parseDateParams(searchParams);

    try {
      return await handler({
        session: authResult.session,
        startDate,
        endDate,
        searchParams,
      });
    } catch (error) {
      logger.error('Analytics handler error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  };
}

/**
 * Parse a single query param as a validated integer.
 * Returns null if missing or NaN.
 */
export function intParam(searchParams: URLSearchParams, key: string): number | null {
  const val = parseInt(searchParams.get(key) || '', 10);
  return isNaN(val) ? null : val;
}

/**
 * Parse a single query param as a validated positive integer with optional max.
 */
export function positiveIntParam(searchParams: URLSearchParams, key: string, max?: number): number | null {
  const val = intParam(searchParams, key);
  if (val === null || val <= 0) return null;
  if (max !== undefined && val > max) return max;
  return val;
}
