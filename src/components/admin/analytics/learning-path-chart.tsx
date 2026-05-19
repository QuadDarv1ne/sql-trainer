'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { t } from '@/lib/i18n';
import { useDateRange } from '../analytics-dashboard';
import EmptyState from './empty-state';

interface LearningPathEntry {
  user_id: string;
  name: string;
  path_type: 'sequential' | 'mixed' | 'random';
  sequentiality_score: number;
  tasks_completed: number;
  avg_attempts: number;
  completion_rate: number;
  avg_days_to_complete: number;
}

const pathTypeLabels: Record<string, string> = {
  sequential: t('analytics.learningPath.sequential'),
  mixed: t('analytics.learningPath.mixed'),
  random: t('analytics.learningPath.random'),
};

const pathTypeColors: Record<string, string> = {
  sequential: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  mixed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  random: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
};

export default function LearningPathChart() {
  const [data, setData] = useState<LearningPathEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { startDate, endDate } = useDateRange();

  useEffect(() => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', String(startDate));
    if (endDate) params.set('endDate', String(endDate));

    fetch(`/api/admin/analytics/learning-path?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load');
        return r.json();
      })
      .then((data) => setData(data.paths))
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

  // Aggregate by path type
  const aggregated = ['sequential', 'mixed', 'random'].map(type => {
    const entries = data.filter(d => d.path_type === type);
    if (!entries.length) return { name: pathTypeLabels[type], completion_rate: 0, avg_attempts: 0, count: 0 };
    return {
      name: pathTypeLabels[type],
      completion_rate: Math.round(entries.reduce((s, e) => s + e.completion_rate, 0) / entries.length * 10) / 10,
      avg_attempts: Math.round(entries.reduce((s, e) => s + e.avg_attempts, 0) / entries.length * 100) / 100,
      count: entries.length,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('analytics.learningPath.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={aggregated}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="completion_rate" fill="hsl(var(--primary))" name={t('analytics.difficulty.completion')} />
            <Bar dataKey="avg_attempts" fill="hsl(var(--destructive))" name={t('analytics.tasks.avgAttempts')} />
          </BarChart>
        </ResponsiveContainer>

        <div className="grid gap-4 sm:grid-cols-3">
          {aggregated.map((entry) => (
            <div key={entry.name} className="p-4 rounded-lg border space-y-2">
              <div className="flex items-center justify-between">
                <Badge className={pathTypeColors[entry.name.includes(t('analytics.learningPath.sequential').split(' ')[0]) ? 'sequential' : entry.name.includes(t('analytics.learningPath.mixed').split(' ')[0]) ? 'mixed' : 'random'] || ''}>
                  {entry.name}
                </Badge>
                <span className="text-xs text-muted-foreground">{entry.count} {t('analytics.students.title').toLowerCase()}</span>
              </div>
              <div className="text-2xl font-bold">{entry.completion_rate}%</div>
              <div className="text-xs text-muted-foreground">{t('analytics.difficulty.completion')} | {t('analytics.tasks.avgAttempts')}: {entry.avg_attempts}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
