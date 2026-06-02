'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { t } from '@/lib/i18n';
import {
  BookOpen, Target, Zap, Trophy, Flame, Clock,
  ArrowRight, Lightbulb, AlertCircle, Loader2, Calendar,
  GraduationCap, TrendingUp, Star,
} from 'lucide-react';
import { TRAINING_TASKS, DIFFICULTY_LABELS, DIFFICULTY_COLORS, type Difficulty } from '@/lib/training-tasks';
import { plural } from '@/lib/utils';
import RoleBadge from '@/components/auth/role-badge';
import type { Role } from '@/lib/rbac';
import Link from 'next/link';
import { useSQLTrainerStore } from '@/lib/store';

interface StudentStats {
  completedTasks: Array<{ taskId: string; attempts: number; completedAt: number }>;
  streak: { currentStreak: number; longestStreak: number; totalPracticeDays: number };
  userStats: { level: number; xp: number; levelProgress: number };
  unlockedAchievements: Array<{ id: string; title: string; unlockedAt: number | null }>;
}

interface Recommendation {
  type: string;
  task_id?: string;
  title?: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

interface Reminder {
  id: string;
  message: string;
  due_at: number;
  type: string;
}

const priorityColors = {
  high: 'border-l-red-500 bg-red-50 dark:bg-red-950/20',
  medium: 'border-l-amber-500 bg-amber-50 dark:bg-amber-950/20',
  low: 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20',
};

const priorityLabels: Record<string, string> = {
  high: 'Высокий',
  medium: 'Средний',
  low: 'Низкий',
};

export default function StudentDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [progressRes, recsRes, remindersRes] = await Promise.all([
        fetch('/api/user/progress'),
        fetch('/api/user/recommendations'),
        fetch('/api/user/reminders'),
      ]);

      if (!progressRes.ok || !recsRes.ok || !remindersRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [progressData, recsData, remindersData] = await Promise.all([
        progressRes.json(),
        recsRes.json(),
        remindersRes.json(),
      ]);

      if (progressData.success) {
        setStats({
          completedTasks: progressData.progress || [],
          streak: progressData.streak || { currentStreak: 0, longestStreak: 0, totalPracticeDays: 0 },
          userStats: progressData.userStats || { level: 1, xp: 0, levelProgress: 0 },
          unlockedAchievements: progressData.unlockedAchievements || [],
        });
      }

      if (recsData.success) {
        setRecommendations(recsData.recommendations || []);
      }

      if (remindersData.success) {
        setReminders(remindersData.reminders || []);
      }
    } catch {
      setError(t('dashboard.loadError', { default: 'Не удалось загрузить данные' }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    const userRole = (session?.user as { role?: Role })?.role;
    if (userRole && userRole !== 'student') {
      router.push('/app');
      return;
    }
    fetchData();
  }, [session, status, router, fetchData]);

  const handleStartTask = (taskId: string) => {
    // Set current task via store and navigate to SQL editor
    const { setCurrentTaskId } = useSQLTrainerStore.getState();
    setCurrentTaskId(taskId);
    router.push('/app');
  };

  const handleContinueLearning = () => {
    if (!stats) return;
    const completedIds = new Set(stats.completedTasks.map(p => p.taskId));
    const nextTask = TRAINING_TASKS.find(t => !completedIds.has(t.id));
    if (nextTask) {
      handleStartTask(nextTask.id);
    } else {
      router.push('/app');
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex h-full items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || t('dashboard.error')}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const completedCount = stats.completedTasks.length;
  const totalTasks = TRAINING_TASKS.length;
  const progressPercent = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;
  const totalAttempts = stats.completedTasks.reduce((sum, p) => sum + p.attempts, 0);
  const avgAttempts = completedCount > 0 ? (totalAttempts / completedCount).toFixed(1) : '0';

  // Find next incomplete task
  const completedIds = new Set(stats.completedTasks.map(p => p.taskId));
  const nextTask = TRAINING_TASKS.find(t => !completedIds.has(t.id));

  // Stats by difficulty
  const difficulties: Difficulty[] = ['beginner', 'intermediate', 'advanced'];
  const statsByDifficulty = difficulties.map(d => {
    const total = TRAINING_TASKS.filter(t => t.difficulty === d).length;
    const completed = stats.completedTasks.filter(ct => {
      const task = TRAINING_TASKS.find(t => t.id === ct.taskId);
      return task && task.difficulty === d;
    }).length;
    return { difficulty: d, total, completed };
  });

  // Active reminders (not overdue)
  const activeReminders = reminders.filter(r => r.due_at > Date.now()).slice(0, 3);

  return (
    <div className="h-full overflow-auto bg-gradient-to-b from-background to-muted/20">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t('dashboard.welcome', { default: 'Добро пожаловать' })}, {session?.user?.name}!
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t('dashboard.subtitle', { default: 'Ваш прогресс и рекомендации по обучению' })}
            </p>
          </div>
          <RoleBadge role={(session?.user as { role?: Role })?.role || 'student'} />
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Continue Learning Card */}
          <Card className="border-emerald-200 dark:border-emerald-900/50 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/10 sm:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-emerald-600" />
                {nextTask ? t('dashboard.continue', { default: 'Продолжить обучение' }) : t('dashboard.completed', { default: 'Все задачи выполнены!' })}
              </CardTitle>
              <CardDescription>
                {nextTask
                  ? t('dashboard.nextTask', { default: 'Следующая задача' }) + `: ${nextTask.title}`
                  : t('dashboard.allDone', { default: 'Вы完成了 все задачи! Перейдите в редактор для практики.' })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Progress value={progressPercent} className="h-3" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {completedCount} / {totalTasks} {t('dashboard.tasksDone', { default: 'задач выполнено' })}
                  </span>
                  <span className="font-medium text-emerald-600">{Math.round(progressPercent)}%</span>
                </div>
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleContinueLearning}
                >
                  {nextTask ? (
                    <>
                      <ArrowRight className="mr-2 h-4 w-4" />
                      {t('dashboard.startTask', { default: 'Начать задачу' })}
                    </>
                  ) : (
                    <>
                      <Trophy className="mr-2 h-4 w-4" />
                      {t('dashboard.practice', { default: 'Перейти к практике' })}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Streak Card */}
          <Card className="border-amber-200 dark:border-amber-900/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Flame className="h-5 w-5 text-amber-600" />
                {t('dashboard.streak', { default: 'Серия' })}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-center">
                <p className="text-4xl font-bold text-amber-600">{stats.streak.currentStreak}</p>
                <p className="text-xs text-muted-foreground">
                  {plural(stats.streak.currentStreak, t('dashboard.streakDay', { default: 'день подряд' }), t('dashboard.streakDaysFew', { default: 'дня подряд' }), t('dashboard.streakDaysMany', { default: 'дней подряд' }))}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="rounded bg-muted/50 p-2">
                  <p className="font-bold">{stats.streak.longestStreak}</p>
                  <p className="text-muted-foreground">{t('dashboard.bestStreak', { default: 'Рекорд' })}</p>
                </div>
                <div className="rounded bg-muted/50 p-2">
                  <p className="font-bold">{stats.streak.totalPracticeDays}</p>
                  <p className="text-muted-foreground">{t('dashboard.totalDays', { default: 'Всего дней' })}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Target className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold">{completedCount}/{totalTasks}</p>
                <p className="text-xs text-muted-foreground">{t('progress.tasksCompleted')}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Zap className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{avgAttempts}</p>
                <p className="text-xs text-muted-foreground">{t('progress.avgAttempts')}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Trophy className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.unlockedAchievements.length}</p>
                <p className="text-xs text-muted-foreground">{t('progress.achievements')}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Star className="h-8 w-8 text-sky-500" />
              <div>
                <p className="text-2xl font-bold">{stats.userStats.level}</p>
                <p className="text-xs text-muted-foreground">{t('dashboard.level', { default: 'Уровень' })} ({stats.userStats.xp} XP)</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress by Difficulty */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              {t('dashboard.byDifficulty', { default: 'Прогресс по сложности' })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              {statsByDifficulty.map(({ difficulty, total, completed }) => {
                const pct = total > 0 ? (completed / total) * 100 : 0;
                return (
                  <div key={difficulty} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge className={`text-xs ${DIFFICULTY_COLORS[difficulty]}`}>
                        {DIFFICULTY_LABELS[difficulty]}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{completed}/{total}</span>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recommendations & Reminders */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-600" />
                {t('dashboard.recommendations', { default: 'Рекомендации' })}
                {recommendations.length > 0 && (
                  <Badge variant="secondary" className="ml-auto">{recommendations.length}</Badge>
                )}
              </CardTitle>
              <CardDescription>{t('dashboard.recDesc', { default: 'Персонализированные рекомендации по обучению' })}</CardDescription>
            </CardHeader>
            <CardContent>
              {recommendations.length === 0 ? (
                <p className="text-center py-6 text-sm text-muted-foreground">
                  {t('dashboard.noRecs', { default: 'Выполните несколько задач для получения рекомендаций' })}
                </p>
              ) : (
                <div className="space-y-3">
                  {recommendations.slice(0, 5).map((rec, i) => (
                    <div key={i} className={`p-3 border-l-4 rounded ${priorityColors[rec.priority]}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {rec.task_id && (
                              <Badge variant="outline">{rec.task_id}</Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {priorityLabels[rec.priority]}
                            </Badge>
                          </div>
                          <p className="text-sm">{rec.description}</p>
                        </div>
                        {rec.task_id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="shrink-0"
                            onClick={() => { if (rec.task_id) handleStartTask(rec.task_id); }}
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reminders / Deadlines */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                {t('dashboard.reminders', { default: 'Напоминания' })}
                {activeReminders.length > 0 && (
                  <Badge variant="secondary" className="ml-auto">{activeReminders.length}</Badge>
                )}
              </CardTitle>
              <CardDescription>{t('dashboard.remDesc', { default: 'Предстоящие дедлайны и напоминания' })}</CardDescription>
            </CardHeader>
            <CardContent>
              {activeReminders.length === 0 ? (
                <p className="text-center py-6 text-sm text-muted-foreground">
                  {t('dashboard.noReminders', { default: 'Нет предстоящих напоминаний' })}
                </p>
              ) : (
                <div className="space-y-3">
                  {activeReminders.map(reminder => {
                    const daysLeft = Math.ceil((reminder.due_at - Date.now()) / (24 * 60 * 60 * 1000));
                    const urgency = daysLeft <= 1 ? 'high' : daysLeft <= 3 ? 'medium' : 'low';
                    return (
                      <div key={reminder.id} className={`p-3 border-l-4 rounded ${priorityColors[urgency]}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{reminder.message}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {daysLeft <= 0
                                ? t('dashboard.overdue', { default: 'Просрочено' })
                                : daysLeft === 1
                                  ? t('dashboard.tomorrow', { default: 'Завтра' })
                                  : t('dashboard.daysLeft', { default: `Осталось ${daysLeft} дн.` })}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Link href="/app" className="block">
            <Card className="hover:border-emerald-300 dark:hover:border-emerald-800 transition-colors cursor-pointer h-full">
              <CardContent className="p-4 flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-emerald-600" />
                <div>
                  <p className="font-medium">{t('dashboard.sqlEditor', { default: 'SQL Редактор' })}</p>
                  <p className="text-xs text-muted-foreground">{t('dashboard.sqlEditorDesc', { default: 'Практика SQL-запросов' })}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/profile" className="block">
            <Card className="hover:border-blue-300 dark:hover:border-blue-800 transition-colors cursor-pointer h-full">
              <CardContent className="p-4 flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="font-medium">{t('dashboard.profile', { default: 'Профиль' })}</p>
                  <p className="text-xs text-muted-foreground">{t('dashboard.profileDesc', { default: 'Достижения и статистика' })}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/profile#achievements" className="block">
            <Card className="hover:border-purple-300 dark:hover:border-purple-800 transition-colors cursor-pointer h-full">
              <CardContent className="p-4 flex items-center gap-3">
                <Trophy className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="font-medium">{t('dashboard.achievements', { default: 'Достижения' })}</p>
                  <p className="text-xs text-muted-foreground">{t('dashboard.achievementsDesc', { default: `${stats.unlockedAchievements.length} получено` })}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
