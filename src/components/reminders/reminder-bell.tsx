'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Bell } from 'lucide-react';
import { t } from '@/lib/i18n';
import { PendingReminder } from '@/lib/db-users';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

const typeIcons: Record<PendingReminder['type'], string> = {
  course: '\U0001F4DA',
  exam: '\U0001F4DD',
  task: '\u270F\uFE0F',
  inactivity: '\u26A0\uFE0F',
};

const typeLabels: Record<PendingReminder['type'], string> = {
  course: 'reminder.course',
  exam: 'reminder.exam',
  task: 'reminder.task',
  inactivity: 'reminder.inactivity',
};

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ReminderBell() {
  const { data: session } = useSession();
  const [reminders, setReminders] = useState<PendingReminder[]>([]);
  const [open, setOpen] = useState(false);

  const fetchReminders = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const res = await fetch('/api/user/reminders');
      const data = await res.json();
      if (res.ok) setReminders(data.reminders || []);
    } catch (err) {
      console.error(err);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchReminders();
    const interval = setInterval(fetchReminders, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [session, session?.user?.id, fetchReminders]);

  if (!session) return null;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {reminders.length > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {reminders.length > 9 ? '9+' : reminders.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-auto">
        {reminders.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground text-sm">
            {t('reminder.noReminders')}
          </div>
        ) : (
          <div className="py-2">
            {reminders.map(r => (
              <div
                key={r.id}
                className="px-4 py-3 border-b last:border-b-0 hover:bg-accent cursor-pointer"
                onClick={() => {
                  setReminders(prev => prev.filter(x => x.id !== r.id));
                }}
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg">{typeIcons[r.type]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{r.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {t(typeLabels[r.type])} &middot; {formatDate(r.due_at)}
                    </p>
                    {r.description && (
                      <p className="text-xs text-muted-foreground mt-1">{r.description}</p>
                    )}
                  </div>
                  {r.is_overdue && (
                    <Badge variant="destructive" className="text-xs">{t('reminder.overdue')}</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
