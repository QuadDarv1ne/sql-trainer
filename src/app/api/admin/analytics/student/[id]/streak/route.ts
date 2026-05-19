import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { getStudentStreak } from '@/lib/db-users';
import type { Role } from '@/lib/rbac';
import { hasRole } from '@/lib/rbac';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userRole = (session.user as { role?: Role }).role;
  if (!userRole || !hasRole(userRole, 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  try {
    const streak = getStudentStreak(id);
    return NextResponse.json({ streak });
  } catch (error) {
    console.error('[API Error] GET /api/admin/analytics/student/[id]/streak:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
