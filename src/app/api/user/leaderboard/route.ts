import { NextResponse } from 'next/server';
import { getLeaderboard } from '@/lib/db-users';

export async function GET() {
  const leaderboard = getLeaderboard(50);
  return NextResponse.json({ success: true, leaderboard });
}
