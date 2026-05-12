import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { findUserByEmail, updateUser } from '@/lib/db-users';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Не авторизован' }, { status: 401 });
  }

  const body = await request.json();
  const { newEmail, password } = body;

  if (!newEmail || !password) {
    return NextResponse.json(
      { success: false, error: 'Новый email и пароль обязательны' },
      { status: 400 }
    );
  }

  // Verify password
  const user = await findUserByEmail(session.user.email);
  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Пользователь не найден' },
      { status: 404 }
    );
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return NextResponse.json(
      { success: false, error: 'Неверный пароль' },
      { status: 400 }
    );
  }

  // Check if email is already taken
  const existingUser = await findUserByEmail(newEmail);
  if (existingUser && existingUser.id !== user.id) {
    return NextResponse.json(
      { success: false, error: 'Этот email уже используется' },
      { status: 400 }
    );
  }

  // Update email
  const updated = await updateUser(user.id, { email: newEmail });
  if (!updated) {
    return NextResponse.json(
      { success: false, error: 'Не удалось обновить email' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, message: 'Email успешно изменён', email: newEmail });
}
