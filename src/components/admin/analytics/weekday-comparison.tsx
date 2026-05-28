'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Calendar } from 'lucide-react';
import { t } from '@/lib/i18n';
import { useDateRange } from '../analytics-dashboard';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line,
} from 'recharts';
import EmptyState from './empty-state';
import { useAnalyticsQuery } from '@/lib/hooks';

interface WeekdayData {
  total_completions: number;
  unique_students: number;
  avg_attempts: number;
  first_attempt_rate: number;
}

interface ComparisonData {
  weekday: WeekdayData;
  weekend: WeekdayData;
  by_difficulty: Array<{ difficulty: string; weekday_completions: number; weekend_completions: number; weekday_avg_attempts: number; weekend_avg_attempts: number }>;
  hourly_weekday: Array<{ hour: number; completions: number }>;
  hourly_weekend: Array<{ hour: number; completions: number }>;
}

export default function WeekdayComparison() {
  const { startDate, endDate } = useDateRange();

  const { data, loading, error } = useAnalyticsQuery<ComparisonData>({
    endpoint: '/api/admin/analytics/weekday-comparison',
    transform: (json) => ({
      weekday: json.weekday as WeekdayData,
      weekend: json.weekend as WeekdayData,
      by_difficulty: (json.by_difficulty || []) as ComparisonData['by_difficulty'],
      hourly_weekday: (json.hourly_weekday || []) as ComparisonData['hourly_weekday'],
      hourly_weekend: (json.hourly_weekend || []) as ComparisonData['hourly_weekend'],
    }),
    startDate,
    endDate,
  });

  const weekday = data?.weekday || null;
  const weekend = data?.weekend || null;
  const byDifficulty = data?.by_difficulty || [];
  const hourlyWeekday = data?.hourly_weekday || [];
  const hourlyWeekend = data?.hourly_weekend || [];

  if (loading) return <p className="text-center py-4">{t('analytics.loading')}</p>;
  if (error) return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>;
  if (!weekday || !weekend) return <EmptyState />;

  const comparisonData = [
    { metric: t('analytics.weekday.completions'), weekday: weekday.total_completions, weekend: weekend.total_completions },
    { metric: t('analytics.weekday.uniqueStudents'), weekday: weekday.unique_students, weekend: weekend.unique_students },
    { metric: t('analytics.weekday.avgAttempts'), weekday: weekday.avg_attempts, weekend: weekend.avg_attempts },
    { metric: t('analytics.weekday.firstAttemptRate'), weekday: weekday.first_attempt_rate, weekend: weekend.first_attempt_rate },
  ];

  const difficultyLabels: Record<string, string> = { beginner: t('difficulty.beginner'), intermediate: t('difficulty.intermediate'), advanced: t('difficulty.advanced') };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t('analytics.weekday.title')}</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-blue-600" />{t('analytics.weekday.weekday')}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-2xl font-bold">{weekday.total_completions}</p><p className="text-xs text-muted-foreground">{t('analytics.weekday.completions')}</p></div>
              <div><p className="text-2xl font-bold">{weekday.unique_students}</p><p className="text-xs text-muted-foreground">{t('analytics.weekday.uniqueStudents')}</p></div>
              <div><p className="text-2xl font-bold">{weekday.avg_attempts}</p><p className="text-xs text-muted-foreground">{t('analytics.weekday.avgAttempts')}</p></div>
              <div><p className="text-2xl font-bold">{weekday.first_attempt_rate}%</p><p className="text-xs text-muted-foreground">{t('analytics.weekday.firstAttemptRate')}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-purple-600" />{t('analytics.weekday.weekend')}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-2xl font-bold">{weekend.total_completions}</p><p className="text-xs text-muted-foreground">{t('analytics.weekday.completions')}</p></div>
              <div><p className="text-2xl font-bold">{weekend.unique_students}</p><p className="text-xs text-muted-foreground">{t('analytics.weekday.uniqueStudents')}</p></div>
              <div><p className="text-2xl font-bold">{weekend.avg_attempts}</p><p className="text-xs text-muted-foreground">{t('analytics.weekday.avgAttempts')}</p></div>
              <div><p className="text-2xl font-bold">{weekend.first_attempt_rate}%</p><p className="text-xs text-muted-foreground">{t('analytics.weekday.firstAttemptRate')}</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>{t('analytics.weekday.byDifficulty')}</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={byDifficulty.map(d => ({ ...d, difficulty: difficultyLabels[d.difficulty] || d.difficulty }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="difficulty" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="weekday_completions" fill="#3b82f6" name={t('analytics.weekday.weekday')} />
                <Bar dataKey="weekend_completions" fill="#8b5cf6" name={t('analytics.weekday.weekend')} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t('analytics.weekday.hourly')}</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" domain={[0, 23]} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" data={hourlyWeekday} dataKey="completions" stroke="#3b82f6" name={t('analytics.weekday.weekday')} strokeWidth={2} dot={false} />
                <Line type="monotone" data={hourlyWeekend} dataKey="completions" stroke="#8b5cf6" name={t('analytics.weekday.weekend')} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>{t('analytics.weekday.metricComparison')}</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="metric" tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="weekday" fill="#3b82f6" name={t('analytics.weekday.weekday')} />
              <Bar dataKey="weekend" fill="#8b5cf6" name={t('analytics.weekday.weekend')} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
