import { NextRequest, NextResponse } from 'next/server';
import { verifyResetCode } from '@/lib/db-users';
import { rateLimit, getClientIdentifier, RATE_LIMIT_WINDOWS } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { parseAndValidate } from '@/lib/validation';
import { z } from 'zod';

const verifyResetSchema = z.object({
  code: z.string().min(1, 'Code is required'),
});

export async function POST(request: NextRequest) {
  try {
    const validation = await parseAndValidate(request, verifyResetSchema);
    if ('response' in validation) return validation.response;

    const { code } = validation.data;

    // Rate limit: max 5 attempts per 15 minutes per client
    const clientId = getClientIdentifier(request);
    const rateLimitKey = `reset-verify:${clientId}`;
    const limitResult = await rateLimit(rateLimitKey, { max: 5, windowMs: RATE_LIMIT_WINDOWS.fifteenMinutes });
    if (!limitResult.success) {
      return NextResponse.json({ success: false, error: 'Too many attempts. Try again later' }, { status: 429 });
    }

    const result = await verifyResetCode(code);
    if (!result) {
      return NextResponse.json({ success: false, error: 'Invalid or expired code' }, { status: 400 });
    }

    return NextResponse.json({ success: true, type: result.type });
  } catch (err: unknown) {
    logger.error('Verify reset code error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
