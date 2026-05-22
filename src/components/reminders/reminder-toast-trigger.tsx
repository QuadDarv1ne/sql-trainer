'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { t } from '@/lib/i18n';
import { PendingReminder } from '@/lib/db-users';
import { logger } from '@/lib/logger';

const typeLabels: Record<PendingReminder['type'], string> = {
  course: 'reminder.course',
  exam: 'reminder.exam',
  task: 'reminder.task',
  inactivity: 'reminder.inactivity',
};

export function ReminderToastTrigger() {
  const { data: session } = useSession();
  const lastSeenRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchAndToast = async () => {
      try {
        const res = await fetch('/api/user/reminders');
        const data = await res.json();
        if (!res.ok || !data.reminders) return;

        const reminders: PendingReminder[] = data.reminders;
        for (const r of reminders) {
          if (!lastSeenRef.current.has(r.id)) {
            lastSeenRef.current.add(r.id);

            const hoursLeft = r.hours_until_due;
            let description = '';
            if (r.is_overdue) {
              description = t('reminder.overdue');
            } else if (hoursLeft < 0) {
              description = t('reminder.dueSoon');
            } else if (hoursLeft < 24) {
              description = t('reminder.hoursLeft', { hours: String(hoursLeft) });
            } else {
              const days = Math.round(hoursLeft / 24);
              description = `${days} дн.`;
            }

            toast.warning(r.title, {
              description: `${t(typeLabels[r.type])} &middot; ${description}`,
              duration: 8000,
            });
          }
        }
      } catch (err) {
        logger.error('fetch reminders:', err);
      }
    };

    // Show on mount
    fetchAndToast();

    // Poll every 5 minutes
    const interval = setInterval(fetchAndToast, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [session]);

  return null;
}
