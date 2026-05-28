'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, TrendingUp, Users } from 'lucide-react';
import { t } from '@/lib/i18n';
import { useDateRange } from '../analytics-dashboard';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import EmptyState from './empty-state';
import { useAnalyticsQuery } from '@/lib/hooks';

interface CohortData {
  cohorts: Array<{ cohort_week: string; total: number; week_1_retained: number; week_1_rate: number; week_2_retained: number; week_2_rate: number; week_4_retained: number; week_4_rate: number; week_8_retained: number; week_8_rate: number }>;
  summary: { avg_week_1_rate: number; avg_week_4_rate: number; avg_week_8_rate: number };
}

export default function RetentionCohorts() {
  const { startDate, endDate } = useDateRange();
  const { data, loading, error } = useAnalyticsQuery<CohortData>({
    endpoint: '/api/admin/analytics/retention-cohorts',
    transform: (json) => ({
      cohorts: (json.cohorts || []) as CohortData['cohorts'],
      summary: json.summary as CohortData['summary'],
    }),
    startDate,
    endDate,
  });

  const cohorts = data?.cohorts || [];
  const summary = data?.summary || null;

  if (loading) return <p className="text-center py-4">{t('analytics.loading')}</p>;
  if (error) return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>;
  if (!summary) return <EmptyState />;

  const stats = [
    { label: t('analytics.retentionCohorts.avgWeek1'), value: `${summary.avg_week_1_rate}%`, icon: Users, color: 'text-blue-600' },
    { label: t('analytics.retentionCohorts.avgWeek4'), value: `${summary.avg_week_4_rate}%`, icon: TrendingUp, color: 'text-emerald-600' },
    { label: t('analytics.retentionCohorts.avgWeek8'), value: `${summary.avg_week_8_rate}%`, icon: TrendingUp, color: 'text-purple-600' },
  ];

  // Retention curve data
  const retentionCurve = [
    { period: 'Week 1', rate: summary.avg_week_1_rate },
    { period: 'Week 2', rate: cohorts.length > 0 ? parseFloat((cohorts.reduce((s, c) => s + c.week_2_rate, 0) / cohorts.length).toFixed(1)) : 0 },
    { period: 'Week 4', rate: summary.avg_week_4_rate },
    { period: 'Week 8', rate: summary.avg_week_8_rate },
  ];

  const getRateColor = (rate: number) => {
    if (rate >= 70) return 'bg-green-100 text-green-800';
    if (rate >= 40) return 'bg-amber-100 text-amber-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t('analytics.retentionCohorts.title')}</h2>

      <div className="grid gap-4 sm:grid-cols-3">
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
        <CardHeader><CardTitle>{t('analytics.retentionCohorts.retentionCurve')}</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={retentionCurve}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value: number) => `${value}%`} />
              <Line type="monotone" dataKey="rate" stroke="#3b82f6" strokeWidth={2} name={t('analytics.retentionCohorts.retentionRate')} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t('analytics.retentionCohorts.cohortTable')}</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium">{t('analytics.retentionCohorts.cohort')}</th>
                  <th className="text-center py-2 px-3 font-medium">{t('analytics.retentionCohorts.total')}</th>
                  <th className="text-center py-2 px-3 font-medium">W1</th>
                  <th className="text-center py-2 px-3 font-medium">W2</th>
                  <th className="text-center py-2 px-3 font-medium">W4</th>
                  <th className="text-center py-2 px-3 font-medium">W8</th>
                </tr>
              </thead>
              <tbody>
                {cohorts.map(cohort => (
                  <tr key={cohort.cohort_week} className="border-b last:border-0">
                    <td className="py-2 px-3 font-mono text-xs">{cohort.cohort_week}</td>
                    <td className="text-center py-2 px-3">{cohort.total}</td>
                    <td className="text-center py-2 px-3"><Badge className={getRateColor(cohort.week_1_rate)}>{cohort.week_1_rate}%</Badge></td>
                    <td className="text-center py-2 px-3"><Badge className={getRateColor(cohort.week_2_rate)}>{cohort.week_2_rate}%</Badge></td>
                    <td className="text-center py-2 px-3"><Badge className={getRateColor(cohort.week_4_rate)}>{cohort.week_4_rate}%</Badge></td>
                    <td className="text-center py-2 px-3"><Badge className={getRateColor(cohort.week_8_rate)}>{cohort.week_8_rate}%</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
