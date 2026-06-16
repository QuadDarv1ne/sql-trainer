'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Award, Clock, Flame, Mail, Target, RotateCcw, TrendingUp, AlertCircle, Download } from 'lucide-react';
import { t, getLocale } from '@/lib/i18n';
import { TRAINING_TASKS } from '@/lib/training-tasks';
import { generateStudentReportPDF } from '@/lib/pdf-report';
import LearningPathTimeline from './learning-path-timeline';

interface StudentDetail {
  user_id: string;
  name: string;
  email: string;
  role: string;
  created_at: number;
  tasks_completed: number;
  total_attempts: number;
  avg_attempts: number;
  beginner_completed: number;
  intermediate_completed: number;
  advanced_completed: number;
  achievements_count: number;
  last_active: number | null;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned_at: number;
}

interface StudentDetailData {
  student: StudentDetail;
  achievements: Achievement[];
}

interface StudentDetailDialogProps {
  studentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function StudentDetailDialog({ studentId, open, onOpenChange }: StudentDetailDialogProps) {
  const [data, setData] = useState<StudentDetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [streak, setStreak] = useState<number>(0);

  const difficultyTotals = useMemo(
    () => ({
      beginner: TRAINING_TASKS.filter((t) => t.difficulty === 'beginner').length,
      intermediate: TRAINING_TASKS.filter((t) => t.difficulty === 'intermediate').length,
      advanced: TRAINING_TASKS.filter((t) => t.difficulty === 'advanced').length,
    }),
    [],
  );

  useEffect(() => {
    if (!open || !studentId) return;

    setLoading(true);
    setError('');
    setData(null);

    fetch(`/api/admin/analytics/student/${studentId}`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load');
        return r.json();
      })
      .then((data) => setData(data))
      .catch(() => setError(t('analytics.error')))
      .finally(() => setLoading(false));
  }, [studentId, open]);

  useEffect(() => {
    if (!data?.student) return;

    fetch(`/api/admin/analytics/student/${data.student.user_id}/streak`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => setStreak(data.streak || 0))
      .catch(() => setStreak(0));
  }, [data?.student]);

  const handleExportPDF = () => {
    if (!data) return;
    const { student } = data;
    generateStudentReportPDF(
      {
        name: student.name,
        email: student.email,
        tasks_completed: student.tasks_completed,
        avg_attempts: student.avg_attempts,
        beginner_completed: student.beginner_completed,
        intermediate_completed: student.intermediate_completed,
        advanced_completed: student.advanced_completed,
        achievements_count: student.achievements_count,
        last_active: student.last_active,
      },
      {
        title: t('analytics.pdf.studentReport'),
        subtitle: `${student.name} — ${student.email}`,
        generatedAt: new Date(),
        locale: getLocale(),
      },
    );
  };

  if (!studentId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {data ? t('analytics.student.detailTitle', { name: data.student.name }) : t('analytics.loading')}
            </DialogTitle>
            {data && (
              <Button variant="outline" size="sm" onClick={handleExportPDF}>
                <Download className="h-4 w-4 mr-1" />
                {t('analytics.pdf.download')}
              </Button>
            )}
          </div>
        </DialogHeader>

        {loading && <p className="text-center py-4">{t('analytics.loading')}</p>}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {data && !loading && (
          <div className="space-y-4">
            {/* Basic info */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>{data.student.email}</span>
            </div>

            {/* Stats grid */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-3 flex items-center gap-2">
                  <Target className="h-6 w-6 text-emerald-600" />
                  <div>
                    <p className="text-lg font-bold">{data.student.tasks_completed}</p>
                    <p className="text-xs text-muted-foreground">{t('analytics.student.completed')}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 flex items-center gap-2">
                  <RotateCcw className="h-6 w-6 text-amber-600" />
                  <div>
                    <p className="text-lg font-bold">{data.student.total_attempts}</p>
                    <p className="text-xs text-muted-foreground">{t('analytics.student.totalAttempts')}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                  <div>
                    <p className="text-lg font-bold">{Math.round(data.student.avg_attempts * 10) / 10}</p>
                    <p className="text-xs text-muted-foreground">{t('analytics.student.avgAttempts')}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 flex items-center gap-2">
                  <Clock className="h-6 w-6 text-purple-600" />
                  <div>
                    <p className="text-sm font-bold">
                      {data.student.last_active
                        ? new Date(data.student.last_active).toLocaleDateString(undefined)
                        : t('analytics.student.neverActive')}
                    </p>
                    <p className="text-xs text-muted-foreground">{t('analytics.student.lastActive')}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Streak */}
            <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
              <Flame className="h-5 w-5 text-orange-500" />
              <div>
                <div className="text-lg font-bold text-orange-600">{streak}</div>
                <div className="text-xs text-muted-foreground">{t('analytics.students.streak')}</div>
              </div>
            </div>

            {/* By difficulty */}
            <div>
              <h3 className="text-sm font-medium mb-2">{t('analytics.student.byDifficulty')}</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <Card>
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="border-emerald-500 text-emerald-600">
                        {t('analytics.student.beginner')}
                      </Badge>
                      <span className="text-lg font-bold">{data.student.beginner_completed}</span>
                    </div>
                    <Progress
                      value={Math.min((data.student.beginner_completed / difficultyTotals.beginner) * 100, 100)}
                      className="h-2"
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="border-amber-500 text-amber-600">
                        {t('analytics.student.intermediate')}
                      </Badge>
                      <span className="text-lg font-bold">{data.student.intermediate_completed}</span>
                    </div>
                    <Progress
                      value={Math.min((data.student.intermediate_completed / difficultyTotals.intermediate) * 100, 100)}
                      className="h-2"
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="border-red-500 text-red-600">
                        {t('analytics.student.advanced')}
                      </Badge>
                      <span className="text-lg font-bold">{data.student.advanced_completed}</span>
                    </div>
                    <Progress
                      value={Math.min((data.student.advanced_completed / difficultyTotals.advanced) * 100, 100)}
                      className="h-2"
                    />
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Achievements */}
            <div>
              <h3 className="text-sm font-medium mb-2">
                {t('analytics.student.achievements')} ({data.achievements.length})
              </h3>
              {data.achievements.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('analytics.student.noAchievements')}</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {data.achievements.map((achievement) => (
                    <div key={achievement.id} className="flex items-start gap-2 p-2 rounded border">
                      <Award className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{achievement.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(achievement.earned_at).toLocaleDateString(undefined)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Learning Timeline */}
            <LearningPathTimeline userId={studentId} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
