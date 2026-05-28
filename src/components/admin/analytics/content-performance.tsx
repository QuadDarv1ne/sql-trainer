'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Brain, Sparkles, Lightbulb, BookOpen } from 'lucide-react';
import { t } from '@/lib/i18n';
import { useAnalyticsQuery } from '@/hooks/use-analytics-query';
import { AnalyticsCard } from './analytics-card';

interface TaskMetric {
  task_id: string;
  task_title: string;
  difficulty: string;
  category: string;
  completions: number;
  avg_attempts: number;
  first_attempt_rate: number;
  unique_students: number;
  hint_count: number;
}

interface ContentPerformanceData {
  hardest_tasks: TaskMetric[];
  easiest_tasks: TaskMetric[];
  most_hinted_tasks: TaskMetric[];
  by_category: Array<{ category: string; task_count: number; total_completions: number; avg_attempts: number; total_hints: number }>;
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const colors: Record<string, string> = {
    beginner: 'border-emerald-500 text-emerald-600',
    intermediate: 'border-amber-500 text-amber-600',
    advanced: 'border-red-500 text-red-600',
  };
  const labels: Record<string, string> = {
    beginner: t('analytics.student.beginner'),
    intermediate: t('analytics.student.intermediate'),
    advanced: t('analytics.student.advanced'),
  };
  return (
    <Badge variant="outline" className={colors[difficulty] || ''}>
      {labels[difficulty] || difficulty}
    </Badge>
  );
}

function TaskTable({ title, icon: Icon, tasks, metricKey, metricLabel }: { title: string; icon: typeof Brain; tasks: TaskMetric[]; metricKey: keyof TaskMetric; metricLabel: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('analytics.contentPerformance.task')}</TableHead>
                <TableHead>{t('analytics.contentPerformance.difficulty')}</TableHead>
                <TableHead className="text-right">{metricLabel}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.task_id}>
                  <TableCell className="font-medium text-sm">{task.task_title}</TableCell>
                  <TableCell><DifficultyBadge difficulty={task.difficulty} /></TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {typeof task[metricKey] === 'number' ? (task[metricKey] as number).toFixed(1) : String(task[metricKey])}
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

export default function ContentPerformance() {
  const { data, loading, error, refetch } = useAnalyticsQuery<ContentPerformanceData>({
    endpoint: '/api/admin/analytics/content-performance',
    dataKey: 'contentPerformance',
  });

  if (loading || error || !data) {
    return (
      <AnalyticsCard loading={loading} error={error} empty={!data} onRefresh={refetch} title={t('analytics.contentPerformance.title')} />
    );
  }

  return (
    <div className="space-y-6">
      {/* Three task tables */}
      <div className="grid gap-6 lg:grid-cols-3">
        <TaskTable
          title={t('analytics.contentPerformance.hardest')}
          icon={Brain}
          tasks={data.hardest_tasks}
          metricKey="avg_attempts"
          metricLabel={t('analytics.contentPerformance.avgAttempts')}
        />
        <TaskTable
          title={t('analytics.contentPerformance.easiest')}
          icon={Sparkles}
          tasks={data.easiest_tasks}
          metricKey="first_attempt_rate"
          metricLabel={t('analytics.contentPerformance.firstAttemptRate')}
        />
        <TaskTable
          title={t('analytics.contentPerformance.mostHinted')}
          icon={Lightbulb}
          tasks={data.most_hinted_tasks}
          metricKey="hint_count"
          metricLabel={t('analytics.contentPerformance.hintCount')}
        />
      </div>

      {/* Category breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {t('analytics.contentPerformance.byCategory')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('analytics.contentPerformance.category')}</TableHead>
                  <TableHead className="text-right">{t('analytics.contentPerformance.taskCount')}</TableHead>
                  <TableHead className="text-right">{t('analytics.contentPerformance.completions')}</TableHead>
                  <TableHead className="text-right">{t('analytics.contentPerformance.avgAttempts')}</TableHead>
                  <TableHead className="text-right">{t('analytics.contentPerformance.hints')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.by_category.map((cat) => (
                  <TableRow key={cat.category}>
                    <TableCell className="font-medium">{cat.category}</TableCell>
                    <TableCell className="text-right">{cat.task_count}</TableCell>
                    <TableCell className="text-right">{cat.total_completions}</TableCell>
                    <TableCell className="text-right">{cat.avg_attempts}</TableCell>
                    <TableCell className="text-right">{cat.total_hints}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
