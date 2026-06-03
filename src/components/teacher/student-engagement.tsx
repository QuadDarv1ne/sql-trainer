'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import DataCard from '@/components/ui/data-card';
import { TrendingUp, Activity, AlertCircle } from 'lucide-react';
import { t } from '@/lib/i18n';

interface EngagementMetric {
  user_id: string;
  name: string;
  email: string;
  engagement_score: number;
  consistency_score: number;
  velocity: number;
  last_active_days: number;
  engagement_level: 'high' | 'medium' | 'low' | 'at_risk';
}

export default function StudentEngagement() {
  const [data, setData] = useState<EngagementMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const controllerRef = useRef<AbortController | null>(null);

  const loadData = useCallback(() => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError('');
    fetch('/api/teacher/engagement', { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load');
        return r.json();
      })
      .then((res) => {
        if (!controller.signal.aborted) setData(res.metrics);
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-12" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return <DataCard loading={false} error={error} hasData={false} onRetry={loadData} />;
  }

  if (!data.length) return <p className="text-center py-4 text-muted-foreground">{t('teacher.noData')}</p>;

  const levelLabels: Record<string, string> = {
    high: t('teacher.engagement.high'),
    medium: t('teacher.engagement.medium'),
    low: t('teacher.engagement.low'),
    at_risk: t('teacher.engagement.atRisk'),
  };

  const levelColors: Record<string, string> = {
    high: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    low: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    at_risk: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };

  const highEngagement = data.filter((d) => d.engagement_level === 'high').length;
  const atRisk = data.filter((d) => d.engagement_level === 'at_risk').length;
  const avgEngagement = Math.round(data.reduce((s, d) => s + d.engagement_score, 0) / data.length);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-emerald-600" />
            <div>
              <p className="text-2xl font-bold">{highEngagement}</p>
              <p className="text-xs text-muted-foreground">{t('teacher.engagement.highCount')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Activity className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold">{avgEngagement}%</p>
              <p className="text-xs text-muted-foreground">{t('teacher.engagement.avgScore')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-red-600" />
            <div>
              <p className="text-2xl font-bold">{atRisk}</p>
              <p className="text-xs text-muted-foreground">{t('teacher.engagement.atRiskCount')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engagement table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('teacher.engagement.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('teacher.progress.name')}</TableHead>
                  <TableHead>{t('teacher.engagement.level')}</TableHead>
                  <TableHead>{t('teacher.engagement.score')}</TableHead>
                  <TableHead className="text-right">{t('teacher.engagement.velocity')}</TableHead>
                  <TableHead className="text-right">{t('teacher.progress.lastActive')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((metric) => (
                  <TableRow key={metric.user_id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{metric.name}</div>
                        <div className="text-xs text-muted-foreground">{metric.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={levelColors[metric.engagement_level]}>
                        {levelLabels[metric.engagement_level]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={metric.engagement_score} className="h-2 flex-1" />
                        <span className="text-sm w-10 text-right">{metric.engagement_score}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {metric.velocity} {t('teacher.engagement.perWeek')}
                    </TableCell>
                    <TableCell className="text-right">
                      {metric.last_active_days >= 999
                        ? '—'
                        : `${metric.last_active_days} ${t('teacher.engagement.daysAbbr')}`}
                    </TableCell>
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
