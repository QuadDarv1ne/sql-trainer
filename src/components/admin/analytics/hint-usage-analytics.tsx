'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Lightbulb, Users } from 'lucide-react';
import { t } from '@/lib/i18n';
import { useDateRange } from '../analytics-dashboard';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import EmptyState from './empty-state';

export default function HintUsageAnalytics() {
  const [totalHints, setTotalHints] = useState(0);
  const [uniqueStudents, setUniqueStudents] = useState(0);
  const [perTask, setPerTask] = useState<Array<{ task_id: string; task_title: string; hint_count: number; unique_students: number; avg_attempts: number; completion_rate: number }>>([]);
  const [hintReliance, setHintReliance] = useState<Array<{ user_id: string; user_name: string; hints_used: number; tasks_completed: number; hints_per_task: number; reliance_level: string }>>([]);
  const [correlation, setCorrelation] = useState<{ with_hints_avg_attempts: number; without_hints_avg_attempts: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { startDate, endDate } = useDateRange();

  useEffect(() => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', String(startDate));
    if (endDate) params.set('endDate', String(endDate));

    fetch(`/api/admin/analytics/hint-usage?${params}`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to fetch hint usage analytics')))
      .then(data => {
        setTotalHints(data.total_hints_revealed || 0);
        setUniqueStudents(data.unique_students_used_hints || 0);
        setPerTask(data.per_task || []);
        setHintReliance(data.hint_reliance || []);
        setCorrelation(data.hint_completion_correlation);
      })
      .catch(() => setError(t('analytics.error')))
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  if (loading) return <p className="text-center py-4">{t('analytics.loading')}</p>;
  if (error) return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>;

  const stats = [
    { label: t('analytics.hintUsage.totalHints'), value: totalHints, icon: Lightbulb, color: 'text-amber-600' },
    { label: t('analytics.hintUsage.uniqueStudents'), value: uniqueStudents, icon: Users, color: 'text-blue-600' },
  ];

  const relianceLabels: Record<string, string> = { low: t('analytics.hintUsage.low'), medium: t('analytics.hintUsage.medium'), high: t('analytics.hintUsage.high') };
  const relianceColors: Record<string, string> = { low: 'bg-emerald-100 text-emerald-800', medium: 'bg-amber-100 text-amber-800', high: 'bg-red-100 text-red-800' };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t('analytics.hintUsage.title')}</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        {stats.map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {correlation && (
        <Card>
          <CardHeader><CardTitle>{t('analytics.hintUsage.withHints')} vs {t('analytics.hintUsage.withoutHints')}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-amber-600">{correlation.with_hints_avg_attempts}</p>
                <p className="text-sm text-muted-foreground">{t('analytics.hintUsage.withHints')} ({t('analytics.tasks.avgAttempts')})</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{correlation.without_hints_avg_attempts}</p>
                <p className="text-sm text-muted-foreground">{t('analytics.hintUsage.withoutHints')} ({t('analytics.tasks.avgAttempts')})</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {perTask.length > 0 && (
          <Card>
            <CardHeader><CardTitle>{t('analytics.hintUsage.perTask')}</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={perTask.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="task_title" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="hint_count" fill="#f59e0b" name={t('analytics.hintUsage.totalHints')} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {hintReliance.length > 0 && (
          <Card>
            <CardHeader><CardTitle>{t('analytics.hintUsage.reliance')}</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('analytics.deadlineCompliance.student')}</TableHead>
                    <TableHead>{t('analytics.hintUsage.totalHints')}</TableHead>
                    <TableHead>{t('analytics.streaks.tasksCompleted')}</TableHead>
                    <TableHead>{t('analytics.hintUsage.perTask')}</TableHead>
                    <TableHead>{t('analytics.hintUsage.reliance')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hintReliance.slice(0, 15).map(r => (
                    <TableRow key={r.user_id}>
                      <TableCell className="font-medium">{r.user_name}</TableCell>
                      <TableCell>{r.hints_used}</TableCell>
                      <TableCell>{r.tasks_completed}</TableCell>
                      <TableCell>{r.hints_per_task}</TableCell>
                      <TableCell><Badge className={relianceColors[r.reliance_level]}>{relianceLabels[r.reliance_level]}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
