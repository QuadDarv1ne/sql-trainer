'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useDateRange } from '../analytics-dashboard';
import { t } from '@/lib/i18n';
import EmptyState from './empty-state';
import { TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react';

interface LearningPaceEntry {
  user_id: string;
  name: string;
  email: string;
  avg_minutes_between_tasks: number;
  pace_trend: 'accelerating' | 'decelerating' | 'stable';
  estimated_hours_to_complete: number;
  recent_velocity: number;
  total_tasks_completed: number;
}

export default function LearningPaceChart() {
  const [data, setData] = useState<LearningPaceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { startDate, endDate } = useDateRange();

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (startDate) params.set('startDate', String(startDate));
        if (endDate) params.set('endDate', String(endDate));
        const res = await fetch(`/api/admin/analytics/learning-pace?${params}`);
        const json = await res.json();
        setData(json.pace || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [startDate, endDate]);

  if (loading) return <div className="flex justify-center py-8">{t('analytics.loading')}</div>;
  if (error) return <div className="text-red-500 py-8">{error.message}</div>;
  if (data.length === 0) return <EmptyState />;

  const avgVelocity = data.length > 0
    ? (data.reduce((sum, d) => sum + d.recent_velocity, 0) / data.length).toFixed(1)
    : '0';

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('analytics.learningPace.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{data.length}</div>
              <p className="text-xs text-muted-foreground">{t('analytics.learningPace.activeStudents')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{avgVelocity}</div>
              <p className="text-xs text-muted-foreground">{t('analytics.learningPace.avgVelocity')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">
                {data.filter(d => d.pace_trend === 'accelerating').length}
              </div>
              <p className="text-xs text-muted-foreground">{t('analytics.learningPace.accelerating')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-red-600">
                {data.filter(d => d.pace_trend === 'decelerating').length}
              </div>
              <p className="text-xs text-muted-foreground">{t('analytics.learningPace.decelerating')}</p>
            </CardContent>
          </Card>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('analytics.student')}</TableHead>
              <TableHead>{t('analytics.learningPace.completed')}</TableHead>
              <TableHead>{t('analytics.learningPace.avgMinutes')}</TableHead>
              <TableHead>{t('analytics.learningPace.trend')}</TableHead>
              <TableHead>{t('analytics.learningPace.velocity')}</TableHead>
              <TableHead>{t('analytics.learningPace.estimatedTime')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map(entry => (
              <TableRow key={entry.user_id}>
                <TableCell>
                  <div className="font-medium">{entry.name}</div>
                  <div className="text-xs text-muted-foreground">{entry.email}</div>
                </TableCell>
                <TableCell>{entry.total_tasks_completed}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {entry.avg_minutes_between_tasks} {t('analytics.learningPace.minutes')}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={entry.pace_trend === 'accelerating' ? 'default' : entry.pace_trend === 'decelerating' ? 'destructive' : 'secondary'}>
                    {entry.pace_trend === 'accelerating' && <TrendingUp className="h-3 w-3 mr-1" />}
                    {entry.pace_trend === 'decelerating' && <TrendingDown className="h-3 w-3 mr-1" />}
                    {entry.pace_trend === 'stable' && <Minus className="h-3 w-3 mr-1" />}
                    {t(`analytics.learningPace.${entry.pace_trend}`)}
                  </Badge>
                </TableCell>
                <TableCell>{entry.recent_velocity}</TableCell>
                <TableCell>{entry.estimated_hours_to_complete > 0 ? `${entry.estimated_hours_to_complete} ${t('analytics.learningPace.hours')}` : '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
