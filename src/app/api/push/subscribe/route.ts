import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { savePushSubscription } from '@/lib/db-users';
import { logger } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';

const pushSubscribeSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url('Invalid subscription endpoint'),
    keys: z.object({
      p256dh: z.string().min(1, 'p256dh key is required'),
      auth: z.string().min(1, 'auth key is required'),
    }),
  }),
});

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
    const result = pushSubscribeSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: `Invalid subscription: ${result.error.errors[0].message}` }, { status: 400 });
    }

    const { subscription } = result.data;

    try {
      savePushSubscription(session.user.id, {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      });
    } catch (dbError) {
      logger.error('savePushSubscription failed:', dbError);
      return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('POST /api/push/subscribe:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
