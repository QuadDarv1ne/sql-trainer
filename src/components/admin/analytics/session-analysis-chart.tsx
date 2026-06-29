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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { t } from '@/lib/i18n';
import EmptyState from './empty-state';

interface SessionEntry {
  user_id: string;
  name: string;
  email: string;
  total_sessions: number;
  avg_tasks_per_session: number;
  avg_session_duration_minutes: number;
  longest_session_tasks: number;
  preferred_time_of_day: string;
  weekend_session_ratio: number;
}

const timeColors: Record<string, string> = {
  Morning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  Afternoon: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  Evening: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  Night: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
};

export default function SessionAnalysisChart() {
  const [data, setData] = useState<SessionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/admin/analytics/sessions', { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load');
        return r.json();
      })
      .then((data) => {
        if (!controller.signal.aborted) setData(data.sessions);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(t('analytics.error'));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

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

  // Time of day distribution
  const timeDist: Record<string, number> = {};
  data.forEach((d) => {
    timeDist[d.preferred_time_of_day] = (timeDist[d.preferred_time_of_day] || 0) + 1;
  });
  const pieData = Object.entries(timeDist).map(([name, value]) => ({ name, value }));
  const COLORS = ['hsl(var(--warning))', 'hsl(var(--primary))', 'hsl(var(--purple))', 'hsl(var(--muted))'];

  // Top students by session count
  const topStudents = [...data].sort((a, b) => b.total_sessions - a.total_sessions).slice(0, 10);

  const avgSessions = Math.round(data.reduce((s, d) => s + d.total_sessions, 0) / data.length);
  const avgTasksPerSession =
    Math.round((data.reduce((s, d) => s + d.avg_tasks_per_session, 0) / data.length) * 10) / 10;
  const avgDuration = Math.round(data.reduce((s, d) => s + d.avg_session_duration_minutes, 0) / data.length);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('analytics.sessions.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="p-4 rounded-lg border space-y-1">
            <div className="text-xs text-muted-foreground">{t('analytics.sessions.avgSessions')}</div>
            <div className="text-2xl font-bold">{avgSessions}</div>
          </div>
          <div className="p-4 rounded-lg border space-y-1">
            <div className="text-xs text-muted-foreground">{t('analytics.sessions.avgPerSession')}</div>
            <div className="text-2xl font-bold">{avgTasksPerSession}</div>
          </div>
          <div className="p-4 rounded-lg border space-y-1">
            <div className="text-xs text-muted-foreground">{t('analytics.sessions.avgDuration')}</div>
            <div className="text-2xl font-bold">
              {avgDuration} {t('analytics.sessions.minutes')}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Time of day pie chart */}
          <div>
            <h3 className="text-sm font-medium mb-2">{t('analytics.sessions.timeOfDay')}</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${Math.round(percent * 100)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={COLORS[pieData.indexOf(entry) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top students bar chart */}
          <div>
            <h3 className="text-sm font-medium mb-2">{t('analytics.sessions.topStudents')}</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topStudents} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="total_sessions" fill="hsl(var(--primary))" name={t('analytics.sessions.totalSessions')} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Session details table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('analytics.leaderboard.name')}</TableHead>
              <TableHead>{t('analytics.sessions.totalSessions')}</TableHead>
              <TableHead>{t('analytics.sessions.avgPerSession')}</TableHead>
              <TableHead>{t('analytics.sessions.duration')}</TableHead>
              <TableHead>{t('analytics.sessions.timeOfDay')}</TableHead>
              <TableHead>{t('analytics.sessions.weekend')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((entry) => (
              <TableRow key={entry.user_id}>
                <TableCell className="font-medium">{entry.name}</TableCell>
                <TableCell>{entry.total_sessions}</TableCell>
                <TableCell>{entry.avg_tasks_per_session}</TableCell>
                <TableCell>
                  {entry.avg_session_duration_minutes} {t('analytics.sessions.minutes')}
                </TableCell>
                <TableCell>
                  <Badge className={timeColors[entry.preferred_time_of_day] || ''}>{entry.preferred_time_of_day}</Badge>
                </TableCell>
                <TableCell>{Math.round(entry.weekend_session_ratio * 100)}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
