import { NextRequest, NextResponse } from 'next/server';
import { verifyResetCode } from '@/lib/db-users';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { validateBody } from '@/lib/validation';
import { z } from 'zod';

const verifyResetSchema = z.object({
  code: z.string().min(1, 'Код обязателен'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = validateBody(body, verifyResetSchema);
    if ('response' in validation) return validation.response;

    const { code } = validation.data;

    // Rate limit: max 5 attempts per 15 minutes per code prefix
    const rateLimitKey = `reset-verify:${code.substring(0, 3)}`;
    const limitResult = rateLimit(rateLimitKey, { max: 5, windowMs: 15 * 60 * 1000 });
    if (!limitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Слишком много попыток. Попробуйте позже' },
        { status: 429 }
      );
    }

    const result = await verifyResetCode(code);
    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Неверный или просроченный код' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, userId: result.userId, type: result.type });
  } catch (err: unknown) {
    logger.error('Verify reset code error:', err);
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
