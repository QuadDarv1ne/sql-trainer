import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { findUserByEmail, getDb } from '@/lib/db-users';
import bcrypt from 'bcryptjs';

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Не авторизован' }, { status: 401 });
  }

  const body = await request.json();
  const { confirmPassword } = body;

  if (!confirmPassword) {
    return NextResponse.json(
      { success: false, error: 'Подтверждение пароля обязательно' },
      { status: 400 }
    );
  }

  // Verify password before deletion
  const user = await findUserByEmail(session.user.email);
  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Пользователь не найден' },
      { status: 404 }
    );
  }

  const valid = await bcrypt.compare(confirmPassword, user.password_hash);
  if (!valid) {
    return NextResponse.json(
      { success: false, error: 'Неверный пароль' },
      { status: 400 }
    );
  }

  // Delete user (cascade will handle related records)
  const db = getDb();
  db.prepare('DELETE FROM users WHERE id = ?').run(user.id);

  return NextResponse.json({ success: true, message: 'Аккаунт удалён' });
}
