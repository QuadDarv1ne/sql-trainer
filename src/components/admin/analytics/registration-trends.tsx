'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, UserPlus, TrendingUp, Users } from 'lucide-react';
import { t } from '@/lib/i18n';
import { useDateRange } from '../analytics-dashboard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import EmptyState from './empty-state';

export default function RegistrationTrends() {
  const [daily, setDaily] = useState<Array<{ date: string; count: number; cumulative: number }>>([]);
  const [summary, setSummary] = useState<{
    new_this_week: number;
    new_this_month: number;
    total: number;
    weekly_growth_rate: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { startDate, endDate } = useDateRange();

  useEffect(() => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', String(startDate));
    if (endDate) params.set('endDate', String(endDate));

    fetch(`/api/admin/analytics/registrations?${params}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to fetch registration trends'))))
      .then((data) => {
        setDaily(data.daily || []);
        setSummary(data.summary);
      })
      .catch(() => setError(t('analytics.error')))
      .finally(() => setLoading(false));
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
      label: t('analytics.registrations.newThisWeek'),
      value: summary.new_this_week,
      icon: UserPlus,
      color: 'text-blue-600',
    },
    {
      label: t('analytics.registrations.newThisMonth'),
      value: summary.new_this_month,
      icon: Users,
      color: 'text-emerald-600',
    },
    { label: t('analytics.registrations.total'), value: summary.total, icon: Users, color: 'text-purple-600' },
    {
      label: t('analytics.registrations.growthRate'),
      value: `${summary.weekly_growth_rate}%`,
      icon: TrendingUp,
      color: summary.weekly_growth_rate >= 0 ? 'text-emerald-600' : 'text-red-600',
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t('analytics.registrations.title')}</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            <CardTitle>{t('analytics.registrations.daily')} (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  fill="#3b82f620"
                  name={t('analytics.registrations.daily')}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('analytics.registrations.cumulative')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="cumulative"
                  stroke="#10b981"
                  strokeWidth={2}
                  name={t('analytics.registrations.cumulative')}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
