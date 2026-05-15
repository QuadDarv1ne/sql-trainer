import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { getTeacherStudentProgress } from '@/lib/db-users';
import type { Role } from '@/lib/rbac';
import { hasRole } from '@/lib/rbac';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userRole = (session.user as { role?: Role }).role;
  if (!userRole || !hasRole(userRole, 'teacher')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const students = getTeacherStudentProgress();
  return NextResponse.json({ students });
}
