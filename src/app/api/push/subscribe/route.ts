import { NextResponse } from 'next/server';
import { withUserAuthStrict } from '@/lib/api-auth';
import { RATE_LIMIT_WINDOWS } from '@/lib/rate-limit';
import { parseAndValidate } from '@/lib/validation';
import { z } from 'zod';
import { savePushSubscription } from '@/lib/db-users';
import { logger } from '@/lib/logger';

const pushSubscribeSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url('Invalid subscription endpoint'),
    keys: z.object({
      p256dh: z.string().min(1, 'p256dh key is required'),
      auth: z.string().min(1, 'auth key is required'),
    }),
  }),
});

export const POST = withUserAuthStrict(
  async ({ session, request }) => {
    const result = await parseAndValidate(request, pushSubscribeSchema);
    if ('response' in result) return result.response;

    const { subscription } = result.data;

    try {
      savePushSubscription(session.user.id, {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      });
    } catch (dbError) {
      logger.error('savePushSubscription failed:', dbError);
      return NextResponse.json({ success: false, error: 'Failed to save subscription' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  },
  { max: 10, windowMs: RATE_LIMIT_WINDOWS.oneHour },
);
