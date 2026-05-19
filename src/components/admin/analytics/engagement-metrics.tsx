'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertCircle, Users, TrendingUp, Activity } from 'lucide-react';
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

export default function EngagementMetrics() {
  const [data, setData] = useState<EngagementMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/analytics/engagement')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load');
        return r.json();
      })
      .then((data) => setData(data.metrics))
      .catch(() => setError(t('analytics.error')))
      .finally(() => setLoading(false));
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
  if (!data.length) return <p className="text-center py-4">{t('analytics.noData')}</p>;

  const levelLabels: Record<string, string> = {
    high: 'Высокий',
    medium: 'Средний',
    low: 'Низкий',
    at_risk: 'В зоне риска',
  };

  const levelColors: Record<string, string> = {
    high: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    low: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    at_risk: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };

  const highEngagement = data.filter(d => d.engagement_level === 'high').length;
  const atRisk = data.filter(d => d.engagement_level === 'at_risk').length;
  const avgEngagement = Math.round(data.reduce((s, d) => s + d.engagement_score, 0) / data.length);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-8 w-8 text-emerald-600" />
            <div>
              <p className="text-2xl font-bold">{highEngagement}</p>
              <p className="text-xs text-muted-foreground">Высокая вовлечённость</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Activity className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold">{avgEngagement}%</p>
              <p className="text-xs text-muted-foreground">Средний балл</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-red-600" />
            <div>
              <p className="text-2xl font-bold">{atRisk}</p>
              <p className="text-xs text-muted-foreground">В зоне риска</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engagement table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Метрики вовлечённости студентов
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Студент</TableHead>
                  <TableHead>Уровень</TableHead>
                  <TableHead>Вовлечённость</TableHead>
                  <TableHead className="text-right">Скорость (зад/нед)</TableHead>
                  <TableHead className="text-right">Дней назад</TableHead>
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
                    <TableCell className="text-right">{metric.velocity}</TableCell>
                    <TableCell className="text-right">
                      {metric.last_active_days >= 999 ? '—' : metric.last_active_days}
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
