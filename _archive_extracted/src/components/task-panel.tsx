'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { DIFFICULTY_LABELS, DIFFICULTY_COLORS } from '@/lib/training-tasks';
import type { TrainingTask, Difficulty } from '@/lib/training-tasks';
import {
  BookOpen,
  CheckCircle2,
  Lightbulb,
  ChevronRight,
  Trophy,
  Code2,
  ChevronLeft,
  PartyPopper,
} from 'lucide-react';

interface TaskPanelProps {
  task: TrainingTask | null;
  isCompleted: boolean;
  hintVisible: boolean;
  onShowHint: () => void;
  solutionVisible?: boolean;
  onShowSolution?: () => void;
  onUseSolution?: (sql: string) => void;
  onNextTask?: () => void;
  nextTaskLabel?: string;
  isLastTask?: boolean;
  allCompleted?: boolean;
}

export default function TaskPanel({
  task,
  isCompleted,
  hintVisible,
  onShowHint,
  solutionVisible,
  onShowSolution,
  onUseSolution,
  onNextTask,
  nextTaskLabel,
  isLastTask,
  allCompleted,
}: TaskPanelProps) {
  if (!task) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground/30" />
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Выберите задание</h3>
          <p className="mt-1 text-xs text-muted-foreground/70">
            Выберите задание из списка слева или начните писать SQL запрос в редакторе
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      {/* Task header */}
      <div>
        <div className="flex items-center gap-2">
          <Badge className={DIFFICULTY_COLORS[task.difficulty]}>
            {DIFFICULTY_LABELS[task.difficulty]}
          </Badge>
          {isCompleted && (
            <Badge variant="outline" className="border-emerald-500 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Выполнено
            </Badge>
          )}
        </div>
        <h3 className="mt-2 text-lg font-semibold">{task.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>
      </div>

      <Separator />

      {/* Task description */}
      <div>
        <h4 className="mb-2 text-sm font-medium flex items-center gap-1.5">
          <ChevronRight className="h-4 w-4 text-emerald-500" />
          Задание
        </h4>
        <Card className="bg-muted/30">
          <CardContent className="p-3">
            <p className="text-sm leading-relaxed">{task.taskText}</p>
          </CardContent>
        </Card>
      </div>

      {/* Hint */}
      {!hintVisible ? (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={onShowHint}
        >
          <Lightbulb className="mr-2 h-4 w-4" />
          Показать подсказку
        </Button>
      ) : (
        <Card className="border-amber-300 bg-amber-50/50 dark:border-amber-700 dark:bg-amber-950/20">
          <CardHeader className="pb-2 pt-3 px-3">
            <CardTitle className="text-xs font-medium flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
              <Lightbulb className="h-3.5 w-3.5" />
              Подсказка
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-sm text-amber-800 dark:text-amber-300">{task.hint}</p>
          </CardContent>
        </Card>
      )}

      {/* Solution section */}
      <Separator />
      <div>
        {solutionVisible !== undefined && onShowSolution && (
          !solutionVisible ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={onShowSolution}
            >
              <Code2 className="mr-2 h-4 w-4" />
              Показать решение
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium flex items-center gap-1.5">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  Пример решения
                </h4>
                {onUseSolution && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => onUseSolution(task.sampleSolution)}
                  >
                    Вставить в редактор
                  </Button>
                )}
              </div>
              <Card className="bg-muted/30">
                <CardContent className="p-3">
                  <pre className="overflow-x-auto whitespace-pre-wrap break-words text-xs font-mono">
                    {task.sampleSolution}
                  </pre>
                </CardContent>
              </Card>
            </div>
          )
        )}
      </div>

      {/* Next task button */}
      {isCompleted && !isLastTask && onNextTask && (
        <>
          <Separator />
          <Button
            size="sm"
            className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={onNextTask}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            {nextTaskLabel || 'Следующее задание'}
          </Button>
        </>
      )}

      {/* All completed congratulations */}
      {allCompleted && (
        <>
          <Separator />
          <Card className="border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20">
            <CardContent className="p-4 text-center">
              <PartyPopper className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
              <h4 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                Все задания выполнены!
              </h4>
              <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
                Поздравляем! Вы прошли все тренировочные задания.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
