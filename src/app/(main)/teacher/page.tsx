'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import TeacherDashboard from '@/components/teacher/teacher-dashboard';
import { t } from '@/lib/i18n';
import type { Role } from '@/lib/rbac';

export default function TeacherPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const authorized = useMemo(() => {
    if (status === 'loading') return false;
    const userRole = (session?.user as { role?: Role })?.role;
    if (userRole !== 'teacher' && userRole !== 'admin') {
      router.push('/app');
      return false;
    }
    return true;
  }, [session, status, router]);

  if (!authorized) return null;

  return (
    <div className="h-full overflow-auto bg-gradient-to-b from-background to-muted/20">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        {/* Page Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">{t('teacher.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('teacher.subtitle', { default: 'Отслеживание прогресса студентов и аналитика класса' })}</p>
        </div>
        <TeacherDashboard />
      </div>
    </div>
  );
}
