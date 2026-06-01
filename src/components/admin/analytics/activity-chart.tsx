'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { t, getLocale } from '@/lib/i18n';
import { useAnalyticsQuery } from '@/hooks/use-analytics-query';

interface ActivityEntry {
  date: string;
  completions: number;
  unique_users: number;
}

export default function ActivityChart() {
  const { data, loading, error } = useAnalyticsQuery<ActivityEntry[]>({
    endpoint: '/api/admin/analytics/activity',
    dataKey: 'activity',
  });

  if (loading) return <p className="text-center py-4">{t('analytics.loading')}</p>;
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  if (!data.length) return <p className="text-center py-4">{t('analytics.noData')}</p>;

  const chartData = data.map((entry) => ({
    ...entry,
    date: new Date(entry.date).toLocaleDateString(getLocale(), {
      day: '2-digit',
      month: '2-digit',
    }),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('analytics.activity.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="completions"
              name={t('analytics.activity.completions')}
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="unique_users"
              name={t('analytics.activity.uniqueUsers')}
              stroke="hsl(var(--destructive))"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
