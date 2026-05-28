import { withTeacherAuth } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { getStudentEngagementMetrics } from '@/lib/db-users';

const MAX_LIMIT = 500;

export const GET = withTeacherAuth(async ({ request }) => {
  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get('limit')) || 50, MAX_LIMIT);
  const metrics = getStudentEngagementMetrics(limit);
  return NextResponse.json({ metrics });
});
