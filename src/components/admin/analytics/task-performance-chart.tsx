'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useDateRange } from '../analytics-dashboard';
import { t } from '@/lib/i18n';
import { logger } from '@/lib/logger';
import EmptyState from './empty-state';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';

interface TaskPerformanceEntry {
  task_id: string;
  task_name: string;
  difficulty: string;
  total_attempts: number;
  unique_students: number;
  avg_attempts: number;
  first_attempt_rate: number;
  completion_rate: number;
  avg_time_minutes: number;
  struggling_students: number;
  success_rate_trend: 'improving' | 'declining' | 'stable';
}

export default function TaskPerformanceChart() {
  const [data, setData] = useState<TaskPerformanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const { startDate, endDate } = useDateRange();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (startDate) params.set('startDate', String(startDate));
        if (endDate) params.set('endDate', String(endDate));
        const res = await fetch(`/api/admin/analytics/task-performance?${params}`);
        const json = await res.json();
        setData(json.tasks || []);
      } catch (err) {
        logger.error('Task performance fetch failed', err);
        setError(t('analytics.error'));
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [startDate, endDate]);

  if (loading) return <div className="flex justify-center py-8">{t('analytics.loading')}</div>;
  if (error) return <div className="text-red-500 py-8">{error}</div>;
  if (data.length === 0) return <EmptyState />;

  const filtered = filterDifficulty === 'all' ? data : data.filter((d) => d.difficulty === filterDifficulty);

  const avgSuccessRate =
    data.length > 0 ? (data.reduce((sum, d) => sum + d.first_attempt_rate, 0) / data.length).toFixed(1) : '0';

  const totalStruggling = data.reduce((sum, d) => sum + d.struggling_students, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t('analytics.taskPerformance.title')}</CardTitle>
          <div className="flex gap-2">
            {['all', 'beginner', 'intermediate', 'advanced'].map((diff) => (
              <button
                key={diff}
                onClick={() => setFilterDifficulty(diff)}
                className={`px-3 py-1 text-sm rounded ${filterDifficulty === diff ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
              >
                {diff === 'all' ? t('analytics.all') : t(`difficulty.${diff}`)}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{data.length}</div>
              <p className="text-xs text-muted-foreground">{t('analytics.taskPerformance.totalTasks')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{avgSuccessRate}%</div>
              <p className="text-xs text-muted-foreground">{t('analytics.taskPerformance.avgSuccessRate')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-red-600">{totalStruggling}</div>
              <p className="text-xs text-muted-foreground">{t('analytics.taskPerformance.strugglingTotal')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">
                {data.filter((d) => d.success_rate_trend === 'improving').length}
              </div>
              <p className="text-xs text-muted-foreground">{t('analytics.taskPerformance.improving')}</p>
            </CardContent>
          </Card>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('analytics.taskPerformance.task')}</TableHead>
              <TableHead>{t('analytics.difficulty')}</TableHead>
              <TableHead>{t('analytics.taskPerformance.students')}</TableHead>
              <TableHead>{t('analytics.taskPerformance.avgAttempts')}</TableHead>
              <TableHead>{t('analytics.taskPerformance.successRate')}</TableHead>
              <TableHead>{t('analytics.taskPerformance.time')}</TableHead>
              <TableHead>{t('analytics.taskPerformance.struggling')}</TableHead>
              <TableHead>{t('analytics.taskPerformance.trend')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((entry) => (
              <TableRow key={entry.task_id}>
                <TableCell className="font-medium">{entry.task_name}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      entry.difficulty === 'beginner'
                        ? 'default'
                        : entry.difficulty === 'intermediate'
                          ? 'secondary'
                          : 'destructive'
                    }
                  >
                    {t(`difficulty.${entry.difficulty}`)}
                  </Badge>
                </TableCell>
                <TableCell>{entry.unique_students}</TableCell>
                <TableCell>{entry.avg_attempts}</TableCell>
                <TableCell>{entry.first_attempt_rate}%</TableCell>
                <TableCell>
                  {entry.avg_time_minutes > 0 ? `${entry.avg_time_minutes} ${t('analytics.minutes')}` : '—'}
                </TableCell>
                <TableCell>
                  {entry.struggling_students > 0 ? (
                    <span className="flex items-center gap-1 text-red-600">
                      <AlertTriangle className="h-4 w-4" />
                      {entry.struggling_students}
                    </span>
                  ) : (
                    '0'
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      entry.success_rate_trend === 'improving'
                        ? 'default'
                        : entry.success_rate_trend === 'declining'
                          ? 'destructive'
                          : 'secondary'
                    }
                  >
                    {entry.success_rate_trend === 'improving' && <TrendingUp className="h-3 w-3 mr-1" />}
                    {entry.success_rate_trend === 'declining' && <TrendingDown className="h-3 w-3 mr-1" />}
                    {entry.success_rate_trend === 'stable' && <Minus className="h-3 w-3 mr-1" />}
                    {t(`analytics.taskPerformance.${entry.success_rate_trend}`)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
