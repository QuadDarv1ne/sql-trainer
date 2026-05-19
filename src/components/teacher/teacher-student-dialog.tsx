'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Award,
  Clock,
  Mail,
  Target,
  RotateCcw,
  TrendingUp,
  AlertCircle,
  Download,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { t, getLocale } from '@/lib/i18n';
import { generateStudentReportPDF } from '@/lib/pdf-report';

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
  completion_rate: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned_at: number;
}

interface ActivityEntry {
  date: string;
  completions: number;
}

interface StudentDetailData {
  student: StudentDetail;
  achievements: Achievement[];
  activity: ActivityEntry[];
}

interface TeacherStudentDialogProps {
  studentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TeacherStudentDialog({
  studentId,
  open,
  onOpenChange,
}: TeacherStudentDialogProps) {
  const [data, setData] = useState<StudentDetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !studentId) return;

    setLoading(true);
    setError('');
    setData(null);

    Promise.all([
      fetch(`/api/teacher/student/${studentId}`).then(r => r.json()),
      fetch(`/api/teacher/student/${studentId}/activity`).then(r => r.json()),
    ])
      .then(([detailRes, activityRes]) => {
        if (detailRes.error) throw new Error(detailRes.error);
        setData({
          student: detailRes.student,
          achievements: detailRes.achievements || [],
          activity: activityRes.activity || [],
        });
      })
      .catch(() => setError(t('teacher.error')))
      .finally(() => setLoading(false));
  }, [studentId, open]);

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
        title: t('teacher.export.studentReport'),
        subtitle: `${student.name} — ${student.email}`,
        generatedAt: new Date(),
        locale: getLocale(),
      }
    );
  };

  if (!studentId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {data
                ? t('teacher.student.detailTitle', { name: data.student.name })
                : t('teacher.loading')}
            </DialogTitle>
            {data && (
              <Button variant="outline" size="sm" onClick={handleExportPDF}>
                <Download className="h-4 w-4 mr-1" />
                PDF
              </Button>
            )}
          </div>
        </DialogHeader>

        {loading && <p className="text-center py-4">{t('teacher.loading')}</p>}

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
                    <p className="text-xs text-muted-foreground">{t('teacher.progress.completed')}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 flex items-center gap-2">
                  <RotateCcw className="h-6 w-6 text-amber-600" />
                  <div>
                    <p className="text-lg font-bold">{data.student.total_attempts}</p>
                    <p className="text-xs text-muted-foreground">{t('teacher.progress.avgAttempts')}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                  <div>
                    <p className="text-lg font-bold">{data.student.completion_rate}%</p>
                    <p className="text-xs text-muted-foreground">{t('teacher.progress.completionRate')}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 flex items-center gap-2">
                  <Clock className="h-6 w-6 text-purple-600" />
                  <div>
                    <p className="text-sm font-bold">
                      {data.student.last_active
                        ? new Date(data.student.last_active).toLocaleDateString()
                        : t('teacher.progress.neverActive')}
                    </p>
                    <p className="text-xs text-muted-foreground">{t('teacher.progress.lastActive')}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Activity chart */}
            {data.activity.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('teacher.student.activityChart')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={data.activity}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="completions"
                        name={t('teacher.progress.completed')}
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* By difficulty */}
            <div>
              <h3 className="text-sm font-medium mb-2">{t('analytics.student.byDifficulty')}</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <Card>
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="border-emerald-500 text-emerald-600">
                        {t('difficulty.beginner')}
                      </Badge>
                      <span className="text-lg font-bold">
                        {data.student.beginner_completed}
                      </span>
                    </div>
                    <Progress
                      value={(data.student.beginner_completed / 8) * 100}
                      className="h-2"
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="border-amber-500 text-amber-600">
                        {t('difficulty.intermediate')}
                      </Badge>
                      <span className="text-lg font-bold">
                        {data.student.intermediate_completed}
                      </span>
                    </div>
                    <Progress
                      value={(data.student.intermediate_completed / 15) * 100}
                      className="h-2"
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="border-red-500 text-red-600">
                        {t('difficulty.advanced')}
                      </Badge>
                      <span className="text-lg font-bold">
                        {data.student.advanced_completed}
                      </span>
                    </div>
                    <Progress
                      value={(data.student.advanced_completed / 25) * 100}
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
                <p className="text-sm text-muted-foreground">
                  {t('analytics.student.noAchievements')}
                </p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {data.achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="flex items-start gap-2 p-2 rounded border"
                    >
                      <Award className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{achievement.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(achievement.earned_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
