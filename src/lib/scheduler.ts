/**
 * Heartbeat-based scheduler — processes due reminders and emails without external cron.
 * Called periodically from API routes to trigger reminder processing.
 */
import {
  getDueReminders,
  markScheduleSent,
  markScheduleFailed,
  getNotificationPreferences,
  getDb,
  queueEmail,
} from './db-users';
import { processEmailQueue, renderReminderEmail } from './email';
import { sendPushToUser } from './push-notifications';
import { logger } from './logger';

let lastTick = 0;
const TICK_INTERVAL_MS = 60_000; // Check every 60 seconds

export async function heartbeat(): Promise<{
  processed_reminders: number;
  processed_emails_sent: number;
  processed_emails_failed: number;
}> {
  const now = Date.now();
  if (now - lastTick < TICK_INTERVAL_MS) {
    return { processed_reminders: 0, processed_emails_sent: 0, processed_emails_failed: 0 };
  }
  lastTick = now;

  const remindersProcessed = processDueReminders();
  const emailResult = await processEmailQueue();

  return {
    processed_reminders: remindersProcessed,
    processed_emails_sent: emailResult.sent,
    processed_emails_failed: emailResult.failed,
  };
}

/**
 * Process all due reminder schedule entries.
 * Dispatches by channel: email/push. In-app is handled by client polling.
 * Uses SQLite BEGIN IMMEDIATE for multi-instance safety.
 */
function processDueReminders(): number {
  const db = getDb();

  // Use exclusive lock to prevent duplicate processing across instances
  db.prepare('BEGIN IMMEDIATE').run();

  try {
    const reminders = getDueReminders();
    if (reminders.length === 0) {
      db.prepare('ROLLBACK').run();
      return 0;
    }

    let processed = 0;

    for (const reminder of reminders) {
      try {
        if (reminder.channel === 'in_app') {
          // In-app reminders are handled by client polling via getPendingReminders
          // Just mark as sent so they show up in the client
          markScheduleSent(reminder.id);
          processed++;
        } else if (reminder.channel === 'email') {
          // Get user preferences to check if email is enabled
          const prefs = getNotificationPreferences(reminder.user_id);
          let channels: string[];
          try {
            channels = JSON.parse(prefs.channels_enabled);
          } catch {
            channels = ['in_app'];
          }
          if (!channels.includes('email')) {
            markScheduleSent(reminder.id);
            processed++;
            continue;
          }

          // Get deadline info for email content
          const deadline = db.prepare('SELECT * FROM deadlines WHERE id = ?').get(reminder.deadline_id) as
            | {
                title: string;
                type: string;
                due_at: number;
              }
            | undefined;

          if (deadline) {
            const now = Date.now();
            const html = renderReminderEmail({
              title: deadline.title,
              type: deadline.type,
              due_at: deadline.due_at,
              is_overdue: deadline.due_at < now,
            });

            const subject = `SQL Trainer: ${deadline.title}`;
            // Queue the email for async processing
            queueEmail(reminder.user_id, subject, html, reminder.trigger_at);
          }

          markScheduleSent(reminder.id);
          processed++;
        } else if (reminder.channel === 'push') {
          // Get user preferences to check if push is enabled
          const prefs = getNotificationPreferences(reminder.user_id);
          let channels: string[];
          try {
            channels = JSON.parse(prefs.channels_enabled);
          } catch {
            channels = ['in_app'];
          }
          if (!channels.includes('push')) {
            markScheduleSent(reminder.id);
            processed++;
            continue;
          }

          // Get deadline info for push content
          const deadline = db.prepare('SELECT * FROM deadlines WHERE id = ?').get(reminder.deadline_id) as
            | {
                title: string;
                type: string;
                due_at: number;
              }
            | undefined;

          if (deadline) {
            const now = Date.now();
            const isOverdue = deadline.due_at < now;
            const hoursLeft = Math.round((deadline.due_at - now) / 3600000);
            const body = isOverdue
              ? 'Overdue'
              : hoursLeft < 24
                ? `${hoursLeft} hour(s) left`
                : `${Math.round(hoursLeft / 24)} day(s) left`;

            sendPushToUser(reminder.user_id, deadline.title, body, {
              deadlineId: reminder.deadline_id,
              type: deadline.type,
            }).catch(() => {
              // Fire and forget for push errors
            });
          }

          markScheduleSent(reminder.id);
          processed++;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        markScheduleFailed(reminder.id, message);
      }
    }

    db.prepare('COMMIT').run();
    return processed;
  } catch (error) {
    db.prepare('ROLLBACK').run();
    logger.error('Scheduler process due reminders:', error);
    return 0;
  }
}
