'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { t } from '@/lib/i18n';
import { useDateRange } from '../analytics-dashboard';
import EmptyState from './empty-state';

interface PredictiveGradeEntry {
  user_id: string;
  name: string;
  email: string;
  current_score: number;
  predicted_final: number;
  grade_letter: string;
  confidence: number;
  trajectory: 'rising' | 'flat' | 'falling';
  weeks_of_data: number;
}

const gradeColors: Record<string, string> = {
  A: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  B: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  C: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  D: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  F: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export default function PredictiveGradesTable() {
  const [data, setData] = useState<PredictiveGradeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { startDate, endDate } = useDateRange();

  useEffect(() => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', String(startDate));
    if (endDate) params.set('endDate', String(endDate));

    fetch(`/api/admin/analytics/predictive-grades?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load');
        return r.json();
      })
      .then((data) => setData(data.grades))
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
  if (!data.length) return <EmptyState />;

  const TrajectoryIcon = ({ trajectory }: { trajectory: string }) => {
    if (trajectory === 'rising') return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    if (trajectory === 'falling') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('analytics.grades.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('analytics.leaderboard.name')}</TableHead>
              <TableHead>{t('analytics.grades.current')}</TableHead>
              <TableHead>{t('analytics.grades.predicted')}</TableHead>
              <TableHead>{t('analytics.grades.letter')}</TableHead>
              <TableHead>{t('analytics.grades.confidence')}</TableHead>
              <TableHead>{t('analytics.grades.trajectory')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((entry) => (
              <TableRow key={entry.user_id}>
                <TableCell className="font-medium">{entry.name}</TableCell>
                <TableCell>
                  <Progress value={entry.current_score} className="h-2 w-24" />
                  <span className="text-xs ml-2">{entry.current_score}%</span>
                </TableCell>
                <TableCell>
                  <Progress value={entry.predicted_final} className="h-2 w-24" />
                  <span className="text-xs ml-2">{entry.predicted_final}%</span>
                </TableCell>
                <TableCell>
                  <Badge className={gradeColors[entry.grade_letter] || ''}>{entry.grade_letter}</Badge>
                </TableCell>
                <TableCell>{Math.round(entry.confidence * 100)}%</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <TrajectoryIcon trajectory={entry.trajectory} />
                    <span className="text-xs">
                      {entry.trajectory === 'rising'
                        ? t('analytics.grades.rising')
                        : entry.trajectory === 'falling'
                          ? t('analytics.grades.falling')
                          : t('analytics.grades.flat')}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
