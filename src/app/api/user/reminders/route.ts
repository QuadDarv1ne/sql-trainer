import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { getPendingReminders, logReminderDelivery } from '@/lib/db-users';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reminders = getPendingReminders(session.user.id);

    // Log in-app delivery for each reminder
    for (const reminder of reminders) {
      logReminderDelivery(reminder.deadline_id, session.user.id, 'in_app');
    }

    return NextResponse.json({ reminders, count: reminders.length });
  } catch (error) {
    console.error('[API Error] GET /api/user/reminders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
