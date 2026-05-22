import { NextResponse } from 'next/server';
import { getStudentAcademicSummary } from '@/lib/db-users';
import { withAdminAuth } from '@/lib/api-auth';
import { getCached, setCached, SHORT_TTL } from '@/lib/analytics-cache';

export const GET = withAdminAuth(async ({ params }) => {
  const id = params?.['id'];
  if (!id) {
    return NextResponse.json({ error: 'Student ID required' }, { status: 400 });
  }
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
});
