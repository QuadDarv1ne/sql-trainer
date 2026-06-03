'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, BookOpen, Target, AlertTriangle } from 'lucide-react';
import { t } from '@/lib/i18n';
import { useDateRange } from '../analytics-dashboard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import EmptyState from './empty-state';

export default function TopicMastery() {
  const [byCategory, setByCategory] = useState<
    Array<{
      category: string;
      task_count: number;
      total_completions: number;
      unique_students: number;
      avg_attempts: number;
      completion_rate: number;
    }>
  >([]);
  const [byDifficulty, setByDifficulty] = useState<
    Array<{
      difficulty: string;
      task_count: number;
      total_completions: number;
      unique_students: number;
      avg_attempts: number;
      first_attempt_rate: number;
    }>
  >([]);
  const [hardestTasks, setHardestTasks] = useState<
    Array<{
      task_id: string;
      task_title: string;
      difficulty: string;
      category: string;
      completions: number;
      avg_attempts: number;
      failure_rate: number;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { startDate, endDate } = useDateRange();

  useEffect(() => {
    fetch('/api/admin/analytics/topic-mastery')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to fetch topic mastery'))))
      .then((data) => {
        setByCategory(data.by_category || []);
        setByDifficulty(data.by_difficulty || []);
        setHardestTasks(data.hardest_tasks || []);
      })
      .catch(() => setError(t('analytics.error')))
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  if (loading) return <p className="text-center py-4">{t('analytics.loading')}</p>;
  if (error)
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  if (byCategory.length === 0) return <EmptyState />;

  const categoryChartData = byCategory.map((c) => ({
    category: c.category,
    completion_rate: c.completion_rate,
    avg_attempts: c.avg_attempts,
  }));

  const difficultyColor = (diff: string) => {
    if (diff === 'beginner') return 'bg-green-100 text-green-800';
    if (diff === 'intermediate') return 'bg-amber-100 text-amber-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t('analytics.topicMastery.title')}</h2>

      {/* By Category */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {t('analytics.topicMastery.byCategory')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={categoryChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completion_rate" fill="#3b82f6" name={t('analytics.topicMastery.completionRate')} />
              <Bar dataKey="avg_attempts" fill="#f59e0b" name={t('analytics.topicMastery.avgAttempts')} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* By Difficulty */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {t('analytics.topicMastery.byDifficulty')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('analytics.topicMastery.difficulty')}</TableHead>
                  <TableHead>{t('analytics.topicMastery.tasks')}</TableHead>
                  <TableHead>{t('analytics.topicMastery.completions')}</TableHead>
                  <TableHead>{t('analytics.topicMastery.avgAttempts')}</TableHead>
                  <TableHead>{t('analytics.topicMastery.firstAttempt')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byDifficulty.map((d) => (
                  <TableRow key={d.difficulty}>
                    <TableCell>
                      <Badge className={difficultyColor(d.difficulty)}>{d.difficulty}</Badge>
                    </TableCell>
                    <TableCell>{d.task_count}</TableCell>
                    <TableCell>{d.total_completions}</TableCell>
                    <TableCell>{d.avg_attempts}</TableCell>
                    <TableCell>{d.first_attempt_rate}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Hardest Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              {t('analytics.topicMastery.hardestTasks')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('analytics.topicMastery.task')}</TableHead>
                  <TableHead>{t('analytics.topicMastery.difficulty')}</TableHead>
                  <TableHead>{t('analytics.topicMastery.attempts')}</TableHead>
                  <TableHead>{t('analytics.topicMastery.failureRate')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hardestTasks.slice(0, 10).map((task) => (
                  <TableRow key={task.task_id}>
                    <TableCell className="font-medium">{task.task_title}</TableCell>
                    <TableCell>
                      <Badge className={difficultyColor(task.difficulty)}>{task.difficulty}</Badge>
                    </TableCell>
                    <TableCell>{task.avg_attempts}</TableCell>
                    <TableCell>
                      <Badge variant={task.failure_rate > 50 ? 'destructive' : 'secondary'}>{task.failure_rate}%</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Category Details */}
      <Card>
        <CardHeader>
          <CardTitle>{t('analytics.topicMastery.categoryDetails')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('analytics.topicMastery.category')}</TableHead>
                <TableHead>{t('analytics.topicMastery.tasks')}</TableHead>
                <TableHead>{t('analytics.topicMastery.completions')}</TableHead>
                <TableHead>{t('analytics.topicMastery.students')}</TableHead>
                <TableHead>{t('analytics.topicMastery.avgAttempts')}</TableHead>
                <TableHead>{t('analytics.topicMastery.completionRate')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {byCategory.map((c) => (
                <TableRow key={c.category}>
                  <TableCell className="font-medium">{c.category}</TableCell>
                  <TableCell>{c.task_count}</TableCell>
                  <TableCell>{c.total_completions}</TableCell>
                  <TableCell>{c.unique_students}</TableCell>
                  <TableCell>{c.avg_attempts}</TableCell>
                  <TableCell>{c.completion_rate}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
