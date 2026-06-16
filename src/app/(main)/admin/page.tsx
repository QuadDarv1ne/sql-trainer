'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { t } from '@/lib/i18n';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import UserTable from '@/components/admin/user-table';
import DBStats from '@/components/admin/db-stats';
import SystemHealth from '@/components/admin/system-health';
import AnalyticsDashboard from '@/components/admin/analytics-dashboard';
import LeaderboardTable from '@/components/admin/analytics/leaderboard-table';
import { DeadlineManager } from '@/components/admin/deadline-manager';
import AuditLog from '@/components/admin/audit-log';
import type { Role } from '@/lib/rbac';
import AdminAnalytics from '@/components/admin/admin-analytics';
import { Download } from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const authorized = useMemo(() => {
    if (status === 'loading') return false;
    const userRole = (session?.user as { role?: Role })?.role;
    if (userRole !== 'admin') {
      router.push('/app');
      return false;
    }
    return true;
  }, [session, status, router]);

  if (!authorized) return null;

  const handleExport = (section: string) => {
    window.open(`/api/admin/export?section=${section}&format=csv`, '_blank');
  };

  return (
    <div className="h-full overflow-auto bg-gradient-to-b from-background to-muted/20">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        {/* Page Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('admin.title')}</h1>
            <p className="text-sm text-muted-foreground">
              {t('admin.subtitle', { default: 'Управление пользователями, аналитика и мониторинг системы' })}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                {t('admin.export', { default: 'Export' })}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('users')}>
                {t('admin.exportUsers', { default: 'Users (CSV)' })}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('leaderboard')}>
                {t('admin.exportLeaderboard', { default: 'Leaderboard (CSV)' })}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('banned')}>
                {t('admin.exportBanned', { default: 'Banned (CSV)' })}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('deleted')}>
                {t('admin.exportDeleted', { default: 'Deleted (CSV)' })}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('deadlines')}>
                {t('admin.exportDeadlines', { default: 'Deadlines (CSV)' })}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('audit')}>
                {t('admin.exportAudit', { default: 'Audit (CSV)' })}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 max-w-4xl">
            <TabsTrigger value="overview">{t('admin.tabs.overview')}</TabsTrigger>
            <TabsTrigger value="analytics">{t('admin.tabs.analytics')}</TabsTrigger>
            <TabsTrigger value="deadlines">{t('admin.tabs.deadlines')}</TabsTrigger>
            <TabsTrigger value="leaderboard">{t('admin.tabs.leaderboard')}</TabsTrigger>
            <TabsTrigger value="health">{t('admin.tabs.health')}</TabsTrigger>
            <TabsTrigger value="audit">{t('admin.tabs.audit')}</TabsTrigger>
            <TabsTrigger value="metrics">{t('admin.tabs.metrics', { default: 'Метрики' })}</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-6">
            <DBStats />
            <UserTable />
          </TabsContent>
          <TabsContent value="analytics" className="space-y-4">
            <AnalyticsDashboard />
          </TabsContent>
          <TabsContent value="metrics" className="space-y-6">
            <AdminAnalytics />
          </TabsContent>
          <TabsContent value="deadlines" className="space-y-4">
            <DeadlineManager />
          </TabsContent>
          <TabsContent value="leaderboard" className="space-y-4">
            <LeaderboardTable />
          </TabsContent>
          <TabsContent value="health" className="space-y-6">
            <SystemHealth />
          </TabsContent>
          <TabsContent value="audit" className="space-y-4">
            <AuditLog />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
