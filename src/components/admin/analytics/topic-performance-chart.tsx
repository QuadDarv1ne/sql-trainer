'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ResponsiveContainer, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Line, ComposedChart } from 'recharts';
import { t } from '@/lib/i18n';
import { useDateRange } from '../analytics-dashboard';
import EmptyState from './empty-state';

interface TopicPerformanceEntry {
  topic: string;
  total_tasks: number;
  students_attempted: number;
  students_completed: number;
  avg_attempts: number;
  first_attempt_rate: number;
  completion_rate: number;
  trend: 'improving' | 'stable' | 'declining';
  avg_attempts_recent: number;
  avg_attempts_previous: number;
}

const topicLabels: Record<string, string> = {
  select: 'SELECT',
  joins: 'JOINs',
  aggregation: 'Агрегация',
  subqueries: 'Подзапросы',
  dml: 'DML',
  advanced: 'Продвинутый',
};

export default function TopicPerformanceChart() {
  const [data, setData] = useState<TopicPerformanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { startDate, endDate } = useDateRange();

  useEffect(() => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', String(startDate));
    if (endDate) params.set('endDate', String(endDate));

    fetch(`/api/admin/analytics/topic-performance?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load');
        return r.json();
      })
      .then((data) => setData(data.topics))
      .catch(() => setError(t('analytics.error')))
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  if (loading) return <p className="text-center py-4">{t('analytics.loading')}</p>;
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  if (!data.length) return <EmptyState />;

  const chartData = data.map((d) => ({
    name: topicLabels[d.topic] || d.topic,
    avg_attempts: d.avg_attempts,
    completion_rate: d.completion_rate,
    first_attempt_rate: d.first_attempt_rate,
  }));

  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === 'improving') return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    if (trend === 'declining') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('analytics.topics.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="avg_attempts"
              fill="hsl(var(--primary))"
              name={t('analytics.tasks.avgAttempts')}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="completion_rate"
              stroke="hsl(var(--success))"
              name={t('analytics.difficulty.completion')}
              strokeWidth={2}
            />
          </ComposedChart>
        </ResponsiveContainer>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((entry) => (
            <div key={entry.topic} className="p-4 rounded-lg border space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline">{topicLabels[entry.topic] || entry.topic}</Badge>
                <TrendIcon trend={entry.trend} />
              </div>

              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{t('analytics.difficulty.completion')}</span>
                    <span className="font-medium">{entry.completion_rate}%</span>
                  </div>
                  <Progress value={entry.completion_rate} className="h-2" />
                </div>

                <div className="flex justify-between text-xs pt-1 border-t">
                  <span className="text-muted-foreground">{t('analytics.tasks.avgAttempts')}</span>
                  <span className="font-medium">{entry.avg_attempts}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{t('analytics.tasks.firstAttemptRate')}</span>
                  <span className="font-medium">{entry.first_attempt_rate}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{t('analytics.topics.attempted')}</span>
                  <span className="font-medium">{entry.students_attempted}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
