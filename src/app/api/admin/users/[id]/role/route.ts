import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { updateUserRole } from '@/lib/db-users';
import type { UserRole } from '@/lib/db-users';
import type { Role as RBACRole } from '@/lib/rbac';
import { hasRole } from '@/lib/rbac';

const VALID_ROLES: UserRole[] = ['student', 'teacher', 'admin'];

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as { role?: RBACRole }).role;
    if (!userRole || !hasRole(userRole, 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { role } = body;

    if (!role || !VALID_ROLES.includes(role as UserRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const success = updateUserRole(id, role as UserRole);
    if (!success) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, role });
  } catch (error) {
    console.error('[API Error] PUT /api/admin/users/[id]/role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
