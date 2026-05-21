import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { getPushSubscriptionStats } from '@/lib/db-users';

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const stats = getPushSubscriptionStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('[PushSubscriptions] Error:', error);
    return NextResponse.json({ error: 'Failed to load push subscription stats' }, { status: 500 });
  }
}
