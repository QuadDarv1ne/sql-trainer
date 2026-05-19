import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { updateDeadline, deleteDeadline, getDeadlineById } from '@/lib/db-users';
import type { Role } from '@/lib/rbac';
import { hasRole } from '@/lib/rbac';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as { role?: Role }).role;
    if (!userRole || !hasRole(userRole, 'teacher')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const existing = getDeadlineById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Deadline not found' }, { status: 404 });
    }

    const body = await request.json();
    const success = updateDeadline(id, body, session.user.id);
    if (!success) {
      return NextResponse.json({ error: 'Forbidden or not found' }, { status: 403 });
    }

    const updated = getDeadlineById(id);
    return NextResponse.json({ success: true, deadline: updated });
  } catch (error) {
    console.error('[API Error] PUT /api/admin/deadlines/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as { role?: Role }).role;
    if (!userRole || !hasRole(userRole, 'teacher')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const success = deleteDeadline(id, session.user.id);
    if (!success) {
      return NextResponse.json({ error: 'Deadline not found or forbidden' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API Error] DELETE /api/admin/deadlines/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
