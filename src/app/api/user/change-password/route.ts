import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { findUserByEmail, updatePassword } from '@/lib/db-users';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Не авторизован' }, { status: 401 });
  }

  const body = await request.json();
  const { currentPassword, newPassword } = body;

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { success: false, error: 'Текущий и новый пароли обязательны' },
      { status: 400 }
    );
  }

  if (newPassword.length < 6) {
    return NextResponse.json(
      { success: false, error: 'Пароль должен содержать минимум 6 символов' },
      { status: 400 }
    );
  }

  // Verify current password
  const user = await findUserByEmail(session.user.email);
  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Пользователь не найден' },
      { status: 404 }
    );
  }

  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) {
    return NextResponse.json(
      { success: false, error: 'Неверный текущий пароль' },
      { status: 400 }
    );
  }

  // Update password
  const updated = await updatePassword(user.id, newPassword);
  if (!updated) {
    return NextResponse.json(
      { success: false, error: 'Не удалось обновить пароль' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, message: 'Пароль успешно изменён' });
}
