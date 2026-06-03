'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { t } from '@/lib/i18n';
import { useDateRange } from '../analytics-dashboard';
import EmptyState from './empty-state';

interface CategoryPerformanceEntry {
  category: string;
  label: string;
  total_tasks: number;
  students_attempted: number;
  students_completed_all: number;
  avg_attempts: number;
  completion_rate: number;
}

export default function CategoryPerformanceChart() {
  const [data, setData] = useState<CategoryPerformanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { startDate, endDate } = useDateRange();

  useEffect(() => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', String(startDate));
    if (endDate) params.set('endDate', String(endDate));

    fetch(`/api/admin/analytics/category-performance?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load');
        return r.json();
      })
      .then((data) => setData(data.categories))
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
    name: d.label,
    completion_rate: d.completion_rate,
    avg_attempts: d.avg_attempts,
    completed_all: d.students_completed_all,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('analytics.categories.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="completion_rate" fill="hsl(var(--primary))" name={t('analytics.difficulty.completion')} />
            <Bar dataKey="avg_attempts" fill="hsl(var(--destructive))" name={t('analytics.tasks.avgAttempts')} />
          </BarChart>
        </ResponsiveContainer>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.map((entry) => (
            <div key={entry.category} className="p-4 rounded-lg border space-y-3">
              <Badge variant="outline">{entry.label}</Badge>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{t('analytics.difficulty.completion')}</span>
                  <span className="font-medium">{entry.completion_rate}%</span>
                </div>
                <Progress value={entry.completion_rate} className="h-2" />
              </div>
              <div className="flex justify-between text-xs pt-1 border-t">
                <span className="text-muted-foreground">{t('analytics.categories.tasks')}</span>
                <span className="font-medium">{entry.total_tasks}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{t('analytics.topics.attempted')}</span>
                <span className="font-medium">{entry.students_attempted}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
