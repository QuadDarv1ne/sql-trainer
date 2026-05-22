'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserTable from '@/components/admin/user-table';
import DBStats from '@/components/admin/db-stats';
import SystemHealth from '@/components/admin/system-health';
import AnalyticsDashboard from '@/components/admin/analytics-dashboard';
import LeaderboardTable from '@/components/admin/analytics/leaderboard-table';
import { DeadlineManager } from '@/components/admin/deadline-manager';
import AuditLog from '@/components/admin/audit-log';
import { t } from '@/lib/i18n';
import type { Role } from '@/lib/rbac';

export default function AdminPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const authorized = useMemo(() => {
    if (status === 'loading') return false;
    const userRole = (session?.user as { role?: Role })?.role;
    if (userRole !== 'admin') {
      router.push('/');
      return false;
    }
    return true;
  }, [session, status, router]);

  if (!authorized) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
      <h1 className="text-3xl font-bold">{t('admin.title')}</h1>
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">{t('admin.tabs.overview')}</TabsTrigger>
          <TabsTrigger value="analytics">{t('admin.tabs.analytics')}</TabsTrigger>
          <TabsTrigger value="deadlines">{t('admin.tabs.deadlines')}</TabsTrigger>
          <TabsTrigger value="leaderboard">{t('admin.tabs.leaderboard')}</TabsTrigger>
          <TabsTrigger value="health">{t('admin.tabs.health')}</TabsTrigger>
          <TabsTrigger value="audit">{t('admin.tabs.audit')}</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-6">
          <DBStats />
          <UserTable />
        </TabsContent>
        <TabsContent value="analytics">
          <AnalyticsDashboard />
        </TabsContent>
        <TabsContent value="deadlines">
          <DeadlineManager />
        </TabsContent>
        <TabsContent value="leaderboard">
          <LeaderboardTable />
        </TabsContent>
        <TabsContent value="health" className="space-y-6">
          <SystemHealth />
        </TabsContent>
        <TabsContent value="audit">
          <AuditLog />
        </TabsContent>
      </Tabs>
    </div>
  );
}
