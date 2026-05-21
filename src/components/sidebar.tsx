'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  TRAINING_TASKS,
  DIFFICULTY_LABELS,
  type Difficulty,
  type TrainingTask,
  type TaskCategory,
} from '@/lib/training-tasks';
import { useSQLTrainerStore } from '@/lib/store';
import { useSession } from 'next-auth/react';
import { t } from '@/lib/i18n';
import {
  GraduationCap,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  Target,
  User,
  Bookmark,
  Search,
  X,
} from 'lucide-react';
import { CATEGORY_ICONS } from '@/lib/category-icons';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import ExportImportDialog from '@/components/export-import-dialog';
import { ReminderBell } from '@/components/reminders/reminder-bell';
import { Input } from '@/components/ui/input';

const CATEGORY_LABELS: Record<TaskCategory | 'base', string> = {
  base: 'Базовые',
  company: 'Компания',
  shop: 'Магазин',
  analytics: 'Аналитика',
  exam: 'Экзамены',
};

const CATEGORY_COLORS: Record<TaskCategory | 'base', string> = {
  base: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  company: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
  shop: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400',
  analytics: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  exam: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
};

type CategoryKey = TaskCategory | 'base';

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

  // Track which category sub-sections are expanded within each difficulty
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});

  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<CategoryKey | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const completedCount = completedTasks.length;
  const totalCount = TRAINING_TASKS.length;
  const progressPercent =
    totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const completedIds = useMemo(
    () => new Set(completedTasks.map((t) => t.taskId)),
    [completedTasks]
  );

  const bookmarkedIds = useMemo(
    () => new Set(bookmarkedTasks),
    [bookmarkedTasks]
  );

  // Group tasks by difficulty, then by category
  const tasksByDifficultyAndCategory = useMemo(() => {
    const map: Record<Difficulty, Record<CategoryKey, TrainingTask[]>> = {
      beginner: { base: [], company: [], shop: [], analytics: [], exam: [] },
      intermediate: { base: [], company: [], shop: [], analytics: [], exam: [] },
      advanced: { base: [], company: [], shop: [], analytics: [], exam: [] },
    };
    const query = searchQuery.toLowerCase().trim();
    TRAINING_TASKS.forEach((task) => {
      const cat: CategoryKey = task.category ?? 'base';
      if (showBookmarksOnly && !bookmarkedIds.has(task.id)) return;
      if (activeCategoryFilter !== 'all' && cat !== activeCategoryFilter) return;
      if (query && !task.title.toLowerCase().includes(query) && !task.id.toLowerCase().includes(query)) return;
      map[task.difficulty][cat].push(task);
    });
    // Remove empty categories
    for (const diff of ['beginner', 'intermediate', 'advanced'] as Difficulty[]) {
      for (const cat of ['base', 'company', 'shop', 'analytics', 'exam'] as CategoryKey[]) {
        if (map[diff][cat].length === 0) {
          delete map[diff][cat];
        }
      }
    }
    return map;
  }, [showBookmarksOnly, bookmarkedIds, activeCategoryFilter, searchQuery]);

  // Get available categories for filter
  const availableCategories = useMemo(() => {
    const cats = new Set<CategoryKey>();
    cats.add('base');
    TRAINING_TASKS.forEach((task) => {
      if (task.category) cats.add(task.category);
    });
    return Array.from(cats);
  }, []);

  const toggleSection = (difficulty: Difficulty) => {
    setExpandedSections((prev) => ({
      ...prev,
      [difficulty]: !prev[difficulty],
    }));
  };

  const toggleCategory = (key: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Task row component
  const TaskRow = ({ task }: { task: TrainingTask }) => {
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
          aria-label={`${isDone ? '✓ ' : ''}${task.title}`}
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
          aria-label={isBookmarked ? t('action.removeFromBookmark') : t('action.addToBookmark')}
        >
          <Bookmark
            className={`h-3 w-3 ${isBookmarked ? 'fill-amber-500' : ''}`}
          />
        </button>
      </div>
    );
  };

  if (!sidebarOpen) return null;

  return (
    <div className="flex h-full flex-col">
      {/* Progress */}
      <div className="border-b border-border p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium flex items-center gap-1.5">
            <Target className="h-4 w-4 text-emerald-500" />
            {t('progress.label')}
          </span>
          <div className="flex items-center gap-1">
            <ReminderBell />
            <span className="text-xs text-muted-foreground">
              {completedCount}/{totalCount}
            </span>
          </div>
        </div>
        <Progress value={progressPercent} className="h-2" />
        <p className="mt-1.5 text-xs text-muted-foreground">
          {progressPercent === 100
            ? t('progress.complete')
            : `${Math.round(progressPercent)}% ${t('progress.percent')}`}
        </p>

        {/* Search */}
        <div className="relative mt-2">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t('sidebar.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-7 pr-7 text-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
              aria-label={t('sidebar.clearSearch', { default: 'Clear search' })}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Category filter */}
        <div className="mt-2 flex flex-wrap gap-1">
          <button
            onClick={() => setActiveCategoryFilter('all')}
            className={`rounded-md px-2 py-0.5 text-xs transition-colors ${
              activeCategoryFilter === 'all'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-medium'
                : 'text-muted-foreground hover:bg-muted/50'
            }`}
          >
            {t('sidebar.all')}
          </button>
          {availableCategories.map((cat) => {
            const IconCat = cat !== 'base' ? CATEGORY_ICONS[cat as TaskCategory] : null;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategoryFilter(cat)}
                className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-xs transition-colors ${
                  activeCategoryFilter === cat
                    ? CATEGORY_COLORS[cat] + ' font-medium'
                    : 'text-muted-foreground hover:bg-muted/50'
                }`}
              >
                {IconCat && <IconCat className="h-3 w-3" />}
                {CATEGORY_LABELS[cat]}
              </button>
            );
          })}
        </div>

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
          {showBookmarksOnly ? t('action.bookmarksOnly') : t('action.bookmarksAll')}
        </button>
      </div>

      {/* Tasks list */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {(
            ['beginner', 'intermediate', 'advanced'] as Difficulty[]
          ).map((difficulty) => {
            const catMap = tasksByDifficultyAndCategory[difficulty];
            const categories = Object.keys(catMap) as CategoryKey[];
            if (categories.length === 0) return null;

            const isExpanded = expandedSections[difficulty];
            const totalInDifficulty = categories.reduce(
              (sum, cat) => sum + catMap[cat].length, 0
            );
            const completedInDifficulty = categories.reduce(
              (sum, cat) => sum + catMap[cat].filter(t => completedIds.has(t.id)).length, 0
            );

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
                      {completedInDifficulty}/{totalInDifficulty}
                    </Badge>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </Button>
                {isExpanded && (
                  <div className="ml-2 space-y-1 border-l-2 border-border pl-2 py-1">
                    {categories.map((cat) => {
                      const tasks = catMap[cat];
                      const catKey = `${difficulty}-${cat}`;
                      const catIsExpanded = expandedCategories[catKey] !== false; // default expanded
                      const completedInCat = tasks.filter(t => completedIds.has(t.id)).length;

                      return (
                        <div key={cat} className="mb-0.5">
                          {categories.length > 1 && (
                            <button
                              onClick={() => toggleCategory(catKey)}
                              className="flex w-full items-center gap-1.5 rounded-md px-1 py-0.5 text-left text-xs transition-colors hover:bg-muted/50"
                            >
                              <Badge className={`text-[10px] px-1.5 flex items-center gap-1 ${CATEGORY_COLORS[cat]}`}>
                                {(() => {
                                  const IconComponent = cat !== 'base' ? CATEGORY_ICONS[cat as TaskCategory] : null;
                                  return IconComponent ? <IconComponent className="h-2.5 w-2.5" /> : null;
                                })()}
                                {CATEGORY_LABELS[cat]}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {completedInCat}/{tasks.length}
                              </span>
                              {tasks.length > 3 && (
                                catIsExpanded ? (
                                  <ChevronDown className="h-3 w-3 text-muted-foreground/60" />
                                ) : (
                                  <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
                                )
                              )}
                            </button>
                          )}
                          {(catIsExpanded || tasks.length <= 3 || categories.length === 1) && (
                            <div className="space-y-0.5">
                              {tasks.map((task) => (
                                <TaskRow key={task.id} task={task} />
                              ))}
                            </div>
                          )}
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
              {t('action.profile')}
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
          {t('action.freeMode')}
        </Button>
      </div>
    </div>
  );
}
