'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useDateRange } from '../analytics-dashboard';
import { t } from '@/lib/i18n';
import EmptyState from './empty-state';

interface ErrorTrendEntry {
  date: string;
  total_completions: number;
  high_attempt_completions: number;
  high_attempt_rate: number;
  avg_attempts: number;
}

export default function ErrorTrendsChart() {
  const [data, setData] = useState<ErrorTrendEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { startDate, endDate } = useDateRange();

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (startDate) params.set('startDate', String(startDate));
        if (endDate) params.set('endDate', String(endDate));
        const res = await fetch(`/api/admin/analytics/error-trends?${params}`);
        const json = await res.json();
        setData(json.trends || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [startDate, endDate]);

  if (loading) return <div className="flex justify-center py-8">{t('analytics.loading')}</div>;
  if (error) return <div className="text-red-500 py-8">{error.message}</div>;
  if (data.length === 0) return <EmptyState />;

  const filteredData = data.filter(d => d.total_completions > 0);
  if (filteredData.length === 0) return <EmptyState />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('analytics.errors.trendTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="avg_attempts" name="Avg Attempts" stroke="#ef4444" strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="high_attempt_rate" name="High Attempt Rate (%)" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
