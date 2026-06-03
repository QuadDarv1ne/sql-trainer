'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Database, Mail, Bell, Users, Activity, AlertCircle } from 'lucide-react';
import { t } from '@/lib/i18n';
import { useAnalyticsQuery } from '@/hooks/use-analytics-query';
import { AnalyticsCard } from './analytics-card';

interface PlatformHealth {
  tables: Array<{ name: string; rows: number }>;
  email_queue: { pending: number; failed: number };
  reminders: { pending: number };
  push_subscriptions: number;
  active_today: number;
}

function StatCard({
  icon: Icon,
  label,
  value,
  color = 'text-muted-foreground',
}: {
  icon: typeof Database;
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${color}`} />
          <span className="text-sm text-muted-foreground">{label}</span>
        </div>
        <div className="mt-2 text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

export default function PlatformHealthReport() {
  const { data, loading, error, refetch } = useAnalyticsQuery<PlatformHealth>({
    endpoint: '/api/admin/analytics/platform-health',
    dataKey: 'platformHealth',
  });

  if (loading || error || !data) {
    return (
      <AnalyticsCard
        loading={loading}
        error={error}
        empty={!data}
        onRefresh={refetch}
        title={t('analytics.platformHealth.title')}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Activity}
          label={t('analytics.platformHealth.activeToday')}
          value={data.active_today}
          color="text-emerald-600"
        />
        <StatCard
          icon={Mail}
          label={t('analytics.platformHealth.pendingEmails')}
          value={data.email_queue.pending}
          color={data.email_queue.pending > 0 ? 'text-amber-600' : 'text-muted-foreground'}
        />
        <StatCard
          icon={AlertCircle}
          label={t('analytics.platformHealth.failedEmails')}
          value={data.email_queue.failed}
          color={data.email_queue.failed > 0 ? 'text-red-600' : 'text-muted-foreground'}
        />
        <StatCard icon={Bell} label={t('analytics.platformHealth.pendingReminders')} value={data.reminders.pending} />
        <StatCard
          icon={Users}
          label={t('analytics.platformHealth.pushSubscriptions')}
          value={data.push_subscriptions}
        />
      </div>

      {/* Table stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            {t('analytics.platformHealth.databaseTables')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('analytics.platformHealth.tableName')}</TableHead>
                  <TableHead className="text-right">{t('analytics.platformHealth.rowCount')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.tables.map((table) => (
                  <TableRow key={table.name}>
                    <TableCell className="font-mono text-sm">{table.name}</TableCell>
                    <TableCell className="text-right font-mono">{table.rows.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
