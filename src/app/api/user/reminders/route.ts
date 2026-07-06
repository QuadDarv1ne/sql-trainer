import { withUserAuth } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { getPendingReminders, logReminderDelivery } from '@/lib/db-users';

export const GET = withUserAuth(async ({ session }) => {
  const reminders = getPendingReminders(session.user.id);

  for (const reminder of reminders) {
    logReminderDelivery(reminder.deadline_id, session.user.id, 'in_app');
  }

  return NextResponse.json({ success: true, reminders, count: reminders.length });
});
