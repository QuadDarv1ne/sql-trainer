'use client';

import { useSQLTrainerStore } from '@/lib/store';
import { TRAINING_TASKS, DIFFICULTY_LABELS, DIFFICULTY_COLORS, type Difficulty } from '@/lib/training-tasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, Zap, Award, Calendar, Flame, Star, Brain } from 'lucide-react';
import { t } from '@/lib/i18n';
import { plural } from '@/lib/utils';

export default function ProgressStats() {
  const {
    completedTasks,
    streak,
    userStats,
    unlockedAchievements,
    queryHistory,
  } = useSQLTrainerStore();

  const totalTasks = TRAINING_TASKS.length;
  const completedCount = completedTasks.length;
  const progressPercent = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;
  const totalAttempts = completedTasks.reduce((sum, p) => sum + p.attempts, 0);
  const avgAttempts = completedCount > 0 ? (totalAttempts / completedCount).toFixed(1) : '0';

  // Best result (fewest attempts)
  const bestResult = completedCount > 0
    ? Math.min(...completedTasks.map((p) => p.attempts))
    : null;

  // Stats by difficulty
  const difficulties: Difficulty[] = ['beginner', 'intermediate', 'advanced'];
  const statsByDifficulty = difficulties.map((d) => {
    const total = TRAINING_TASKS.filter((t) => t.difficulty === d).length;
    const completed = completedTasks.filter((ct) => {
      const task = TRAINING_TASKS.find((t) => t.id === ct.taskId);
      return task && task.difficulty === d;
    }).length;
    return { difficulty: d, total, completed };
  });

  return (
    <div className="space-y-4">
      {/* User stats: XP and Level */}
      <Card className="border-emerald-200 dark:border-emerald-900/50 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/10">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-xl font-bold text-white">
              {userStats.level}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Уровень {userStats.level}</h3>
                <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                  {userStats.xp} XP
                </span>
              </div>
              <Progress value={userStats.levelProgress} className="mt-2 h-2" />
              <p className="mt-1 text-xs text-muted-foreground">
                {userStats.levelProgress}% до уровня {userStats.level + 1}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Target className="h-8 w-8 text-emerald-500" />
            <div>
              <p className="text-2xl font-bold">{completedCount}/{totalTasks}</p>
              <p className="text-xs text-muted-foreground">Заданий выполнено</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Zap className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-2xl font-bold">{avgAttempts}</p>
              <p className="text-xs text-muted-foreground">Среднее попыток</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Trophy className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold">{bestResult ?? '—'}</p>
              <p className="text-xs text-muted-foreground">Лучший результат</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Star className="h-8 w-8 text-sky-500" />
            <div>
              <p className="text-2xl font-bold">{unlockedAchievements.length}</p>
              <p className="text-xs text-muted-foreground">Достижений</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Streak stats */}
      {streak.currentStreak > 0 && (
        <Card className="border-amber-200 dark:border-amber-900/50">
          <CardContent className="p-4 flex items-center gap-3">
            <Flame className="h-8 w-8 text-amber-500" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">
                  {streak.currentStreak} {plural(streak.currentStreak, t('welcome.streak.day'), t('welcome.streak.days'), t('welcome.streak.daysMany'))}
                </span>
                <span className="text-xs text-amber-600/70">{t('welcome.streak.label')}</span>
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>
                  <Award className="inline h-3 w-3 mr-1" />
                  {t('welcome.streak.record')}: {streak.longestStreak}
                </span>
                <span>
                  <Calendar className="inline h-3 w-3 mr-1" />
                  {t('welcome.streak.total')}: {streak.totalPracticeDays}
                </span>
                <span>
                  <Brain className="inline h-3 w-3 mr-1" />
                  Запросов: {queryHistory.length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overall progress */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t('welcome.progressLabel')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={progressPercent} className="h-3" />
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {progressPercent === 100
              ? t('progress.complete')
              : `${Math.round(progressPercent)}% ${t('progress.percent')}`}
          </p>
        </CardContent>
      </Card>

      {/* Progress by difficulty */}
      <div className="grid gap-3 sm:grid-cols-3">
        {statsByDifficulty.map(({ difficulty, total, completed }) => {
          const pct = total > 0 ? (completed / total) * 100 : 0;
          return (
            <Card key={difficulty}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <Badge className={`text-[10px] px-1.5 ${DIFFICULTY_COLORS[difficulty]}`}>
                    {DIFFICULTY_LABELS[difficulty]}
                  </Badge>
                  <span className="text-muted-foreground">{Math.round(pct)}%</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={pct} className="h-1.5" />
                <p className="mt-1 text-xs text-muted-foreground">{completed}/{total} заданий</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
