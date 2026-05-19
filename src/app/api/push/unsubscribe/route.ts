import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { deletePushSubscription } from '@/lib/db-users';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
    }

    deletePushSubscription(session.user.id, endpoint);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API Error] POST /api/push/unsubscribe:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
