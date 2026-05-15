'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  TRAINING_TASKS,
  DIFFICULTY_LABELS,
  DIFFICULTY_COLORS,
  type Difficulty,
} from '@/lib/training-tasks';
import { useSQLTrainerStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import { plural } from '@/lib/utils';
import {
  Trophy,
  Target,
  GraduationCap,
  Play,
  Rocket,
  Keyboard,
  Sparkles,
  CheckCircle2,
  BookOpen,
  Flame,
  Calendar,
  Award,
} from 'lucide-react';
import PracticeModeDialog from '@/components/practice-mode-dialog';

interface WelcomePanelProps {
  onStartTraining: () => void;
  onFreeMode: () => void;
}

export default function WelcomePanel({ onStartTraining, onFreeMode }: WelcomePanelProps) {
  const { completedTasks, setCurrentTaskId, streak } = useSQLTrainerStore();

  const completedCount = completedTasks.length;
  const totalCount = TRAINING_TASKS.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const statsByDifficulty = useMemo(() => {
    const difficulties: Difficulty[] = ['beginner', 'intermediate', 'advanced'];
    return difficulties.map((d) => {
      const total = TRAINING_TASKS.filter((t) => t.difficulty === d).length;
      const completed = completedTasks.filter((ct) => {
        const task = TRAINING_TASKS.find((t) => t.id === ct.taskId);
        return task && task.difficulty === d;
      }).length;
      return { difficulty: d, total, completed };
    });
  }, [completedTasks]);

  const lastCompleted = useMemo(() => {
    return [...completedTasks]
      .sort((a, b) => b.completedAt - a.completedAt)
      .slice(0, 3)
      .map((ct) => {
        const task = TRAINING_TASKS.find((t) => t.id === ct.taskId);
        return task ? { ...task, completedAt: ct.completedAt } : null;
      })
      .filter(Boolean);
  }, [completedTasks]);

  const firstIncompleteTask = useMemo(() => {
    return TRAINING_TASKS.find((t) => !completedTasks.some((ct) => ct.taskId === t.id));
  }, [completedTasks]);

  // Recommended task based on skill progression
  const recommendedTask = useMemo(() => {
    // Find the highest difficulty level the user has completed at least one task
    const completedDifficulties = new Set(
      completedTasks
        .map((ct) => TRAINING_TASKS.find((t) => t.id === ct.taskId)?.difficulty)
        .filter(Boolean)
    );

    // If user has completed advanced tasks, recommend intermediate/advanced
    // If user has completed intermediate, recommend more intermediate or start advanced
    // If user is beginner or hasn't started, recommend beginner
    
    let targetDifficulty: Difficulty | null = 'beginner';
    if (completedDifficulties.has('advanced')) {
      targetDifficulty = 'advanced';
    } else if (completedDifficulties.has('intermediate')) {
      // Check if they've done most intermediate tasks
      const intermediateCompleted = completedTasks.filter(
        (ct) => TRAINING_TASKS.find((t) => t.id === ct.taskId)?.difficulty === 'intermediate'
      ).length;
      const intermediateTotal = TRAINING_TASKS.filter((t) => t.difficulty === 'intermediate').length;
      targetDifficulty = intermediateCompleted >= intermediateTotal * 0.5 ? 'advanced' : 'intermediate';
    } else if (completedDifficulties.has('beginner')) {
      const beginnerCompleted = completedTasks.filter(
        (ct) => TRAINING_TASKS.find((t) => t.id === ct.taskId)?.difficulty === 'beginner'
      ).length;
      const beginnerTotal = TRAINING_TASKS.filter((t) => t.difficulty === 'beginner').length;
      targetDifficulty = beginnerCompleted >= beginnerTotal * 0.5 ? 'intermediate' : 'beginner';
    }

    // Find first incomplete task at target difficulty
    return TRAINING_TASKS.find(
      (t) => t.difficulty === targetDifficulty && !completedTasks.some((ct) => ct.taskId === t.id)
    ) || firstIncompleteTask;
  }, [completedTasks, firstIncompleteTask]);

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      {/* Welcome header */}
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/30">
          <BookOpen className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="text-lg font-bold">
          {t('app.title')}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {t('app.subtitle')}
        </p>
      </div>

      {/* Progress overview */}
      <Card>
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium">{t('welcome.progressLabel')}</span>
            </div>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {completedCount}/{totalCount}
            </span>
          </div>
          <Progress value={progressPercent} className="h-3" />
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {progressPercent === 100
              ? t('progress.complete')
              : `${Math.round(progressPercent)}% ${t('progress.percent')}`}
          </p>
        </CardContent>
      </Card>

      {/* Stats by difficulty */}
      <div className="grid grid-cols-3 gap-2">
        {statsByDifficulty.map((stat) => (
          <Card key={stat.difficulty} className="overflow-hidden">
            <CardContent className="p-3 text-center">
              <Badge className={`${DIFFICULTY_COLORS[stat.difficulty]} mb-1.5 text-[10px]`}>
                {DIFFICULTY_LABELS[stat.difficulty]}
              </Badge>
              <p className="text-lg font-bold">{stat.completed}/{stat.total}</p>
              <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{
                    width: stat.total > 0 ? `${(stat.completed / stat.total) * 100}%` : '0%',
                  }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Streak display */}
      {streak.currentStreak > 0 && (
        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:border-amber-800 dark:from-amber-950/30 dark:to-orange-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
                <Flame className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-amber-700 dark:text-amber-400">
                    {streak.currentStreak} {plural(streak.currentStreak, 'день', 'дня', 'дней')}
                  </span>
                  <span className="text-xs text-amber-600/70 dark:text-amber-500/70">
                    серия
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-amber-600/60 dark:text-amber-500/60">
                  <div className="flex items-center gap-1">
                    <Award className="h-3 w-3" />
                    Рекорд: {streak.longestStreak} {plural(streak.longestStreak, 'день', 'дня', 'дней')}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Всего: {streak.totalPracticeDays} {plural(streak.totalPracticeDays, 'день', 'дня', 'дней')}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommended task card */}
      {recommendedTask && (
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 dark:border-emerald-800 dark:from-emerald-950/30 dark:to-teal-950/20">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                {t('welcome.recommend')}
              </span>
            </div>
            <button
              onClick={() => setCurrentTaskId(recommendedTask.id)}
              className="w-full text-left"
            >
              <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                {recommendedTask.title}
              </p>
              <p className="mt-1 text-xs text-emerald-700/70 dark:text-emerald-400/70 line-clamp-2">
                {recommendedTask.description}
              </p>
            </button>
            <Badge className={`${DIFFICULTY_COLORS[recommendedTask.difficulty]} mt-2 text-[10px]`}>
              {DIFFICULTY_LABELS[recommendedTask.difficulty]}
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Quick start buttons */}
      <div className="flex flex-col gap-2">
        <Button
          className="w-full bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
          onClick={() => {
            if (recommendedTask) {
              setCurrentTaskId(recommendedTask.id);
            } else if (firstIncompleteTask) {
              setCurrentTaskId(firstIncompleteTask.id);
            } else {
              onStartTraining();
            }
          }}
        >
          <Rocket className="mr-2 h-4 w-4" />
          {t('welcome.startTraining')}
        </Button>
        <Button variant="outline" className="w-full" onClick={onFreeMode}>
          <GraduationCap className="mr-2 h-4 w-4" />
          {t('action.freeMode')}
        </Button>
        <PracticeModeDialog />
      </div>

      {/* Last completed */}
      {lastCompleted.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5 text-amber-500" />
            {t('welcome.recent')}
          </h4>
          <div className="space-y-1.5">
            {lastCompleted.map((task) => {
              if (!task) return null;
              return (
                <button
                  key={task.id}
                  onClick={() => setCurrentTaskId(task.id)}
                  className="flex w-full items-center gap-2 rounded-md border border-border px-3 py-2 text-left text-xs transition-colors hover:bg-muted/50"
                  aria-label={`Перейти к заданию: ${task.title}`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{task.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(task.completedAt).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-[10px] px-1.5 shrink-0">
                    {DIFFICULTY_LABELS[task.difficulty]}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tips */}
      <div>
        <h4 className="mb-2 text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <Keyboard className="h-3.5 w-3.5" />
          {t('welcome.tips')}
        </h4>
        <Card className="bg-muted/30">
          <CardContent className="p-3 space-y-1.5">
            <div className="flex items-start gap-2 text-xs">
              <kbd className="shrink-0 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]">
                Ctrl+↵
              </kbd>
              <span className="text-muted-foreground">Выполнить запрос</span>
            </div>
            <div className="flex items-start gap-2 text-xs">
              <kbd className="shrink-0 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]">
                Ctrl+L
              </kbd>
              <span className="text-muted-foreground">Очистить редактор</span>
            </div>
            <div className="flex items-start gap-2 text-xs">
              <kbd className="shrink-0 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]">
                Tab
              </kbd>
              <span className="text-muted-foreground">Отступ в редакторе</span>
            </div>
            <div className="flex items-start gap-2 text-xs">
              <Sparkles className="h-3 w-3 shrink-0 mt-0.5 text-amber-500" />
              <span className="text-muted-foreground">
                Используйте подсказки и справочник SQL для помощи
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
