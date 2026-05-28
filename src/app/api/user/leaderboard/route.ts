import { withUserAuth } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { getLeaderboard } from '@/lib/db-users';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export const GET = withUserAuth(async ({ request }) => {
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(url.searchParams.get('limit') || String(DEFAULT_LIMIT))));
  const offset = (page - 1) * limit;

  const leaderboard = getLeaderboard(limit, offset);
  return NextResponse.json({ success: true, leaderboard, page, limit });
});
