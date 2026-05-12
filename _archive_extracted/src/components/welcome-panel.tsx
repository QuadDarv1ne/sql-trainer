'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  TRAINING_TASKS,
  DIFFICULTY_LABELS,
  DIFFICULTY_COLORS,
  type Difficulty,
} from '@/lib/training-tasks';
import { useSQLTrainerStore } from '@/lib/store';
import {
  GraduationCap,
  BarChart3,
  Clock,
  Target,
  Zap,
  Trophy,
  ArrowRight,
  Flame,
} from 'lucide-react';

export default function WelcomePanel() {
  const { completedTasks, setCurrentTaskId } = useSQLTrainerStore();

  const totalCount = TRAINING_TASKS.length;
  const completedCount = completedTasks.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Compute stats
  const avgAttempts = completedCount > 0
    ? (completedTasks.reduce((sum, t) => sum + t.attempts, 0) / completedCount).toFixed(1)
    : '0';

  const bestResult = completedCount > 0
    ? completedTasks.reduce((best, t) => t.attempts < best.attempts ? t : best, completedTasks[0])
    : null;

  const totalMinutes = completedCount > 0
    ? Math.round(completedTasks.reduce((sum, t) => sum + t.attempts, 0) * 3)
    : 0;

  const hasStarted = completedCount > 0;

  // Per-difficulty progress
  const difficulties: Difficulty[] = ['beginner', 'intermediate', 'advanced'];
  const diffProgress = difficulties.map((d) => {
    const tasks = TRAINING_TASKS.filter((t) => t.difficulty === d);
    const done = tasks.filter((t) => completedTasks.some((c) => c.taskId === t.id)).length;
    return { difficulty: d, total: tasks.length, completed: done };
  });

  // Last completed tasks
  const lastCompleted = [...completedTasks]
    .sort((a, b) => b.completedAt - a.completedAt)
    .slice(0, 3);

  // Find next uncompleted task
  const nextTask = TRAINING_TASKS.find((t) => !completedTasks.some((c) => c.taskId === t.id));

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-lg space-y-6">
          {/* Hero */}
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/30">
              <GraduationCap className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              SQL <span className="text-emerald-600 dark:text-emerald-400">Тренажёр</span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Интерактивное обучение SQL с практическими заданиями, проверкой решений и справочником.
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-muted/30">
              <CardContent className="p-3 text-center">
                <BarChart3 className="mx-auto h-5 w-5 text-sky-500 mb-1" />
                <p className="text-lg font-bold">{avgAttempts}</p>
                <p className="text-[11px] text-muted-foreground">Среднее попыток</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/30">
              <CardContent className="p-3 text-center">
                <Clock className="mx-auto h-5 w-5 text-amber-500 mb-1" />
                <p className="text-lg font-bold">~{totalMinutes} мин</p>
                <p className="text-[11px] text-muted-foreground">Время тренировки</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/30">
              <CardContent className="p-3 text-center">
                <Target className="mx-auto h-5 w-5 text-emerald-500 mb-1" />
                <p className="text-lg font-bold">{completedCount}/{totalCount}</p>
                <p className="text-[11px] text-muted-foreground">Выполнено</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/30">
              <CardContent className="p-3 text-center">
                <Zap className="mx-auto h-5 w-5 text-purple-500 mb-1" />
                <p className="text-lg font-bold">
                  {bestResult ? `${bestResult.attempts} поп.` : '—'}
                </p>
                <p className="text-[11px] text-muted-foreground">Лучший результат</p>
              </CardContent>
            </Card>
          </div>

          {/* Overall progress */}
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium">Общий прогресс</span>
              <span className="text-muted-foreground">{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-2.5" />
          </div>

          {/* Per-difficulty progress */}
          <div className="space-y-3">
            {diffProgress.map(({ difficulty, total, completed }) => {
              const pct = total > 0 ? (completed / total) * 100 : 0;
              return (
                <div key={difficulty}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <Badge className={`text-[10px] px-1.5 ${DIFFICULTY_COLORS[difficulty]}`}>
                        {DIFFICULTY_LABELS[difficulty]}
                      </Badge>
                      <span className="text-muted-foreground">{completed}/{total}</span>
                    </div>
                    <span className="text-muted-foreground">{Math.round(pct)}%</span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </div>
              );
            })}
          </div>

          {/* Last completed tasks */}
          {lastCompleted.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-medium flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-orange-500" />
                Последние выполненные
              </h3>
              <div className="space-y-1.5">
                {lastCompleted.map((ct) => {
                  const task = TRAINING_TASKS.find((t) => t.id === ct.taskId);
                  if (!task) return null;
                  return (
                    <div
                      key={ct.taskId}
                      className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <Trophy className="h-3.5 w-3.5 text-amber-500" />
                        <span className="text-xs">{task.title}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{ct.attempts} попыток</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action button */}
          <Separator />
          <Button
            size="lg"
            className="w-full bg-emerald-600 text-white hover:bg-emerald-700 gap-2"
            onClick={() => {
              if (nextTask) {
                setCurrentTaskId(nextTask.id);
              } else if (TRAINING_TASKS.length > 0) {
                setCurrentTaskId(TRAINING_TASKS[0].id);
              }
            }}
          >
            {hasStarted ? (
              <>
                Продолжить обучение
                <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              <>
                Начать обучение
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
