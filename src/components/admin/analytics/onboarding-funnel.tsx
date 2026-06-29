'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Users, Clock, TrendingUp } from 'lucide-react';
import { t } from '@/lib/i18n';
import { useDateRange } from '../analytics-dashboard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import EmptyState from './empty-state';

export default function OnboardingFunnel() {
  const [funnel, setFunnel] = useState<
    Array<{ stage: string; count: number; percentage: number; drop_off_rate: number }>
  >([]);
  const [weeklyTrend, setWeeklyTrend] = useState<
    Array<{ week: string; registered: number; first_completed: number; five_completed: number }>
  >([]);
  const [summary, setSummary] = useState<{
    total_registered: number;
    onboarded_rate: number;
    avg_time_to_first_completion_hours: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { startDate, endDate } = useDateRange();

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', String(startDate));
    if (endDate) params.set('endDate', String(endDate));

    fetch(`/api/admin/analytics/onboarding?${params}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to fetch onboarding funnel'))))
      .then((data) => {
        if (!controller.signal.aborted) {
          setFunnel(data.funnel || []);
          setWeeklyTrend(data.weekly_trend || []);
          setSummary(data.summary);
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(t('analytics.error'));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [startDate, endDate]);

  if (loading) return <p className="text-center py-4">{t('analytics.loading')}</p>;
  if (error)
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  if (!summary) return <EmptyState />;

  const stats = [
    {
      label: t('analytics.onboarding.registered'),
      value: summary.total_registered,
      icon: Users,
      color: 'text-blue-600',
    },
    {
      label: t('analytics.onboarding.onboardedRate'),
      value: `${summary.onboarded_rate}%`,
      icon: TrendingUp,
      color: 'text-emerald-600',
    },
    {
      label: t('analytics.onboarding.avgTimeFirst'),
      value: `${summary.avg_time_to_first_completion_hours}h`,
      icon: Clock,
      color: 'text-amber-600',
    },
  ];

  const funnelColors = ['#3b82f6', '#10b981', '#f59e0b'];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t('analytics.onboarding.title')}</h2>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('analytics.onboarding.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={funnel}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" name="Count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {funnel.map((stage, i) => (
                <div key={stage.stage} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: funnelColors[i] }} />
                    <span className="text-sm font-medium">{stage.stage}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm">
                      {stage.count} ({stage.percentage}%)
                    </span>
                    {stage.drop_off_rate > 0 && <span className="text-sm text-red-500">-{stage.drop_off_rate}%</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('analytics.onboarding.weeklyTrend')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="registered"
                  stroke="#3b82f6"
                  name={t('analytics.onboarding.registered')}
                />
                <Line
                  type="monotone"
                  dataKey="first_completed"
                  stroke="#10b981"
                  name={t('analytics.onboarding.firstTaskCompleted')}
                />
                <Line
                  type="monotone"
                  dataKey="five_completed"
                  stroke="#f59e0b"
                  name={t('analytics.onboarding.fiveTasksCompleted')}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
