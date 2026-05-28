import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { deletePushSubscription } from '@/lib/db-users';
import { logger } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

const unsubscribeSchema = z.object({
  endpoint: z.string().url('Неверный формат endpoint'),
});

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
    const validation = unsubscribeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0]?.message ?? 'Missing endpoint' }, { status: 400 });
    }

    const { endpoint } = validation.data;

    deletePushSubscription(session.user.id, endpoint);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('POST /api/push/unsubscribe:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
