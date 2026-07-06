import { NextResponse } from 'next/server';
import { withUserAuthStrict } from '@/lib/api-auth';
import { RATE_LIMIT_WINDOWS } from '@/lib/rate-limit';
import { deletePushSubscription } from '@/lib/db-users';
import { z } from 'zod';
import { parseAndValidate } from '@/lib/validation';

const unsubscribeSchema = z.object({
  endpoint: z.string().url('Invalid endpoint format'),
});

export const POST = withUserAuthStrict(
  async ({ session, request }) => {
    const validation = await parseAndValidate(request, unsubscribeSchema);
    if ('response' in validation) return validation.response;

    const { endpoint } = validation.data;

    deletePushSubscription(session.user.id, endpoint);
    return NextResponse.json({ success: true });
  },
  { max: 10, windowMs: RATE_LIMIT_WINDOWS.oneHour },
);
