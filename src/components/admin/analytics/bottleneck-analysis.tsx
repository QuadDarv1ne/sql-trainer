'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { t } from '@/lib/i18n';
import { useDateRange } from '../analytics-dashboard';
import EmptyState from './empty-state';

interface BottleneckEntry {
  task_id: string;
  title: string;
  difficulty: string;
  students_attempted: number;
  avg_attempts: number;
  high_attempt_students: number;
  drop_off_rate: number;
  subsequent_task_completion_rate: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

const severityColors: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

const severityLabels: Record<string, string> = {
  critical: t('analytics.bottlenecks.critical'),
  high: t('analytics.bottlenecks.high'),
  medium: t('analytics.bottlenecks.medium'),
  low: t('analytics.bottlenecks.low'),
};

const difficultyLabels: Record<string, string> = {
  beginner: t('analytics.student.beginner'),
  intermediate: t('analytics.student.intermediate'),
  advanced: t('analytics.student.advanced'),
};

export default function BottleneckAnalysis() {
  const [data, setData] = useState<BottleneckEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { startDate, endDate } = useDateRange();

  useEffect(() => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', String(startDate));
    if (endDate) params.set('endDate', String(endDate));

    fetch(`/api/admin/analytics/bottlenecks?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load');
        return r.json();
      })
      .then((data) => setData(data.bottlenecks))
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('analytics.bottlenecks.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('analytics.errors.task')}</TableHead>
              <TableHead>{t('analytics.errors.level')}</TableHead>
              <TableHead>{t('analytics.bottlenecks.severity')}</TableHead>
              <TableHead>{t('analytics.bottlenecks.dropOff')}</TableHead>
              <TableHead>{t('analytics.tasks.avgAttempts')}</TableHead>
              <TableHead>{t('analytics.bottlenecks.subsequent')}</TableHead>
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
                  <Badge className={severityColors[entry.severity]}>{severityLabels[entry.severity]}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={entry.drop_off_rate} className="h-2 w-20" />
                    <span className="text-xs">{entry.drop_off_rate}%</span>
                  </div>
                </TableCell>
                <TableCell>{entry.avg_attempts}</TableCell>
                <TableCell>{entry.subsequent_task_completion_rate}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
