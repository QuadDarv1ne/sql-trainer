import { NextResponse } from 'next/server';
import { createUser } from '@/lib/db-users';
import { withAdminAuth } from '@/lib/api-auth';

const VALID_ROLES = ['student', 'teacher', 'admin'] as const;

export const POST = withAdminAuth(async ({ request, session }) => {
  const body = await request.json();
  const { email, name, password, phone, role } = body;

  if (!email || !name || !password) {
    return NextResponse.json({ error: 'Missing required fields: email, name, password' }, { status: 400 });
  }

  if (typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  }

  if (typeof password !== 'string' || password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
  }

  if (role && !VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  const user = await createUser(email, name, password, phone, role || 'student', session.user.id);
  if (!user) {
    return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
  }

  return NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});
