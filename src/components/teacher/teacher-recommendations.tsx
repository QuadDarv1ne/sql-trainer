'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import DataCard from '@/components/ui/data-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Lightbulb } from 'lucide-react';
import { t } from '@/lib/i18n';

interface Recommendation {
  type: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  target_users?: string[];
}

const priorityColors: Record<string, string> = {
  high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
};

export default function TeacherRecommendations() {
  const priorityLabels: Record<string, string> = {
    high: t('analytics.churn.high'),
    medium: t('analytics.churn.medium'),
    low: t('analytics.churn.low'),
  };

  const [data, setData] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const controllerRef = useRef<AbortController | null>(null);

  const loadData = useCallback(() => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError('');
    fetch('/api/teacher/recommendations', { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load');
        return r.json();
      })
      .then((res) => { if (!controller.signal.aborted) setData(res.data); })
      .catch(() => { if (!controller.signal.aborted) setError(t('teacher.error')); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
  }, []);

  useEffect(() => {
    loadData();
    return () => controllerRef.current?.abort();
  }, [loadData]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-6 w-48" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-lg border p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return <DataCard loading={false} error={error} hasData={false} onRetry={loadData} />;
  }

  if (!data.length) return <p className="text-center py-4 text-muted-foreground">{t('teacher.noData')}</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          {t('teacher.recommendations.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((rec) => (
            <div key={rec.title} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-medium">{rec.title}</h4>
                <Badge className={priorityColors[rec.priority] || ''}>
                  {priorityLabels[rec.priority] || rec.priority}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
              {rec.target_users && rec.target_users.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {t('teacher.recommendations.target')}: {rec.target_users.slice(0, 5).join(', ')}
                  {rec.target_users.length > 5 && ` +${rec.target_users.length - 5}`}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
