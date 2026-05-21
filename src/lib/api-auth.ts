/**
 * Reusable auth check helpers for API routes.
 * Reduces boilerplate for session validation and role checks.
 */
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { Role } from '@/lib/rbac';
import { hasRole } from '@/lib/rbac';

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), session: null };
  }
  const userRole = (session.user as { role?: Role }).role;
  if (!userRole || !hasRole(userRole, 'admin')) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), session: null };
  }
  return { error: null, session };
}

export async function requireTeacher() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), session: null };
  }
  const userRole = (session.user as { role?: Role }).role;
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

/**
 * Higher-order function that wraps an API route handler with admin auth check.
 * Eliminates 7 lines of duplicated auth boilerplate per route.
 *
 * Usage:
 *   export const GET = withAdminAuth(async ({ session, request }) => {
 *     // handler logic — session is guaranteed to be valid admin
 *     return NextResponse.json({ data: 'ok' });
 *   });
 */
type RouteHandlerContext = {
  session: NonNullable<Awaited<ReturnType<typeof auth>>>;
  request: Request;
  params?: Record<string, string>;
};

export function withAdminAuth(
  handler: (ctx: RouteHandlerContext) => Promise<NextResponse>
) {
  return async (
    request: Request,
    context?: { params?: Promise<Record<string, string>> | Record<string, string> }
  ): Promise<NextResponse> => {
    const authResult = await requireAdmin();
    if (authResult.error) return authResult.error;

    const params = context?.params
      ? 'then' in context.params
        ? await context.params
        : context.params
      : undefined;

    return handler({ session: authResult.session!, request, params });
  };
}

/**
 * Same as withAdminAuth but for teacher role.
 */
export function withTeacherAuth(
  handler: (ctx: RouteHandlerContext) => Promise<NextResponse>
) {
  return async (
    request: Request,
    context?: { params?: Promise<Record<string, string>> | Record<string, string> }
  ): Promise<NextResponse> => {
    const authResult = await requireTeacher();
    if (authResult.error) return authResult.error;

    const params = context?.params
      ? 'then' in context.params
        ? await context.params
        : context.params
      : undefined;

    return handler({ session: authResult.session!, request, params });
  };
}
