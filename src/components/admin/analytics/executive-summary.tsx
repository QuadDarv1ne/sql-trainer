'use client';

import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Users, Activity, FileText, Target, UserPlus, Award, Mail, Bell } from 'lucide-react';
import { t } from '@/lib/i18n';
import { useAnalyticsQuery } from '@/hooks/use-analytics-query';
import { AnalyticsCard } from './analytics-card';

interface ExecutiveSummary {
  total_students: number;
  active_this_week: number;
  total_completions: number;
  avg_attempts: number;
  new_registrations: number;
  avg_completion_rate: number;
  pending_emails: number;
  push_subscriptions: number;
  trends: { registrations_change: number; completions_change: number };
}

function KPIStat({ icon: Icon, label, value, trend, suffix = '' }: { icon: typeof Users; label: string; value: number | string; trend?: number; suffix?: string }) {
  const trendColor = trend !== undefined ? (trend >= 0 ? 'text-emerald-600' : 'text-red-600') : '';
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{label}</span>
          </div>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>
              {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {trend >= 0 ? '+' : ''}{trend}%
            </div>
          )}
        </div>
        <div className="mt-2 text-3xl font-bold">
          {value}{suffix}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ExecutiveSummary() {
  const { data, loading, error, refetch } = useAnalyticsQuery<ExecutiveSummary>({
    endpoint: '/api/admin/analytics/executive-summary',
    dataKey: 'executiveSummary',
  });

  if (loading || error || !data) {
    return (
      <AnalyticsCard loading={loading} error={error} empty={!data} onRefresh={refetch} title={t('analytics.executiveSummary.title')} />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPIStat icon={Users} label={t('analytics.executiveSummary.totalStudents')} value={data.total_students} />
        <KPIStat icon={Activity} label={t('analytics.executiveSummary.activeWeek')} value={data.active_this_week} />
        <KPIStat icon={UserPlus} label={t('analytics.executiveSummary.newRegistrations')} value={data.new_registrations} trend={data.trends.registrations_change} />
        <KPIStat icon={FileText} label={t('analytics.executiveSummary.totalCompletions')} value={data.total_completions} trend={data.trends.completions_change} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPIStat icon={Award} label={t('analytics.executiveSummary.avgCompletionRate')} value={data.avg_completion_rate} suffix="%" />
        <KPIStat icon={Target} label={t('analytics.executiveSummary.avgAttempts')} value={data.avg_attempts} />
        <KPIStat icon={Mail} label={t('analytics.executiveSummary.pendingEmails')} value={data.pending_emails} />
        <KPIStat icon={Bell} label={t('analytics.executiveSummary.pushSubscriptions')} value={data.push_subscriptions} />
      </div>
    </div>
  );
}
