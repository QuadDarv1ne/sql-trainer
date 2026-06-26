'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { DIFFICULTY_LABELS, DIFFICULTY_COLORS, type TrainingTask, type TaskCategory } from '@/lib/training-tasks';
import { CATEGORY_ICONS } from '@/lib/category-icons';
import { generateProgressiveHints, getNextHintLevel } from '@/lib/progressive-hints';
import { t } from '@/lib/i18n';
import ContextualTips from '@/components/contextual-tips';
import { toast } from 'sonner';
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
  onNextRelated?: (index: number) => void;
  nextTaskLabel?: string;
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
  onNextRelated,
  nextTaskLabel,
  allCompleted = false,
  relatedTasks = [],
}: TaskPanelProps) {
  if (!task) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground/30" />
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">{t('task.selectTask')}</h3>
          <p className="mt-1 text-xs text-muted-foreground/70">{t('task.selectTaskDesc')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 p-4 bg-gradient-to-br from-background via-background to-muted/20">
      {/* Task header */}
      <div className="space-y-3.5">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={`${DIFFICULTY_COLORS[task.difficulty]} shadow-sm`}>
            {DIFFICULTY_LABELS[task.difficulty]}
          </Badge>
          {task.category && (
            <Badge variant="secondary" className="text-[10px] px-2 py-0.5 shadow-sm">
              {(() => {
                const Icon = CATEGORY_ICONS[task.category as TaskCategory];
                return Icon ? <Icon className="mr-1 h-3 w-3 inline" /> : null;
              })()}
              {t(`category.${task.category}`)}
            </Badge>
          )}
          {isCompleted && (
            <Badge
              variant="outline"
              className="border-emerald-400 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 shadow-sm"
            >
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
              {t('task.completedBadge')}
            </Badge>
          )}
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold leading-tight text-foreground">{task.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{task.description}</p>
        </div>
      </div>

      {/* Next task button */}
      {isCompleted && (
        <Button
          className="w-full h-11 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800 shadow-lg shadow-emerald-500/25 transition-all"
          onClick={onNextTask}
          disabled={allCompleted}
        >
          {allCompleted ? (
            <>
              <PartyPopper className="mr-2.5 h-4 w-4" />
              <span className="font-semibold">{t('task.allCompleted')}</span>
            </>
          ) : (
            <>
              <ArrowRight className="mr-2.5 h-4 w-4" />
              <span className="font-semibold">{nextTaskLabel || t('task.next')}</span>
            </>
          )}
        </Button>
      )}

      {isCompleted && allCompleted && (
        <div className="overflow-hidden rounded-2xl border border-emerald-200/60 bg-emerald-50/60 dark:border-emerald-800/60 dark:bg-emerald-950/20 shadow-sm">
          <div className="p-4 text-center space-y-2.5">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <PartyPopper className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{t('task.congrats')}</p>
            <p className="text-xs text-emerald-700/70 dark:text-emerald-400/70">{t('task.congratsDesc')}</p>
          </div>
        </div>
      )}

      <Separator className="border-border/60" />

      {/* Task description */}
      <div className="space-y-2.5">
        <h4 className="text-sm font-semibold flex items-center gap-2.5 text-foreground">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-emerald-100 dark:bg-emerald-900/30">
            <ChevronRight className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
          </div>
          {t('task.taskLabel')}
        </h4>
        <div className="rounded-xl bg-muted/40 border border-border/50 p-4">
          <p className="text-sm leading-relaxed">{task.taskText}</p>
        </div>
      </div>

      {/* Contextual SQL tips based on current task */}
      <ContextualTips task={task} />

      {/* Related tasks */}
      {relatedTasks.length > 0 && (
        <div className="space-y-2.5">
          <h4 className="text-sm font-semibold flex items-center gap-2.5 text-foreground">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-100 dark:bg-blue-900/30">
              <BookOpen className="h-3 w-3 text-blue-600 dark:text-blue-400" />
            </div>
            {t('task.related')}
          </h4>
          <div className="flex flex-col gap-2">
            {relatedTasks.map((relatedTask, index) => (
              <button
                key={relatedTask.id}
                onClick={() => onNextRelated?.(index)}
                className="group flex items-center gap-2.5 rounded-xl border border-border/60 bg-muted/30 px-3.5 py-2.5 text-left text-sm transition-all hover:bg-muted/50 hover:border-border/80"
                aria-label={t('task.goToRelated', {
                  title: relatedTask.title,
                  difficulty: DIFFICULTY_LABELS[relatedTask.difficulty],
                })}
              >
                <Badge className={`${DIFFICULTY_COLORS[relatedTask.difficulty]} shadow-sm`} variant="outline">
                  {DIFFICULTY_LABELS[relatedTask.difficulty]}
                </Badge>
                <span className="flex-1 truncate text-xs font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {relatedTask.title}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-blue-500 transition-colors shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Progressive Hints */}
      {(() => {
        if (!task) return null;
        const hints = generateProgressiveHints(task.id, task.hint, task.taskText, task.progressiveHints);
        const nextLevel = getNextHintLevel(hintLevel);
        const hintLevelLabels = ['', t('task.hintLevel1'), t('task.hintLevel2'), t('task.hintLevel3')];
        const hintLevelIcons = [
          null,
          <Info key="1" className="h-4 w-4" />,
          <HelpCircle key="2" className="h-4 w-4" />,
          <AlertCircle key="3" className="h-4 w-4" />,
        ];
        const hintLevelColors = [
          '',
          'text-blue-600 dark:text-blue-400',
          'text-amber-600 dark:text-amber-400',
          'text-orange-600 dark:text-orange-400',
        ];
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
          <div className="space-y-3">
            {/* Hint level indicators */}
            <div className="flex items-center gap-2.5">
              {[1, 2, 3].map((level) => (
                <div
                  key={level}
                  className={`flex-1 h-2 rounded-full transition-all ${
                    level <= hintLevel ? 'bg-gradient-to-r from-amber-400 to-amber-500 shadow-sm' : 'bg-muted'
                  }`}
                  title={`${hintLevelLabels[level]} (${hints[level - 1].xpPenalty} XP)`}
                />
              ))}
            </div>

            {/* Show revealed hints */}
            {hintLevel > 0 &&
              hints.slice(0, hintLevel).map((hint) => (
                <div
                  key={hint.level}
                  className={`overflow-hidden rounded-xl border ${hintBorderColors[hint.level]} ${hintBgColors[hint.level]} shadow-sm`}
                >
                  <div className={`p-4 pb-2`}>
                    <div className={`text-sm font-semibold flex items-center gap-2.5 ${hintLevelColors[hint.level]}`}>
                      <div className="flex h-5 w-5 items-center justify-center rounded bg-white/50 dark:bg-black/20">
                        {hintLevelIcons[hint.level]}
                      </div>
                      {hintLevelLabels[hint.level]}
                      {hint.xpPenalty > 0 && (
                        <Badge
                          variant="outline"
                          className="ml-auto text-[10px] border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400"
                        >
                          −{hint.xpPenalty} XP
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="p-4 pt-2">
                    <p className="text-sm leading-relaxed">{hint.text}</p>
                  </div>
                </div>
              ))}

            {/* Next hint button */}
            {nextLevel !== null && !isCompleted && (
              <Button
                variant="outline"
                size="sm"
                className="w-full h-10 hover:bg-amber-50 dark:hover:bg-amber-950/20 hover:border-amber-300 dark:hover:border-amber-700 transition-all"
                onClick={onRevealNextHint}
              >
                <Lightbulb className="mr-2.5 h-4 w-4 text-amber-500" />
                <span className="font-medium">
                  {hintLevel === 0 ? t('task.showFirstHint') : t('task.showNextHint', { level: String(nextLevel) })}
                </span>
                {hints[nextLevel - 1]?.xpPenalty > 0 && (
                  <Badge
                    variant="outline"
                    className="ml-2 text-xs border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400"
                  >
                    −{hints[nextLevel - 1].xpPenalty} XP
                  </Badge>
                )}
              </Button>
            )}

            {/* Total penalty display */}
            {totalHintPenalty > 0 && (
              <p className="text-xs text-muted-foreground text-center font-medium">
                {t('task.hintPenaltyTotal', { penalty: String(totalHintPenalty) })}
              </p>
            )}
          </div>
        );
      })()}

      {/* Solution */}
      <Separator className="border-border/60" />
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold flex items-center gap-2.5 text-foreground">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-amber-100 dark:bg-amber-900/30">
              <Trophy className="h-3 w-3 text-amber-600 dark:text-amber-400" />
            </div>
            {t('task.solutionTitle')}
          </h4>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs hover:bg-muted/70 transition-all"
            onClick={onShowSolution}
          >
            {solutionVisible ? (
              <>
                <EyeOff className="mr-1.5 h-3.5 w-3.5" />
                <span className="font-medium">{t('task.solutionHide')}</span>
              </>
            ) : (
              <>
                <Eye className="mr-1.5 h-3.5 w-3.5" />
                <span className="font-medium">{t('task.solutionShow')}</span>
              </>
            )}
          </Button>
        </div>
        {solutionVisible && (
          <div className="overflow-hidden rounded-xl bg-muted/40 border border-border/50">
            <div className="p-4 space-y-3">
              <pre className="overflow-x-auto whitespace-pre-wrap break-words text-xs font-mono bg-muted/60 rounded-lg p-3.5">
                {task.sampleSolution}
              </pre>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-9 text-xs hover:bg-muted/70 transition-all"
                  onClick={() => {
                    navigator.clipboard.writeText(task.sampleSolution);
                    toast.success(t('task.solutionCopied', { default: 'Solution copied to clipboard' }));
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  <span className="font-medium">{t('task.solutionCopy', { default: 'Copy SQL' })}</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-9 text-xs hover:bg-muted/70 transition-all"
                  onClick={() => onUseSolution(task.sampleSolution)}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  <span className="font-medium">{t('task.solutionUse')}</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
