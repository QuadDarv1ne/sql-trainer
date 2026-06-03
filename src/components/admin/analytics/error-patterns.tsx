'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { t } from '@/lib/i18n';
import { useDateRange } from '../analytics-dashboard';
import EmptyState from './empty-state';

interface ErrorPatternEntry {
  task_id: string;
  task_name: string;
  difficulty: string;
  high_attempt_count: number;
  avg_attempts: number;
  max_attempts: number;
  failure_rate: number;
}

export default function ErrorPatternsTable() {
  const [data, setData] = useState<ErrorPatternEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { startDate, endDate } = useDateRange();

  useEffect(() => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', String(startDate));
    if (endDate) params.set('endDate', String(endDate));

    fetch(`/api/admin/analytics/error-patterns?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load');
        return r.json();
      })
      .then((data) => setData(data.patterns))
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

  const difficultyLabels: Record<string, string> = {
    beginner: t('analytics.student.beginner'),
    intermediate: t('analytics.student.intermediate'),
    advanced: t('analytics.student.advanced'),
  };

  const difficultyColors: Record<string, string> = {
    beginner: 'border-emerald-500 text-emerald-600',
    intermediate: 'border-amber-500 text-amber-600',
    advanced: 'border-red-500 text-red-600',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          {t('analytics.errors.patternTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('analytics.errors.task')}</TableHead>
                <TableHead>{t('analytics.errors.level')}</TableHead>
                <TableHead className="text-right">{t('analytics.errors.avgAttempts')}</TableHead>
                <TableHead className="text-right">{t('analytics.errors.maxAttempts')}</TableHead>
                <TableHead className="text-right">{t('analytics.errors.failureRate')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((pattern) => (
                <TableRow key={pattern.task_id}>
                  <TableCell className="font-medium">{pattern.task_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={difficultyColors[pattern.difficulty]}>
                      {difficultyLabels[pattern.difficulty]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{pattern.avg_attempts}</TableCell>
                  <TableCell className="text-right">{pattern.max_attempts}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={pattern.failure_rate > 30 ? 'destructive' : 'secondary'}>
                      {pattern.failure_rate}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
