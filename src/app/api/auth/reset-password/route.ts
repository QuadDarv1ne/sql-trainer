import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail, createResetCode, updatePassword, verifyResetCode, getUserById } from '@/lib/db-users';

// Request password reset code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email обязателен' },
        { status: 400 }
      );
    }

    const user = await findUserByEmail(email);
    if (!user) {
      // Don't reveal whether email exists
      return NextResponse.json({ success: true, message: 'Если email зарегистрирован, код отправлен' });
    }

    const code = await createResetCode(user.id, 'email');

    // MVP: Return code in response (in production, send via email)
    return NextResponse.json({
      success: true,
      message: 'Код восстановления отправлен (MVP: см. в ответе)',
      devCode: code,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Внутренняя ошибка сервера';
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}

// Reset password with code
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, newPassword } = body;

    if (!code || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Код и новый пароль обязательны' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Пароль должен содержать минимум 6 символов' },
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

    const updated = await updatePassword(result.userId, newPassword);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Не удалось обновить пароль' },
        { status: 500 }
      );
    }

    const user = await getUserById(result.userId);
    return NextResponse.json({
      success: true,
      message: 'Пароль успешно изменён',
      user: user ? { id: user.id, name: user.name, email: user.email } : null,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Внутренняя ошибка сервера';
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}
