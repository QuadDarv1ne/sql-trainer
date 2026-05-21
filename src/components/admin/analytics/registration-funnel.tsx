'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { UserPlus, Clock, ChevronDown } from 'lucide-react';
import { t } from '@/lib/i18n';
import { useAnalyticsQuery } from '@/hooks/use-analytics-query';
import { AnalyticsCard } from './analytics-card';

interface RegistrationFunnel {
  funnel: {
    total_registered: number;
    completed_first_task: number;
    returned_day_2: number;
    completed_onboarding: number;
    conversion_first: number;
    conversion_day2: number;
    conversion_onboarding: number;
  };
  avg_time_to_first_activity_ms: number | null;
  daily_registrations: Array<{ date: string; count: number }>;
}

function FunnelStage({ label, count, percentage, width, isLast }: { label: string; count: number; percentage: number; width: number; isLast?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="relative flex items-center justify-center rounded-lg bg-primary/10 px-4 py-3 text-center transition-all"
        style={{ width: `${width}%`, minWidth: '120px' }}
      >
        <div>
          <div className="text-lg font-bold">{count}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </div>
      {!isLast && (
        <div className="flex items-center gap-1 py-1 text-sm text-muted-foreground">
          <ChevronDown className="h-4 w-4" />
          <span>{percentage}%</span>
        </div>
      )}
    </div>
  );
}

function formatDuration(ms: number): string {
  const hours = ms / (1000 * 60 * 60);
  if (hours < 24) return `${Math.round(hours)}ч`;
  const days = hours / 24;
  return `${Math.round(days)}д`;
}

export default function RegistrationFunnel() {
  const [showChart, setShowChart] = useState(true);
  const { data, loading, error, refetch } = useAnalyticsQuery<RegistrationFunnel>({
    endpoint: '/api/admin/analytics/registration-funnel',
    dataKey: 'registrationFunnel',
  });

  if (loading || error || !data) {
    return (
      <AnalyticsCard loading={loading} error={error} empty={!data} onRefresh={refetch} title={t('analytics.registrationFunnel.title')} />
    );
  }

  const f = data.funnel;
  const chartData = data.daily_registrations.map((d) => ({
    date: new Date(d.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
    count: d.count,
  }));

  return (
    <div className="space-y-6">
      {/* Funnel visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {t('analytics.registrationFunnel.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-0 py-4">
            <FunnelStage
              label={t('analytics.registrationFunnel.registered')}
              count={f.total_registered}
              percentage={100}
              width={100}
            />
            <FunnelStage
              label={t('analytics.registrationFunnel.firstTask')}
              count={f.completed_first_task}
              percentage={f.conversion_first}
              width={75}
            />
            <FunnelStage
              label={t('analytics.registrationFunnel.returnedDay2')}
              count={f.returned_day_2}
              percentage={f.conversion_day2}
              width={50}
            />
            <FunnelStage
              label={t('analytics.registrationFunnel.onboarding')}
              count={f.completed_onboarding}
              percentage={f.conversion_onboarding}
              width={35}
              isLast
            />
          </div>
        </CardContent>
      </Card>

      {/* Avg time to first activity */}
      {data.avg_time_to_first_activity_ms && (
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <span className="text-sm text-muted-foreground">
                {t('analytics.registrationFunnel.avgTimeToFirst')}:
              </span>
              <span className="ml-2 text-xl font-bold">
                {formatDuration(data.avg_time_to_first_activity_ms)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily registrations chart */}
      <Card>
        <CardHeader>
          <CardTitle>{t('analytics.registrationFunnel.dailyRegistrations')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                name={t('analytics.registrationFunnel.registrations')}
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
