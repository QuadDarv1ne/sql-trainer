import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboard } from '@/lib/db-users';
import { logger } from '@/lib/logger';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT))));
    const offset = (page - 1) * limit;

    const leaderboard = getLeaderboard(limit, offset);
    return NextResponse.json({ success: true, leaderboard, page, limit });
  } catch (error) {
    logger.error('GET /api/user/leaderboard:', error);
    return NextResponse.json({ success: false, error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
