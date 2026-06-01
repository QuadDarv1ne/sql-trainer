/**
 * Reusable auth check helpers for API routes.
 * Reduces boilerplate for session validation and role checks.
 */
import { auth } from '@/lib/auth-internal';
import { NextResponse } from 'next/server';
import type { UserRole } from '@/lib/db-users';
import { hasRole } from '@/lib/rbac';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { t } from '@/lib/i18n';

const RATE_LIMIT_MESSAGE = 'error.rateLimit';

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

/**
 * Maximum valid timestamp (~year 3000) to reject impossibly large values.
 */
const MAX_VALID_TIMESTAMP = 32503680000000; // 3000-01-01T00:00:00Z

export function parseDateParams(searchParams: URLSearchParams) {
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const start = startDate ? parseInt(startDate, 10) : NaN;
  const end = endDate ? parseInt(endDate, 10) : NaN;

  // Reject NaN, negative, or impossibly large timestamps
  if (isNaN(start) || start <= 0 || start > MAX_VALID_TIMESTAMP) {
    return { startDate: null, endDate: null };
  }
  if (isNaN(end) || end <= 0 || end > MAX_VALID_TIMESTAMP) {
    return { startDate: null, endDate: null };
  }
  // Ensure startDate <= endDate
  if (start > end) {
    return { startDate: null, endDate: null };
  }

  return { startDate: start, endDate: end };
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

/**
 * Resolve params from context, handling both sync and promise-based params
 * (Next.js 15+ uses promise-based params).
 */
async function resolveParams(
  context?: { params?: Promise<Record<string, string>> | Record<string, string> }
): Promise<Record<string, string> | undefined> {
  if (!context?.params) return undefined;
  return 'then' in context.params ? await context.params : context.params;
}

/**
 * Factory that creates a role-scoped auth wrapper with rate limiting and error handling.
 * Eliminates the near-identical withAdminAuth / withTeacherAuth implementations.
 */
function withRoleAuth(
  roleCheck: () => Promise<{ error: NextResponse | null; session: AuthSession | null }>,
  rateLimitPrefix: string,
  rateLimitMax: number,
  errorLabel: string
) {
  return function (
    handler: (ctx: RouteHandlerContext) => NextResponse | Promise<NextResponse>
  ) {
    return async (
      request: Request,
      context?: { params?: Promise<Record<string, string>> | Record<string, string> }
    ): Promise<NextResponse> => {
      const authResult = await roleCheck();
      if (!authResult.session) {
        return authResult.error ?? NextResponse.json({ error: 'Internal error' }, { status: 500 });
      }

      const userId = authResult.session.user.id;
      const limitResult = rateLimit(`${rateLimitPrefix}:${userId}`, { max: rateLimitMax, windowMs: 60_000 });
      if (!limitResult.success) {
        return NextResponse.json({ error: t(RATE_LIMIT_MESSAGE) }, { status: 429 });
      }

      const params = await resolveParams(context);

      try {
        return await handler({ session: authResult.session, request, params });
      } catch (error) {
        logger.error(`${errorLabel} handler error:`, error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }
    };
  };
}

export const withAdminAuth = withRoleAuth(requireAdmin, 'admin', 30, 'Admin');
export const withTeacherAuth = withRoleAuth(requireTeacher, 'teacher', 30, 'Teacher');

/**
 * Check that user is authenticated (no specific role required).
 */
async function requireUser() {
  const session = (await auth()) as AuthSession | null;
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), session: null };
  }
  return { error: null, session };
}

/**
 * Higher-order wrapper for any authenticated user (no specific role required).
 * Replaces manual `const session = await auth()` checks in user-facing routes.
 */
export const withUserAuth = withRoleAuth(requireUser, 'user', 60, 'User');

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
      return NextResponse.json({ error: t(RATE_LIMIT_MESSAGE) }, { status: 429 });
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
