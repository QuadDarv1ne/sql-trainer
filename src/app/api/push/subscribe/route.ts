import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { savePushSubscription } from '@/lib/db-users';
import { logger } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit: 10 subscriptions per hour per user
    const limit = rateLimit(`push-subscribe:${session.user.id}`, { max: 10, windowMs: 60 * 60 * 1000 });
    if (!limit.success) {
      return NextResponse.json({ error: 'Too many requests. Try again later' }, { status: 429 });
    }

    const body = await request.json();
    const { subscription } = body;

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
    }

    savePushSubscription(session.user.id, {
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('POST /api/push/subscribe:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
