'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import { ReminderToastTrigger } from '@/components/reminders/reminder-toast-trigger';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <ReminderToastTrigger />
    </SessionProvider>
  );
}
