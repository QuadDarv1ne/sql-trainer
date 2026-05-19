'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Cell,
} from 'recharts';
import { TRAINING_TASKS, DIFFICULTY_LABELS, type Difficulty } from '@/lib/training-tasks';
import { t } from '@/lib/i18n';

interface TaskAnalyticsEntry {
  task_id: string;
  title?: string;
  difficulty?: string;
  completions: number;
  avg_attempts: number;
  first_attempt_rate: number;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: '#10b981',
  intermediate: '#f59e0b',
  advanced: '#ef4444',
};

export default function TaskAnalyticsChart() {
  const [data, setData] = useState<TaskAnalyticsEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/analytics/tasks')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load');
        return r.json();
      })
      .then((data) => setData(data.tasks))
      .catch(() => setError(t('analytics.error')))
      .finally(() => setLoading(false));
  }, []);

  const enrichedData = useMemo(() => {
    return data.map((task) => {
      const trainingTask = TRAINING_TASKS.find((t) => t.id === task.task_id);
      return {
        ...task,
        title: trainingTask?.title || task.task_id,
        difficulty: trainingTask?.difficulty || 'beginner',
      };
    });
  }, [data]);

  const top15ByAttempts = useMemo(() => {
    return [...enrichedData]
      .sort((a, b) => b.avg_attempts - a.avg_attempts)
      .slice(0, 15);
  }, [enrichedData]);

  const hardest10 = useMemo(() => {
    return [...enrichedData]
      .sort((a, b) => b.avg_attempts - a.avg_attempts)
      .slice(0, 10);
  }, [enrichedData]);

  if (loading) return <p className="text-center py-4">{t('analytics.loading')}</p>;
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  if (!enrichedData.length) return <p className="text-center py-4">{t('analytics.noData')}</p>;

  const chartData = top15ByAttempts.map((task) => ({
    name: task.title?.slice(0, 20) || task.task_id,
    avg_attempts: Math.round(task.avg_attempts * 10) / 10,
    difficulty: task.difficulty,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('analytics.tasks.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-sm font-medium mb-2">{t('analytics.tasks.byDifficulty')}</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="avg_attempts" name={t('analytics.tasks.avgAttempts')}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={DIFFICULTY_COLORS[entry.difficulty] || '#888888'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">{t('analytics.tasks.hardest')}</h3>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('analytics.tasks.taskName')}</TableHead>
                  <TableHead>{t('analytics.tasks.difficulty')}</TableHead>
                  <TableHead>{t('analytics.tasks.completions')}</TableHead>
                  <TableHead>{t('analytics.tasks.avgAttempts')}</TableHead>
                  <TableHead>{t('analytics.tasks.firstAttemptRate')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hardest10.map((task) => (
                  <TableRow key={task.task_id}>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          task.difficulty === 'beginner'
                            ? 'border-emerald-500 text-emerald-600'
                            : task.difficulty === 'intermediate'
                            ? 'border-amber-500 text-amber-600'
                            : 'border-red-500 text-red-600'
                        }
                      >
                        {DIFFICULTY_LABELS[task.difficulty as Difficulty]}
                      </Badge>
                    </TableCell>
                    <TableCell>{task.completions}</TableCell>
                    <TableCell>{Math.round(task.avg_attempts * 10) / 10}</TableCell>
                    <TableCell>{task.first_attempt_rate}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
