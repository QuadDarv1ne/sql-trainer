'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, RotateCcw, GraduationCap, TrendingUp, AlertCircle } from 'lucide-react';
import { t } from '@/lib/i18n';
import { useDateRange } from '../analytics-dashboard';
import EmptyState from './empty-state';

interface PerformanceData {
  activeUsers7d: number;
  avgAttempts: number;
  totalStudents: number;
  completionRate: number;
}

export default function PerformanceMetrics() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { startDate, endDate } = useDateRange();

  useEffect(() => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', String(startDate));
    if (endDate) params.set('endDate', String(endDate));

    fetch(`/api/admin/analytics/performance?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load');
        return r.json();
      })
      .then((data) => setData(data))
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
  if (!data) return <EmptyState />;

  const metrics = [
    {
      label: t('analytics.metrics.activeUsers'),
      value: data.activeUsers7d,
      icon: Users,
      color: 'text-blue-600',
    },
    {
      label: t('analytics.metrics.avgAttempts'),
      value: data.avgAttempts,
      icon: RotateCcw,
      color: 'text-amber-600',
    },
    {
      label: t('analytics.metrics.totalStudents'),
      value: data.totalStudents,
      icon: GraduationCap,
      color: 'text-emerald-600',
    },
    {
      label: t('analytics.metrics.completionRate'),
      value: `${data.completionRate}%`,
      icon: TrendingUp,
      color: 'text-purple-600',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.label}>
          <CardContent className="p-4 flex items-center gap-3">
            <metric.icon className={`h-8 w-8 ${metric.color}`} />
            <div>
              <p className="text-2xl font-bold">{metric.value}</p>
              <p className="text-xs text-muted-foreground">{metric.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
