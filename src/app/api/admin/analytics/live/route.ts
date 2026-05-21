import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { getLiveActivity } from '@/lib/db-users';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const live = getLiveActivity();
    return NextResponse.json(live);
  } catch (error) {
    console.error('[LiveActivity] Error:', error);
    return NextResponse.json({ error: 'Failed to load live activity' }, { status: 500 });
  }
}
