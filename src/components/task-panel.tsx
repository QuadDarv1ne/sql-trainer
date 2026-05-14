'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { DIFFICULTY_LABELS, DIFFICULTY_COLORS, TRAINING_TASKS, type TrainingTask } from '@/lib/training-tasks';
import { t } from '@/lib/i18n';
import {
  BookOpen,
  CheckCircle2,
  Lightbulb,
  ChevronRight,
  Trophy,
  Eye,
  EyeOff,
  Copy,
  ArrowRight,
  PartyPopper,
} from 'lucide-react';

interface TaskPanelProps {
  task: TrainingTask | null;
  isCompleted: boolean;
  hintVisible: boolean;
  solutionVisible: boolean;
  onShowHint: () => void;
  onShowSolution: () => void;
  onUseSolution: (sql: string) => void;
  onNextTask: () => void;
  onPrevTask?: () => void;
  onNextRelated?: (index: number) => void;
  nextTaskLabel?: string;
  isLastTask?: boolean;
  allCompleted?: boolean;
  relatedTasks?: TrainingTask[];
}

export default function TaskPanel({
  task,
  isCompleted,
  hintVisible,
  solutionVisible,
  onShowHint,
  onShowSolution,
  onUseSolution,
  onNextTask,
  onPrevTask,
  onNextRelated,
  nextTaskLabel,
  isLastTask = false,
  allCompleted = false,
  relatedTasks = [],
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
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={DIFFICULTY_COLORS[task.difficulty]}>
            {DIFFICULTY_LABELS[task.difficulty]}
          </Badge>
          {isCompleted && (
            <Badge variant="outline" className="border-emerald-500 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              {t('task.completedBadge')}
            </Badge>
          )}
        </div>
        <h3 className="mt-2 text-lg font-semibold">{task.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>
      </div>

      {/* Next task button */}
      {isCompleted && (
        <Button
          className="w-full bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
          onClick={onNextTask}
          disabled={allCompleted}
        >
          {allCompleted ? (
            <>
              <PartyPopper className="mr-2 h-4 w-4" />
              Все задания выполнены!
            </>
          ) : (
            <>
              <ArrowRight className="mr-2 h-4 w-4" />
              {nextTaskLabel || 'Следующее задание →'}
            </>
          )}
        </Button>
      )}

      {isCompleted && allCompleted && (
        <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20">
          <CardContent className="p-3 text-center">
            <PartyPopper className="mx-auto mb-1 h-6 w-6 text-emerald-500" />
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              {t('task.congrats')}
            </p>
            <p className="mt-0.5 text-xs text-emerald-600/70 dark:text-emerald-500/70">
              {t('task.congratsDesc')}
            </p>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Task description */}
      <div>
        <h4 className="mb-2 text-sm font-medium flex items-center gap-1.5">
          <ChevronRight className="h-4 w-4 text-emerald-500" />
          {t('task.taskLabel')}
        </h4>
        <Card className="bg-muted/30">
          <CardContent className="p-3">
            <p className="text-sm leading-relaxed">{task.taskText}</p>
          </CardContent>
        </Card>
      </div>

      {/* Related tasks */}
      {relatedTasks.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-medium flex items-center gap-1.5">
            <BookOpen className="h-4 w-4 text-blue-500" />
            {t('task.related')}
          </h4>
          <div className="flex flex-col gap-1.5">
            {relatedTasks.map((relatedTask, index) => (
              <button
                key={relatedTask.id}
                onClick={() => onNextRelated?.(index)}
                className="flex items-center gap-2 rounded-md border border-border/50 bg-muted/20 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40"
              >
                <Badge className={DIFFICULTY_COLORS[relatedTask.difficulty]} variant="outline">
                  {DIFFICULTY_LABELS[relatedTask.difficulty]}
                </Badge>
                <span className="flex-1 truncate text-xs">{relatedTask.title}</span>
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hint */}
      {!hintVisible ? (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={onShowHint}
        >
          <Lightbulb className="mr-2 h-4 w-4" />
          {t('task.showHint')}
        </Button>
      ) : (
        <Card className="border-amber-300 bg-amber-50/50 dark:border-amber-700 dark:bg-amber-950/20">
          <CardHeader className="pb-2 pt-3 px-3">
            <CardTitle className="text-xs font-medium flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
              <Lightbulb className="h-3.5 w-3.5" />
              {t('task.hint')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-sm text-amber-800 dark:text-amber-300">{task.hint}</p>
          </CardContent>
        </Card>
      )}

      {/* Solution */}
      <Separator />
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium flex items-center gap-1.5">
            <Trophy className="h-4 w-4 text-amber-500" />
            {t('task.solutionTitle')}
          </h4>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs px-2"
            onClick={onShowSolution}
          >
            {solutionVisible ? (
              <>
                <EyeOff className="mr-1 h-3 w-3" />
                {t('task.solutionHide')}
              </>
            ) : (
              <>
                <Eye className="mr-1 h-3 w-3" />
                {t('task.solutionShow')}
              </>
            )}
          </Button>
        </div>
        {solutionVisible && (
          <Card className="bg-muted/30">
            <CardContent className="p-3">
              <pre className="overflow-x-auto whitespace-pre-wrap break-words text-xs font-mono">
                {task.sampleSolution}
              </pre>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 h-7 w-full text-xs"
                onClick={() => onUseSolution(task.sampleSolution)}
              >
                <Copy className="mr-1.5 h-3 w-3" />
                {t('task.solutionUse')}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
