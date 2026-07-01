import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { deletePushSubscription } from '@/lib/db-users';
import { logger } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';
import { z } from 'zod';
import { validateBody } from '@/lib/validation';

const unsubscribeSchema = z.object({
  endpoint: z.string().url('Invalid endpoint format'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit: 10 unsubscriptions per hour per user
    const limit = await rateLimit(`push-unsubscribe:${session.user.id}`, { max: 10, windowMs: 60 * 60 * 1000 });
    if (!limit.success) {
      return NextResponse.json({ error: 'Too many requests. Try again later' }, { status: 429 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON in request body' }, { status: 400 });
    }
    const validation = validateBody(body, unsubscribeSchema);
    if ('response' in validation) return validation.response;

    const { endpoint } = validation.data;

    deletePushSubscription(session.user.id, endpoint);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('POST /api/push/unsubscribe:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
