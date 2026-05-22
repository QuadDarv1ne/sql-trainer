/**
 * Reusable auth check helpers for API routes.
 * Reduces boilerplate for session validation and role checks.
 */
import { auth } from '@/lib/auth-internal';
import { NextResponse } from 'next/server';
import type { UserRole } from '@/lib/db-users';
import type { Role } from '@/lib/rbac';
import { hasRole } from '@/lib/rbac';

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
  return {
    startDate: startDate ? parseInt(startDate) : null,
    endDate: endDate ? parseInt(endDate) : null,
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

    const params = context?.params
      ? 'then' in context.params
        ? await context.params
        : context.params
      : undefined;

    return handler({ session: authResult.session, request, params });
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

    const params = context?.params
      ? 'then' in context.params
        ? await context.params
        : context.params
      : undefined;

    return handler({ session: authResult.session, request, params });
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

    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const { startDate, endDate } = parseDateParams(searchParams);

    return handler({
      session: authResult.session,
      startDate,
      endDate,
      searchParams,
    });
  };
}

/**
 * Parse a single query param as a validated integer.
 * Returns null if missing or NaN.
 */
export function intParam(searchParams: URLSearchParams, key: string): number | null {
  const val = parseInt(searchParams.get(key) || '');
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
