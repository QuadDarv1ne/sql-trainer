import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { getStudentAcademicSummary } from '@/lib/db-users';
import type { Role } from '@/lib/rbac';
import { hasRole } from '@/lib/rbac';
import { getCached, setCached, SHORT_TTL } from '@/lib/analytics-cache';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as { role?: Role }).role;
    if (!userRole || !hasRole(userRole, 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const cacheKey = { studentId: id };
    const cached = getCached('/api/admin/analytics/student/academic-summary', cacheKey);
    if (cached) return NextResponse.json(cached);

    const data = getStudentAcademicSummary(id);
    if (!data) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const result = { academicSummary: data };
    setCached('/api/admin/analytics/student/academic-summary', cacheKey, result, SHORT_TTL);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API Error] GET /api/admin/analytics/student/[id]/academic-summary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
