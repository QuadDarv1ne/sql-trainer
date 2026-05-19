import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { savePushSubscription } from '@/lib/db-users';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subscription } = body;

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
    }

    savePushSubscription(session.user.id, {
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API Error] POST /api/push/subscribe:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
