'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { t } from '@/lib/i18n';
import { useDateRange } from '../analytics-dashboard';
import EmptyState from './empty-state';

interface CompletionFunnelChartProps {
  apiEndpoint?: string;
}

interface FunnelStage {
  difficulty: string;
  label: string;
  total_tasks: number;
  students_started: number;
  students_completed_all: number;
  completion_rate: number;
  conversion_from_previous: number | null;
}

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: 'analytics.funnel.beginner',
  intermediate: 'analytics.funnel.intermediate',
  advanced: 'analytics.funnel.advanced',
};

export default function CompletionFunnelChart({ apiEndpoint }: CompletionFunnelChartProps) {
  const [funnel, setFunnel] = useState<FunnelStage[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { startDate, endDate } = useDateRange();

  useEffect(() => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', String(startDate));
    if (endDate) params.set('endDate', String(endDate));

    fetch(`${apiEndpoint || '/api/admin/analytics/funnel'}?${params}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => setFunnel(d.funnel))
      .catch(() => setError(t('analytics.error')))
      .finally(() => setLoading(false));
  }, [apiEndpoint, startDate, endDate]);

  if (loading) return <p className="text-center py-4 text-muted-foreground">{t('analytics.loading')}</p>;
  if (error) return <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>;
  if (!funnel || funnel.length === 0) return <EmptyState />;

  const chartData = funnel.map(s => ({
    name: t(DIFFICULTY_LABELS[s.difficulty] || s.difficulty),
    started: s.students_started,
    completed: s.students_completed_all,
    completionRate: s.completion_rate,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('analytics.funnel.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 100, right: 40, top: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 13 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="started" name={t('analytics.funnel.started')} fill="hsl(var(--primary))" radius={[0, 4, 4, 0]}>
                <LabelList dataKey="started" position="right" />
              </Bar>
              <Bar dataKey="completed" name={t('analytics.funnel.completed')} fill="hsl(var(--chart-2, 142, 76%, 36%))" radius={[0, 4, 4, 0]}>
                <LabelList dataKey="completed" position="right" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {funnel.map((s, i) => (
            <div key={s.difficulty} className="rounded-lg border p-4 text-center">
              <div className="text-sm font-medium text-muted-foreground mb-1">
                {t(DIFFICULTY_LABELS[s.difficulty] || s.difficulty)}
              </div>
              <div className="text-2xl font-bold text-primary">{s.completion_rate}%</div>
              <div className="text-xs text-muted-foreground">{t('analytics.funnel.completionRate')}</div>
              {s.conversion_from_previous !== null && i > 0 && (
                <div className="mt-2 text-xs text-muted-foreground">
                  {t('analytics.funnel.conversionRate')}: {s.conversion_from_previous}%
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
