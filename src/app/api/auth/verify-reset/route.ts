import { NextRequest, NextResponse } from 'next/server';
import { verifyResetCode } from '@/lib/db-users';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Код обязателен' },
        { status: 400 }
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
    const errorMsg = err instanceof Error ? err.message : 'Внутренняя ошибка сервера';
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}
