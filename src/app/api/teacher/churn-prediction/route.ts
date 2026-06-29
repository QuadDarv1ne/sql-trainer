import { withTeacherAuth } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { getChurnPredictions } from '@/lib/db-users';

export const GET = withTeacherAuth(async ({ request }) => {
  const url = new URL(request.url);
  const raw = Number(url.searchParams.get('limit'));
  const limit = Number.isFinite(raw) && raw > 0 ? Math.min(raw, 500) : 50;
  const predictions = getChurnPredictions(limit);
  return NextResponse.json({ predictions });
});
