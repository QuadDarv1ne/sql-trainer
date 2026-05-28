import { withTeacherAuth } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { getChurnPredictions } from '@/lib/db-users';

export const GET = withTeacherAuth(async ({ request }) => {
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get('limit')) || 50;
  const predictions = getChurnPredictions(Math.min(limit, 500));
  return NextResponse.json({ predictions });
});
