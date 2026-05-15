import { NextResponse } from 'next/server';
import { getLeaderboard } from '@/lib/db-users';

export async function GET() {
  try {
    const leaderboard = getLeaderboard(50);
    return NextResponse.json({ success: true, leaderboard });
  } catch (error) {
    console.error('[API Error] GET /api/user/leaderboard:', error);
    return NextResponse.json({ success: false, error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
