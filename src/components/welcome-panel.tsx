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
} from 'lucide-react';

interface WelcomePanelProps {
  onStartTraining: () => void;
  onFreeMode: () => void;
}

export default function WelcomePanel({ onStartTraining, onFreeMode }: WelcomePanelProps) {
  const { completedTasks, setCurrentTaskId } = useSQLTrainerStore();

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

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      {/* Welcome header */}
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/30">
          <BookOpen className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="text-lg font-bold">
          SQL <span className="text-emerald-600 dark:text-emerald-400">Тренажёр</span>
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Интерактивная платформа для изучения SQL
        </p>
      </div>

      {/* Progress overview */}
      <Card>
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium">Общий прогресс</span>
            </div>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {completedCount}/{totalCount}
            </span>
          </div>
          <Progress value={progressPercent} className="h-3" />
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {progressPercent === 100
              ? '🎉 Поздравляем! Все задания выполнены!'
              : `${Math.round(progressPercent)}% завершено`}
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

      {/* Quick start buttons */}
      <div className="flex flex-col gap-2">
        <Button
          className="w-full bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
          onClick={() => {
            if (firstIncompleteTask) {
              setCurrentTaskId(firstIncompleteTask.id);
            } else {
              onStartTraining();
            }
          }}
        >
          <Rocket className="mr-2 h-4 w-4" />
          Начать обучение
        </Button>
        <Button variant="outline" className="w-full" onClick={onFreeMode}>
          <GraduationCap className="mr-2 h-4 w-4" />
          Свободный режим
        </Button>
      </div>

      {/* Last completed */}
      {lastCompleted.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5 text-amber-500" />
            Последние выполненные
          </h4>
          <div className="space-y-1.5">
            {lastCompleted.map((task) => {
              if (!task) return null;
              return (
                <button
                  key={task.id}
                  onClick={() => setCurrentTaskId(task.id)}
                  className="flex w-full items-center gap-2 rounded-md border border-border px-3 py-2 text-left text-xs transition-colors hover:bg-muted/50"
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
          Советы по использованию
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
