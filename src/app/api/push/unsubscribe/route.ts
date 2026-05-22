import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { deletePushSubscription } from '@/lib/db-users';
import { logger } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit: 10 unsubscriptions per hour per user
    const limit = rateLimit(`push-unsubscribe:${session.user.id}`, { max: 10, windowMs: 60 * 60 * 1000 });
    if (!limit.success) {
      return NextResponse.json({ error: 'Too many requests. Try again later' }, { status: 429 });
    }

    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
    }

    deletePushSubscription(session.user.id, endpoint);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('POST /api/push/unsubscribe:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
