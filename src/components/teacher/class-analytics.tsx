'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import DataCard from '@/components/ui/data-card';
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
  const controllerRef = useRef<AbortController | null>(null);

  const loadData = useCallback(() => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError('');
    fetch('/api/teacher/analytics', { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load');
        return r.json();
      })
      .then((res) => {
        if (!controller.signal.aborted) setData(res.analytics);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(t('teacher.error'));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadData();
    return () => controllerRef.current?.abort();
  }, [loadData]);

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
      <DataCard
        title={t('teacher.analytics.completionByLevel')}
        loading={loading}
        error={error}
        hasData={!!data}
        onRetry={loadData}
      >
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data?.difficultyStats || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="difficulty" tickFormatter={(v) => difficultyLabels[v]} />
            <YAxis />
            <Tooltip labelFormatter={(v) => difficultyLabels[v]} />
            <Legend formatter={(v) => difficultyLabels[v]} />
            <Bar
              dataKey="completed"
              name={t('teacher.progress.completed')}
              fill={difficultyColors[data?.difficultyStats[0]?.difficulty || 'beginner']}
            />
            <Bar dataKey="avgAttempts" name={t('teacher.progress.avgAttempts')} fill="#6366f1" />
          </BarChart>
        </ResponsiveContainer>
      </DataCard>

      {/* Top and struggling tasks */}
      <div className="grid gap-6 lg:grid-cols-2">
        <DataCard
          title={t('teacher.analytics.easiestTasks')}
          loading={loading}
          error={error}
          hasData={!!data}
          onRetry={loadData}
        >
          <div className="space-y-2">
            {(data?.topTasks || []).slice(0, 5).map((task) => (
              <div key={task.task_id} className="flex items-center justify-between p-2 rounded border">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{task.task_id}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">
                    {task.completions} {t('teacher.analytics.completions')}
                  </span>
                  <span className="text-muted-foreground">
                    {t('teacher.progress.avgAttempts')}: {task.avg_attempts}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </DataCard>

        <DataCard
          title={t('teacher.analytics.hardestTasks')}
          loading={loading}
          error={error}
          hasData={!!data}
          onRetry={loadData}
        >
          <div className="space-y-2">
            {(data?.strugglingTasks || []).slice(0, 5).map((task) => (
              <div
                key={task.task_id}
                className="flex items-center justify-between p-2 rounded border border-red-200 dark:border-red-900"
              >
                <span className="text-sm font-medium">{task.task_id}</span>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-red-600">
                    {t('teacher.progress.avgAttempts')}: {task.avg_attempts}
                  </span>
                  <span className="text-muted-foreground">
                    {task.failure_rate}% {t('teacher.analytics.failRate')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </DataCard>
      </div>
    </div>
  );
}
