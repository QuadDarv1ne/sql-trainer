'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { t } from '@/lib/i18n';
import { useDateRange } from '../analytics-dashboard';
import EmptyState from './empty-state';

interface HintImpactEntry {
  task_id: string;
  title: string;
  difficulty: string;
  avg_attempts: number;
  hint_likely_rate: number;
  struggle_score: number;
  completion_rate: number;
  is_bottleneck: boolean;
}

const difficultyLabels: Record<string, string> = {
  beginner: t('analytics.student.beginner'),
  intermediate: t('analytics.student.intermediate'),
  advanced: t('analytics.student.advanced'),
};

export default function HintImpactChart() {
  const [data, setData] = useState<HintImpactEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { startDate, endDate } = useDateRange();

  useEffect(() => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', String(startDate));
    if (endDate) params.set('endDate', String(endDate));

    fetch(`/api/admin/analytics/hint-impact?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load');
        return r.json();
      })
      .then((data) => setData(data.hints))
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

  const scatterData = data.map(d => ({
    x: d.hint_likely_rate,
    y: d.avg_attempts,
    z: d.struggle_score,
    name: d.title.substring(0, 15),
    task_id: d.task_id,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('analytics.hints.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Scatter plot: hint rate vs avg attempts */}
        <div>
          <h3 className="text-sm font-medium mb-2">{t('analytics.hints.scatterTitle')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid />
              <XAxis dataKey="x" name={t('analytics.hints.rate')} unit="%" domain={[0, 100]} />
              <YAxis dataKey="y" name={t('analytics.tasks.avgAttempts')} domain={[0, 'auto']} />
              <ZAxis dataKey="z" range={[50, 400]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(value: number) => value} />
              <Scatter name={t('analytics.hints.tasks')} data={scatterData} fill="hsl(var(--primary))" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Top tasks table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('analytics.errors.task')}</TableHead>
              <TableHead>{t('analytics.errors.level')}</TableHead>
              <TableHead>{t('analytics.hints.rate')}</TableHead>
              <TableHead>{t('analytics.tasks.avgAttempts')}</TableHead>
              <TableHead>{t('analytics.hints.struggleScore')}</TableHead>
              <TableHead>{t('analytics.hints.isBottleneck')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((entry) => (
              <TableRow key={entry.task_id}>
                <TableCell className="font-medium">{entry.title}</TableCell>
                <TableCell>
                  <Badge variant="outline">{difficultyLabels[entry.difficulty]}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={entry.hint_likely_rate} className="h-2 w-16" />
                    <span className="text-xs">{entry.hint_likely_rate}%</span>
                  </div>
                </TableCell>
                <TableCell>{entry.avg_attempts}</TableCell>
                <TableCell>
                  <Badge variant={entry.struggle_score > 60 ? 'destructive' : entry.struggle_score > 40 ? 'default' : 'secondary'}>
                    {entry.struggle_score}
                  </Badge>
                </TableCell>
                <TableCell>
                  {entry.is_bottleneck ? (
                    <Badge variant="destructive">{t('analytics.hints.yes')}</Badge>
                  ) : (
                    <Badge variant="outline">{t('analytics.hints.no')}</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
