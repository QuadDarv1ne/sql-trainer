import { NextRequest, NextResponse } from 'next/server';
import { verifyResetCode } from '@/lib/db-users';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const verifyResetSchema = z.object({
  code: z.string().min(1, 'Код обязателен'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = verifyResetSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0]?.message ?? 'Неверный формат данных' },
        { status: 400 }
      );
    }

    const { code } = validation.data;

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
