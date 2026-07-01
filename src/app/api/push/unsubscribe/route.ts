import { NextResponse } from 'next/server';
import { withUserAuthStrict } from '@/lib/api-auth';
import { RATE_LIMIT_WINDOWS } from '@/lib/rate-limit';
import { deletePushSubscription } from '@/lib/db-users';
import { z } from 'zod';
import { validateBody } from '@/lib/validation';

const unsubscribeSchema = z.object({
  endpoint: z.string().url('Invalid endpoint format'),
});

export const POST = withUserAuthStrict(
  async ({ session, request }) => {
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
  },
  { max: 10, windowMs: RATE_LIMIT_WINDOWS.oneHour },
);
