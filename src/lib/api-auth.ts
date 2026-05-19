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
