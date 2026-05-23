'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { DIFFICULTY_LABELS, DIFFICULTY_COLORS, TRAINING_TASKS, type TrainingTask } from '@/lib/training-tasks';
import { generateProgressiveHints, getNextHintLevel, calculateHintPenalty, type ProgressiveHint } from '@/lib/progressive-hints';
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
  HelpCircle,
  AlertCircle,
  Info,
} from 'lucide-react';

interface TaskPanelProps {
  task: TrainingTask | null;
  isCompleted: boolean;
  // Progressive hints
  hintLevel: 0 | 1 | 2 | 3;
  totalHintPenalty: number;
  onRevealNextHint: () => void;
  solutionVisible: boolean;
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
  hintLevel,
  totalHintPenalty,
  onRevealNextHint,
  solutionVisible,
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
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={DIFFICULTY_COLORS[task.difficulty]}>
            {DIFFICULTY_LABELS[task.difficulty]}
          </Badge>
          {isCompleted && (
            <Badge variant="outline" className="border-emerald-500 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
              {t('task.completedBadge')}
            </Badge>
          )}
        </div>
        <div className="space-y-1.5">
          <h3 className="text-lg font-semibold leading-tight">{task.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{task.description}</p>
        </div>
      </div>

      {/* Next task button */}
      {isCompleted && (
        <Button
          className="w-full h-9 bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
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
          <CardContent className="p-4 text-center space-y-2">
            <PartyPopper className="mx-auto h-8 w-8 text-emerald-500" />
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              {t('task.congrats')}
            </p>
            <p className="text-xs text-emerald-600/70 dark:text-emerald-500/70">
              {t('task.congratsDesc')}
            </p>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Task description */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <ChevronRight className="h-4 w-4 text-emerald-500" />
          {t('task.taskLabel')}
        </h4>
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <p className="text-sm leading-relaxed">{task.taskText}</p>
          </CardContent>
        </Card>
      </div>

      {/* Related tasks */}
      {relatedTasks.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-500" />
            {t('task.related')}
          </h4>
          <div className="flex flex-col gap-2">
            {relatedTasks.map((relatedTask, index) => (
              <button
                key={relatedTask.id}
                onClick={() => onNextRelated?.(index)}
                className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/40"
                aria-label={t('task.goToRelated', { title: relatedTask.title, difficulty: DIFFICULTY_LABELS[relatedTask.difficulty] })}
              >
                <Badge className={DIFFICULTY_COLORS[relatedTask.difficulty]} variant="outline">
                  {DIFFICULTY_LABELS[relatedTask.difficulty]}
                </Badge>
                <span className="flex-1 truncate text-xs">{relatedTask.title}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Progressive Hints */}
      {(() => {
        if (!task) return null;
        const hints = generateProgressiveHints(task.id, task.hint, task.taskText, task.sampleSolution);
        const nextLevel = getNextHintLevel(hintLevel);
        const hintLevelLabels = [
          '',
          t('task.hintLevel1'),
          t('task.hintLevel2'),
          t('task.hintLevel3'),
        ];
        const hintLevelIcons = [null, <Info key="1" className="h-4 w-4" />, <HelpCircle key="2" className="h-4 w-4" />, <AlertCircle key="3" className="h-4 w-4" />];
        const hintLevelColors = ['', 'text-blue-600 dark:text-blue-400', 'text-amber-600 dark:text-amber-400', 'text-orange-600 dark:text-orange-400'];
        const hintBgColors = [
          '',
          'bg-blue-50/50 dark:bg-blue-950/20',
          'bg-amber-50/50 dark:bg-amber-950/20',
          'bg-orange-50/50 dark:bg-orange-950/20',
        ];
        const hintBorderColors = [
          '',
          'border-blue-300 dark:border-blue-700',
          'border-amber-300 dark:border-amber-700',
          'border-orange-300 dark:border-orange-700',
        ];

        return (
          <div className="space-y-2">
            {/* Hint level indicators */}
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((level) => (
                <div
                  key={level}
                  className={`flex-1 h-1.5 rounded-full transition-colors ${
                    level <= hintLevel ? 'bg-amber-500' : 'bg-muted'
                  }`}
                  title={`${hintLevelLabels[level]} (${hints[level - 1].xpPenalty} XP)`}
                />
              ))}
            </div>

            {/* Show revealed hints */}
            {hintLevel > 0 && hints.slice(0, hintLevel).map((hint) => (
              <Card
                key={hint.level}
                className={`border ${hintBorderColors[hint.level]} ${hintBgColors[hint.level]}`}
              >
                <CardHeader className="pb-2 px-4 pt-4">
                  <CardTitle className={`text-sm font-medium flex items-center gap-2 ${hintLevelColors[hint.level]}`}>
                    {hintLevelIcons[hint.level]}
                    {hintLevelLabels[hint.level]}
                    {hint.xpPenalty > 0 && (
                      <span className="text-xs text-muted-foreground ml-auto">
                        (-{hint.xpPenalty} XP)
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <p className="text-sm leading-relaxed">{hint.text}</p>
                </CardContent>
              </Card>
            ))}

            {/* Next hint button */}
            {nextLevel !== null && !isCompleted && (
              <Button
                variant="outline"
                size="sm"
                className="w-full h-9"
                onClick={onRevealNextHint}
              >
                <Lightbulb className="mr-2 h-4 w-4" />
                {hintLevel === 0
                  ? t('task.showFirstHint')
                  : t('task.showNextHint', { level: String(nextLevel) })}
                {hints[nextLevel - 1]?.xpPenalty > 0 && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    (-{hints[nextLevel - 1].xpPenalty} XP)
                  </span>
                )}
              </Button>
            )}

            {/* Total penalty display */}
            {totalHintPenalty > 0 && (
              <p className="text-xs text-muted-foreground text-center">
                {t('task.hintPenaltyTotal', { penalty: String(totalHintPenalty) })}
              </p>
            )}
          </div>
        );
      })()}

      {/* Solution */}
      <Separator />
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            {t('task.solutionTitle')}
          </h4>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={onShowSolution}
          >
            {solutionVisible ? (
              <>
                <EyeOff className="mr-1.5 h-3.5 w-3.5" />
                {t('task.solutionHide')}
              </>
            ) : (
              <>
                <Eye className="mr-1.5 h-3.5 w-3.5" />
                {t('task.solutionShow')}
              </>
            )}
          </Button>
        </div>
        {solutionVisible && (
          <Card className="bg-muted/30">
            <CardContent className="p-4 space-y-3">
              <pre className="overflow-x-auto whitespace-pre-wrap break-words text-xs font-mono bg-muted/50 rounded-md p-3">
                {task.sampleSolution}
              </pre>
              <Button
                variant="outline"
                size="sm"
                className="w-full h-9 text-xs"
                onClick={() => onUseSolution(task.sampleSolution)}
              >
                <Copy className="mr-2 h-4 w-4" />
                {t('task.solutionUse')}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
