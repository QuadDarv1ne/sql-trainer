'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  TRAINING_TASKS,
  DIFFICULTY_LABELS,
  type Difficulty,
  type TrainingTask,
} from '@/lib/training-tasks';
import { useSQLTrainerStore } from '@/lib/store';
import { useSession } from 'next-auth/react';
import {
  GraduationCap,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  Target,
  User,
  Bookmark,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import ExportImportDialog from '@/components/export-import-dialog';

export default function Sidebar() {
  const { currentTaskId, setCurrentTaskId, completedTasks, sidebarOpen, bookmarkedTasks, toggleBookmark } =
    useSQLTrainerStore();
  const { data: session } = useSession();

  const [expandedSections, setExpandedSections] = useState<
    Record<Difficulty, boolean>
  >({
    beginner: true,
    intermediate: true,
    advanced: true,
  });

  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);

  const completedCount = completedTasks.length;
  const totalCount = TRAINING_TASKS.length;
  const progressPercent =
    totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const tasksByDifficulty = useMemo(() => {
    const map: Record<Difficulty, TrainingTask[]> = {
      beginner: [],
      intermediate: [],
      advanced: [],
    };
    TRAINING_TASKS.forEach((task) => {
      map[task.difficulty].push(task);
    });
    return map;
  }, []);

  const toggleSection = (difficulty: Difficulty) => {
    setExpandedSections((prev) => ({
      ...prev,
      [difficulty]: !prev[difficulty],
    }));
  };

  const completedIds = useMemo(
    () => new Set(completedTasks.map((t) => t.taskId)),
    [completedTasks]
  );

  const bookmarkedIds = useMemo(
    () => new Set(bookmarkedTasks),
    [bookmarkedTasks]
  );

  const filteredTasksByDifficulty = useMemo(() => {
    const map: Record<Difficulty, TrainingTask[]> = {
      beginner: [],
      intermediate: [],
      advanced: [],
    };
    TRAINING_TASKS.forEach((task) => {
      if (!showBookmarksOnly || bookmarkedIds.has(task.id)) {
        map[task.difficulty].push(task);
      }
    });
    return map;
  }, [showBookmarksOnly, bookmarkedIds]);

  if (!sidebarOpen) return null;

  return (
    <div className="flex h-full flex-col">
      {/* Progress */}
      <div className="border-b border-border p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium flex items-center gap-1.5">
            <Target className="h-4 w-4 text-emerald-500" />
            Прогресс
          </span>
          <span className="text-xs text-muted-foreground">
            {completedCount}/{totalCount}
          </span>
        </div>
        <Progress value={progressPercent} className="h-2" />
        <p className="mt-1.5 text-xs text-muted-foreground">
          {progressPercent === 100
            ? '🎉 Все задания выполнены!'
            : `${Math.round(progressPercent)}% завершено`}
        </p>

        {/* Bookmark filter */}
        <button
          onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
          className={`mt-2 flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors ${
            showBookmarksOnly
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              : 'text-muted-foreground hover:bg-muted/50'
          }`}
        >
          <Bookmark
            className={`h-3 w-3 ${
              showBookmarksOnly ? 'fill-amber-500 text-amber-500' : ''
            }`}
          />
          {showBookmarksOnly ? 'Избранные' : 'Все задания'}
        </button>
      </div>

      {/* Tasks list */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {(
            ['beginner', 'intermediate', 'advanced'] as Difficulty[]
          ).map((difficulty) => {
            const tasks = filteredTasksByDifficulty[difficulty];
            if (tasks.length === 0) return null;

            const isExpanded = expandedSections[difficulty];
            const completedInSection = tasks.filter((t) =>
              completedIds.has(t.id)
            ).length;

            return (
              <div key={difficulty} className="mb-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between px-2 hover:bg-muted/50"
                  onClick={() => toggleSection(difficulty)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {DIFFICULTY_LABELS[difficulty]}
                    </span>
                    <Badge variant="secondary" className="text-xs px-1.5">
                      {completedInSection}/{tasks.length}
                    </Badge>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </Button>
                {isExpanded && (
                  <div className="ml-2 space-y-0.5 border-l-2 border-border pl-2">
                    {tasks.map((task) => {
                      const isActive = task.id === currentTaskId;
                      const isDone = completedIds.has(task.id);
                      const isBookmarked = bookmarkedIds.has(task.id);
                      return (
                        <div
                          key={task.id}
                          className="flex w-full items-start gap-1 rounded-md"
                        >
                          <button
                            onClick={() => setCurrentTaskId(task.id)}
                            aria-label={`${isDone ? 'Выполнено: ' : ''}${task.title}`}
                            className={`flex flex-1 items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted/50 ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                                : 'text-foreground/80'
                            }`}
                          >
                            {isDone ? (
                              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                            ) : (
                              <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                            )}
                            <span className="leading-tight">{task.title}</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBookmark(task.id);
                            }}
                            className={`mt-1.5 rounded p-0.5 transition-colors hover:bg-muted/50 ${
                              isBookmarked
                                ? 'text-amber-500'
                                : 'text-muted-foreground/40'
                            }`}
                            aria-label={isBookmarked ? 'Удалить из избранного' : 'Добавить в избранное'}
                          >
                            <Bookmark
                              className={`h-3 w-3 ${isBookmarked ? 'fill-amber-500' : ''}`}
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Free mode + Profile */}
      <div className="border-t border-border p-3 space-y-2">
        <ExportImportDialog />

        {session?.user && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            asChild
          >
            <Link href="/profile">
              <User className="mr-2 h-4 w-4" />
              Профиль
            </Link>
          </Button>
        )}
        <Button
          variant={currentTaskId === null ? 'default' : 'outline'}
          size="sm"
          className="w-full"
          onClick={() => setCurrentTaskId(null)}
        >
          <GraduationCap className="mr-2 h-4 w-4" />
          Свободный режим
        </Button>
      </div>
    </div>
  );
}
