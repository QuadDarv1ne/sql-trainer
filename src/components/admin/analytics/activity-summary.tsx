'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Users, Activity, TrendingUp } from 'lucide-react';
import { t } from '@/lib/i18n';
import { useDateRange } from '../analytics-dashboard';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import EmptyState from './empty-state';
import { useAnalyticsQuery } from '@/lib/hooks';

interface ActivityData {
  daily: Array<{ date: string; dau: number; wau: number; mau: number }>;
  summary: { current_dau: number; current_wau: number; current_mau: number; dau_wau_ratio: number; wau_mau_ratio: number };
}

export default function ActivitySummary() {
  const { startDate, endDate } = useDateRange();
  const { data, loading, error } = useAnalyticsQuery<ActivityData>({
    endpoint: '/api/admin/analytics/activity-summary',
    transform: (json) => ({
      daily: (json.daily || []) as ActivityData['daily'],
      summary: json.summary as ActivityData['summary'],
    }),
    startDate,
    endDate,
  });

  const daily = data?.daily || [];
  const summary = data?.summary || null;

  if (loading) return <p className="text-center py-4">{t('analytics.loading')}</p>;
  if (error) return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>;
  if (!summary) return <EmptyState />;

  const stats = [
    { label: t('analytics.activitySummary.dau'), value: summary.current_dau, icon: Activity, color: 'text-blue-600' },
    { label: t('analytics.activitySummary.wau'), value: summary.current_wau, icon: Users, color: 'text-emerald-600' },
    { label: t('analytics.activitySummary.mau'), value: summary.current_mau, icon: TrendingUp, color: 'text-purple-600' },
    { label: t('analytics.activitySummary.dauWauRatio'), value: summary.dau_wau_ratio, icon: Activity, color: 'text-amber-600' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t('analytics.activitySummary.title')}</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>DAU / WAU / MAU (30 дней)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="dau" stroke="#3b82f6" strokeWidth={2} name="DAU" dot={false} />
              <Line type="monotone" dataKey="wau" stroke="#10b981" strokeWidth={2} name="WAU" dot={false} />
              <Line type="monotone" dataKey="mau" stroke="#8b5cf6" strokeWidth={2} name="MAU" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
