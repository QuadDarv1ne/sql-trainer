'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle } from 'lucide-react';
import { t } from '@/lib/i18n';

interface DifficultyStats {
  difficulty: string;
  completed: number;
  total: number;
  avgAttempts: number;
  firstAttemptRate: number;
}

interface ClassAnalyticsData {
  difficultyStats: DifficultyStats[];
  completionByLevel: {
    beginner: number;
    intermediate: number;
    advanced: number;
  };
  topTasks: Array<{ task_id: string; completions: number; avg_attempts: number }>;
  strugglingTasks: Array<{ task_id: string; avg_attempts: number; failure_rate: number }>;
}

export default function ClassAnalytics() {
  const [data, setData] = useState<ClassAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/teacher/analytics')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load');
        return r.json();
      })
      .then((data) => setData(data.analytics))
      .catch(() => setError(t('teacher.error')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-center py-4">{t('teacher.loading')}</p>;
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  if (!data) return <p className="text-center py-4">{t('teacher.noData')}</p>;

  const difficultyLabels: Record<string, string> = {
    beginner: t('difficulty.beginner'),
    intermediate: t('difficulty.intermediate'),
    advanced: t('difficulty.advanced'),
  };

  const difficultyColors: Record<string, string> = {
    beginner: '#10b981',
    intermediate: '#f59e0b',
    advanced: '#ef4444',
  };

  return (
    <div className="space-y-6">
      {/* Completion by difficulty chart */}
      <Card>
        <CardHeader>
          <CardTitle>{t('teacher.analytics.completionByLevel')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.difficultyStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="difficulty" tickFormatter={(v) => difficultyLabels[v]} />
              <YAxis />
              <Tooltip labelFormatter={(v) => difficultyLabels[v]} />
              <Legend formatter={(v) => difficultyLabels[v]} />
              <Bar
                dataKey="completed"
                name={t('teacher.progress.completed')}
                fill={difficultyColors[data.difficultyStats[0]?.difficulty || 'beginner']}
              />
              <Bar
                dataKey="avgAttempts"
                name={t('teacher.progress.avgAttempts')}
                fill="#6366f1"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top and struggling tasks */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-emerald-600">
              {t('teacher.analytics.easiestTasks')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.topTasks.slice(0, 5).map((task, i) => (
                <div key={task.task_id} className="flex items-center justify-between p-2 rounded border">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-100 text-emerald-800">#{i + 1}</Badge>
                    <span className="text-sm font-medium">{task.task_id}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">{task.completions} {t('teacher.analytics.completions')}</span>
                    <span className="text-muted-foreground">{t('teacher.progress.avgAttempts')}: {task.avg_attempts}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-red-600">
              {t('teacher.analytics.hardestTasks')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.strugglingTasks.slice(0, 5).map((task, i) => (
                <div key={task.task_id} className="flex items-center justify-between p-2 rounded border border-red-200 dark:border-red-900">
                  <span className="text-sm font-medium">{task.task_id}</span>
                  <div className="flex items-center gap-4 text-sm">
                    <Badge variant="outline" className="border-red-500 text-red-600">
                      {t('teacher.progress.avgAttempts')}: {task.avg_attempts}
                    </Badge>
                    <span className="text-muted-foreground">{task.failure_rate}% {t('teacher.analytics.failRate')}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
