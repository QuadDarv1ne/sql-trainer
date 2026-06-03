'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, TrendingUp, TrendingDown, Minus, Target } from 'lucide-react';
import StudentDetailDialog from './student-detail-dialog';
import { t } from '@/lib/i18n';
import { useDateRange } from '../analytics-dashboard';
import EmptyState from './empty-state';
import { TRAINING_TASKS } from '@/lib/training-tasks';

interface StudentPerformanceCard {
  user_id: string;
  name: string;
  email: string;
  created_at: number;
  last_active: number | null;
  tasks_completed: number;
  total_attempts: number;
  avg_attempts: number;
  beginner_completed: number;
  intermediate_completed: number;
  advanced_completed: number;
  achievements_count: number;
  completion_rate: number;
  performance_trend: 'improving' | 'stable' | 'declining';
  streak: number;
  weakest_difficulty: string;
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'improving') return <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
  if (trend === 'declining') return <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />;
  return <Minus className="h-4 w-4 text-gray-400 dark:text-gray-300" />;
}

export default function StudentPerformanceCards() {
  const [data, setData] = useState<StudentPerformanceCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { startDate, endDate } = useDateRange();

  useEffect(() => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', String(startDate));
    if (endDate) params.set('endDate', String(endDate));

    fetch(`/api/admin/analytics/students?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load');
        return r.json();
      })
      .then((data) => setData(data.students))
      .catch(() => setError(t('analytics.error')))
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  const handleViewDetails = (userId: string) => {
    setSelectedStudentId(userId);
    setDialogOpen(true);
  };

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

  const difficultyLabels: Record<string, string> = {
    beginner: t('analytics.student.beginner'),
    intermediate: t('analytics.student.intermediate'),
    advanced: t('analytics.student.advanced'),
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('analytics.students.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('analytics.leaderboard.name')}</TableHead>
                  <TableHead className="text-right">{t('analytics.leaderboard.completed')}</TableHead>
                  <TableHead className="text-right">{t('analytics.leaderboard.avgAttempts')}</TableHead>
                  <TableHead className="text-center">{t('analytics.students.trend')}</TableHead>
                  <TableHead className="text-center">{t('analytics.students.streak')}</TableHead>
                  <TableHead>{t('analytics.students.weakest')}</TableHead>
                  <TableHead>{t('analytics.leaderboard.completionRate')}</TableHead>
                  <TableHead className="text-right">{t('analytics.students.viewDetails')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((student) => (
                  <TableRow key={student.user_id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{student.name}</div>
                        <div className="text-xs text-muted-foreground">{student.email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">
                        {student.tasks_completed}/{TRAINING_TASKS.length}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{Math.round(student.avg_attempts * 10) / 10}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <TrendIcon trend={student.performance_trend} />
                        <span className="text-xs">{t(`analytics.students.trend.${student.performance_trend}`)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {student.streak > 0 ? (
                        <div className="flex items-center justify-center gap-1">
                          <Target className="h-4 w-4 text-orange-500" />
                          <span className="font-medium text-sm">{student.streak}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          student.weakest_difficulty === 'beginner'
                            ? 'border-emerald-500 text-emerald-600'
                            : student.weakest_difficulty === 'intermediate'
                              ? 'border-amber-500 text-amber-600'
                              : 'border-red-500 text-red-600'
                        }
                      >
                        {difficultyLabels[student.weakest_difficulty]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Progress value={student.completion_rate} className="h-2" />
                        <p className="text-xs text-muted-foreground text-right">{student.completion_rate}%</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={() => handleViewDetails(student.user_id)}
                        className="text-sm text-primary hover:underline"
                      >
                        {t('analytics.students.viewDetails')}
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <StudentDetailDialog studentId={selectedStudentId} open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
