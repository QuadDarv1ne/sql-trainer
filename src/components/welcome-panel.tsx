'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TRAINING_TASKS, DIFFICULTY_LABELS, DIFFICULTY_COLORS, type Difficulty } from '@/lib/training-tasks';
import { useSQLTrainerStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import { plural } from '@/lib/utils';
import { recommendByConcept, CONCEPT_LABELS } from '@/lib/concept-engine';
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
  onStartTour?: () => void;
}

export default function WelcomePanel({ onStartTraining, onFreeMode, onStartTour }: WelcomePanelProps) {
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

  // Recommended task based on skill progression + concept gaps
  const { recommendedTask, missingConceptLabel } = useMemo(() => {
    // Find the highest difficulty level the user has completed at least one task
    const completedDifficulties = new Set(
      completedTasks.map((ct) => TRAINING_TASKS.find((t) => t.id === ct.taskId)?.difficulty).filter(Boolean),
    );

    let targetDifficulty: Difficulty | null = 'beginner';
    if (completedDifficulties.has('advanced')) {
      targetDifficulty = 'advanced';
    } else if (completedDifficulties.has('intermediate')) {
      const intermediateCompleted = completedTasks.filter(
        (ct) => TRAINING_TASKS.find((t) => t.id === ct.taskId)?.difficulty === 'intermediate',
      ).length;
      const intermediateTotal = TRAINING_TASKS.filter((t) => t.difficulty === 'intermediate').length;
      targetDifficulty = intermediateCompleted >= intermediateTotal * 0.5 ? 'advanced' : 'intermediate';
    } else if (completedDifficulties.has('beginner')) {
      const beginnerCompleted = completedTasks.filter(
        (ct) => TRAINING_TASKS.find((t) => t.id === ct.taskId)?.difficulty === 'beginner',
      ).length;
      const beginnerTotal = TRAINING_TASKS.filter((t) => t.difficulty === 'beginner').length;
      targetDifficulty = beginnerCompleted >= beginnerTotal * 0.5 ? 'intermediate' : 'beginner';
    }

    // Try concept-aware recommendation first
    const completedIds = completedTasks.map((ct) => ct.taskId);
    const conceptRec = recommendByConcept(completedIds, TRAINING_TASKS, targetDifficulty);

    if (conceptRec) {
      return {
        recommendedTask: conceptRec.task,
        missingConceptLabel: CONCEPT_LABELS[conceptRec.missingConcept],
      };
    }

    // Fallback: first incomplete task at target difficulty
    const fallback =
      TRAINING_TASKS.find(
        (t) => t.difficulty === targetDifficulty && !completedTasks.some((ct) => ct.taskId === t.id),
      ) || firstIncompleteTask;

    return { recommendedTask: fallback, missingConceptLabel: null };
  }, [completedTasks, firstIncompleteTask]);

  return (
    <div className="flex h-full flex-col gap-4 p-4 bg-gradient-to-br from-background via-background to-muted/20">
      {/* Welcome header */}
      <div className="text-center pt-2">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/25">
          <BookOpen className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
          {t('app.title')}
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground font-medium">{t('app.subtitle')}</p>
      </div>

      {/* Progress overview */}
      <div className="rounded-2xl bg-gradient-to-br from-muted/60 to-muted/40 border border-border/60 shadow-sm p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm font-semibold text-foreground">{t('welcome.progressLabel')}</span>
          </div>
          <Badge
            variant="secondary"
            className="text-sm px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-0 font-bold"
          >
            {completedCount}/{totalCount}
          </Badge>
        </div>
        <div className="relative">
          <Progress value={progressPercent} className="h-2.5" />
          {progressPercent === 100 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                100%
              </span>
            </div>
          )}
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground font-medium">
          {progressPercent === 100
            ? t('progress.complete')
            : `${Math.round(progressPercent)}% ${t('progress.percent')}`}
        </p>
      </div>

      {/* Stats by difficulty */}
      <div className="grid grid-cols-3 gap-2.5">
        {statsByDifficulty.map((stat) => (
          <div
            key={stat.difficulty}
            className="overflow-hidden rounded-xl bg-gradient-to-br from-muted/60 to-muted/40 border border-border/60 shadow-sm"
          >
            <div className="p-3 text-center">
              <Badge className={`${DIFFICULTY_COLORS[stat.difficulty]} mb-2 text-[10px] px-2 py-0.5 shadow-sm`}>
                {DIFFICULTY_LABELS[stat.difficulty]}
              </Badge>
              <p className="text-lg font-bold text-foreground">
                {stat.completed}
                <span className="text-muted-foreground font-medium">/</span>
                {stat.total}
              </p>
              <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
                  style={{
                    width: stat.total > 0 ? `${(stat.completed / stat.total) * 100}%` : '0%',
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Streak display */}
      {streak.currentStreak > 0 && (
        <div className="overflow-hidden rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50 to-orange-50 dark:border-amber-800/60 dark:from-amber-950/30 dark:to-orange-950/20 shadow-sm">
          <div className="p-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/25">
                <Flame className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl font-bold text-amber-700 dark:text-amber-300">
                    {streak.currentStreak}{' '}
                    {plural(
                      streak.currentStreak,
                      t('welcome.streak.day'),
                      t('welcome.streak.days'),
                      t('welcome.streak.daysMany'),
                    )}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400 font-medium"
                  >
                    {t('welcome.streak.label')}
                  </Badge>
                </div>
                <div className="mt-1.5 flex items-center gap-4 text-[10px] text-amber-700/70 dark:text-amber-400/70">
                  <div className="flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5" />
                    <span className="font-medium">
                      {t('welcome.streak.record')}: <span className="font-bold">{streak.longestStreak}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    <span className="font-medium">
                      {t('welcome.streak.total')}: <span className="font-bold">{streak.totalPracticeDays}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommended task card */}
      {recommendedTask && (
        <div className="overflow-hidden rounded-2xl border border-blue-200/60 bg-gradient-to-br from-blue-50 to-teal-50 dark:border-blue-800/60 dark:from-blue-950/30 dark:to-teal-950/20 shadow-sm">
          <div className="p-4">
            <div className="mb-3 flex items-center gap-2 flex-wrap">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs font-bold text-blue-700 dark:text-blue-300">{t('welcome.recommend')}</span>
              {missingConceptLabel && (
                <Badge
                  variant="outline"
                  className="text-[10px] border-amber-300/60 text-amber-700 dark:border-amber-700/60 dark:text-amber-400"
                >
                  {t('welcome.needPractice', { default: 'Нужно practice' })}: {missingConceptLabel}
                </Badge>
              )}
            </div>
            <button onClick={() => setCurrentTaskId(recommendedTask.id)} className="w-full text-left group">
              <p className="text-sm font-bold text-blue-900 dark:text-blue-100 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                {recommendedTask.title}
              </p>
              <p className="mt-1 text-xs text-blue-700/70 dark:text-blue-400/70 line-clamp-2">
                {recommendedTask.description}
              </p>
            </button>
            <div className="mt-3">
              <Badge className={`${DIFFICULTY_COLORS[recommendedTask.difficulty]} text-[10px] shadow-sm`}>
                {DIFFICULTY_LABELS[recommendedTask.difficulty]}
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Quick start buttons */}
      <div className="flex flex-col gap-2.5">
        <Button
          className="w-full h-11 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800 shadow-lg shadow-emerald-500/25 transition-all"
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
          <Rocket className="mr-2.5 h-4 w-4" />
          <span className="font-semibold">{t('welcome.startTraining')}</span>
        </Button>
        {onStartTour && (
          <Button variant="outline" className="w-full h-10 hover:bg-muted/70 transition-all" onClick={onStartTour}>
            <Play className="mr-2.5 h-4 w-4" />
            <span className="font-medium">{t('welcome.startTour')}</span>
          </Button>
        )}
        <Button variant="outline" className="w-full h-10 hover:bg-muted/70 transition-all" onClick={onFreeMode}>
          <GraduationCap className="mr-2.5 h-4 w-4" />
          <span className="font-medium">{t('action.freeMode')}</span>
        </Button>
        <PracticeModeDialog />
      </div>

      {/* Last completed */}
      {lastCompleted.length > 0 && (
        <div>
          <h4 className="mb-2.5 text-xs font-bold text-foreground flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-amber-100 dark:bg-amber-900/30">
              <Trophy className="h-3 w-3 text-amber-600 dark:text-amber-400" />
            </div>
            {t('welcome.recent')}
          </h4>
          <div className="space-y-2">
            {lastCompleted.map((task) => {
              if (!task) return null;
              return (
                <button
                  key={task.id}
                  onClick={() => setCurrentTaskId(task.id)}
                  className="group flex w-full items-center gap-2.5 rounded-xl border border-border/60 bg-muted/30 px-3.5 py-2.5 text-left text-xs transition-all hover:bg-muted/50 hover:border-border/80"
                  aria-label={t('welcome.goToTask', { title: task.title })}
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {task.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(task.completedAt).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-2 py-0.5 bg-muted/70 border-0 font-medium shrink-0"
                  >
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
        <h4 className="mb-2.5 text-xs font-bold text-foreground flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-muted">
            <Keyboard className="h-3 w-3 text-muted-foreground" />
          </div>
          {t('welcome.tips')}
        </h4>
        <div className="rounded-xl bg-muted/40 border border-border/50 p-3.5 space-y-2">
          <div className="flex items-center gap-2.5 text-xs">
            <kbd className="shrink-0 rounded-lg border border-border bg-background px-2 py-1.5 font-mono text-xs shadow-sm">
              Ctrl+↵
            </kbd>
            <span className="text-muted-foreground font-medium">{t('shortcuts.execute')}</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs">
            <kbd className="shrink-0 rounded-lg border border-border bg-background px-2 py-1.5 font-mono text-xs shadow-sm">
              Ctrl+L
            </kbd>
            <span className="text-muted-foreground font-medium">{t('action.clear')}</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs">
            <kbd className="shrink-0 rounded-lg border border-border bg-background px-2 py-1.5 font-mono text-xs shadow-sm">
              Tab
            </kbd>
            <span className="text-muted-foreground font-medium">{t('shortcuts.indent')}</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs">
            <Sparkles className="h-4 w-4 shrink-0 text-amber-500" />
            <span className="text-muted-foreground font-medium">{t('welcome.tip')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
