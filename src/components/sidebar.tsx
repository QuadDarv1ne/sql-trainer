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
import { ACHIEVEMENTS } from '@/lib/store/gamification-slice';
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
  Star,
} from 'lucide-react';
import { CATEGORY_ICONS } from '@/lib/category-icons';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import ExportImportDialog from '@/components/export-import-dialog';
import { ReminderBell } from '@/components/reminders/reminder-bell';
import { Input } from '@/components/ui/input';

const CATEGORY_LABELS: Record<TaskCategory | 'base', string> = {
  base: 'category.base',
  company: 'category.company',
  shop: 'category.shop',
  analytics: 'category.analytics',
  exam: 'category.exam',
};

function categoryLabel(cat: TaskCategory | 'base'): string {
  return t(CATEGORY_LABELS[cat]);
}

const CATEGORY_COLORS: Record<TaskCategory | 'base', string> = {
  base: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  company: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
  shop: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400',
  analytics: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  exam: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
};

type CategoryKey = TaskCategory | 'base';

/** Standalone task row component — must be outside Sidebar to avoid re-mounting on every render */
function TaskRow({
  task,
  isActive,
  isDone,
  isBookmarked,
  onActivate,
  onToggleBookmark,
  t,
}: {
  task: TrainingTask;
  isActive: boolean;
  isDone: boolean;
  isBookmarked: boolean;
  onActivate: () => void;
  onToggleBookmark: () => void;
  t: (key: string) => string;
}) {
  return (
    <div className="flex w-full items-center gap-1 rounded-lg">
      <button
        onClick={onActivate}
        aria-label={`${isDone ? '✓ ' : ''}${task.title}`}
        className={`flex flex-1 items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-all ${
          isActive
            ? 'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm border border-blue-200/50 dark:border-blue-800/50'
            : 'text-foreground/80 hover:bg-muted/60 hover:pl-3.5'
        }`}
      >
        {isDone ? (
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
        ) : (
          <Circle className="h-4 w-4 shrink-0 text-muted-foreground/40" />
        )}
        <span className="leading-tight flex-1 font-medium">{task.title}</span>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleBookmark();
        }}
        className={`rounded-lg p-2 transition-all hover:scale-105 ${
          isBookmarked ? 'text-amber-500' : 'text-muted-foreground/40 hover:text-amber-500'
        }`}
        aria-label={isBookmarked ? t('action.removeFromBookmark') : t('action.addToBookmark')}
      >
        <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-amber-500' : ''}`} />
      </button>
    </div>
  );
}

export default function Sidebar() {
  const {
    currentTaskId,
    setCurrentTaskId,
    completedTasks,
    sidebarOpen,
    bookmarkedTasks,
    toggleBookmark,
    unlockedAchievements,
  } = useSQLTrainerStore();
  const { data: session } = useSession();

  const [expandedSections, setExpandedSections] = useState<Record<Difficulty, boolean>>({
    beginner: true,
    intermediate: true,
    advanced: true,
  });

  // Track which category sub-sections are expanded within each difficulty
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<CategoryKey | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const completedCount = completedTasks.length;
  const totalCount = TRAINING_TASKS.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const completedIds = useMemo(
    () => new Set(completedTasks.map((t: import('@/lib/store').CompletedTask) => t.taskId)),
    [completedTasks],
  );

  const bookmarkedIds = useMemo(() => new Set(bookmarkedTasks), [bookmarkedTasks]);

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
    // Filter out empty categories
    const result: Record<Difficulty, Partial<Record<CategoryKey, TrainingTask[]>>> = {
      beginner: {},
      intermediate: {},
      advanced: {},
    };
    for (const diff of ['beginner', 'intermediate', 'advanced'] as Difficulty[]) {
      for (const cat of ['base', 'company', 'shop', 'analytics', 'exam'] as CategoryKey[]) {
        if (map[diff][cat].length > 0) {
          result[diff][cat] = map[diff][cat];
        }
      }
    }
    return result as Record<Difficulty, Record<CategoryKey, TrainingTask[]>>;
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

  if (!sidebarOpen) return null;

  return (
    <div className="flex h-full flex-col bg-gradient-to-br from-muted/30 to-muted/10">
      {/* Progress */}
      <div className="border-b border-border/60 p-4 space-y-4 bg-gradient-to-b from-muted/50 to-muted/30">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold flex items-center gap-2 text-foreground">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Target className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            </div>
            {t('progress.label')}
          </span>
          <div className="flex items-center gap-2">
            <ReminderBell />
            <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-muted/70 border-0">
              {completedCount}/{totalCount}
            </Badge>
          </div>
        </div>
        <div className="relative">
          <Progress value={progressPercent} className="h-2.5" />
          {progressPercent === 100 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                100%
              </span>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground font-medium">
          {progressPercent === 100
            ? t('progress.complete')
            : `${Math.round(progressPercent)}% ${t('progress.percent')}`}
        </p>

        {/* Achievement progress */}
        <div className="flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 px-3.5 py-2.5 border border-amber-200/50 dark:border-amber-800/30">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <Star className="h-4 w-4 text-amber-500 shrink-0" />
          </div>
          <div className="flex-1">
            <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">
              {t('sidebar.achievements')}: <span className="font-bold">{unlockedAchievements.length}</span>/
              {Object.keys(ACHIEVEMENTS).length}
            </span>
          </div>
          {unlockedAchievements.length < Object.keys(ACHIEVEMENTS).length && (
            <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80 truncate max-w-[100px] text-right">
              →{' '}
              {(() => {
                const allKeys = Object.keys(ACHIEVEMENTS);
                const unlockedIds = new Set(unlockedAchievements.map((a: import('@/lib/store').Achievement) => a.id));
                const nextKey = allKeys.find((k) => !unlockedIds.has(ACHIEVEMENTS[k].id));
                return nextKey ? `${ACHIEVEMENTS[nextKey].icon}` : '';
              })()}
            </span>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t('sidebar.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 pl-10 pr-10 text-sm rounded-xl border-muted/50 focus:border-blue-500/50 focus:ring-blue-500/10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
              aria-label={t('sidebar.clearSearch', { default: 'Clear search' })}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategoryFilter('all')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              activeCategoryFilter === 'all'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
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
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  activeCategoryFilter === cat
                    ? CATEGORY_COLORS[cat] + ' shadow-sm'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {IconCat && <IconCat className="h-3.5 w-3.5" />}
                {categoryLabel(cat)}
              </button>
            );
          })}
        </div>

        {/* Bookmark filter */}
        <button
          onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
          className={`flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-all ${
            showBookmarksOnly
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Bookmark className={`h-3.5 w-3.5 ${showBookmarksOnly ? 'fill-white' : ''}`} />
          {showBookmarksOnly ? t('action.bookmarksOnly') : t('action.bookmarksAll')}
        </button>
      </div>

      {/* Tasks list */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1">
          {(['beginner', 'intermediate', 'advanced'] as Difficulty[]).map((difficulty) => {
            const catMap = tasksByDifficultyAndCategory[difficulty];
            const categories = Object.keys(catMap) as CategoryKey[];
            if (categories.length === 0) return null;

            const isExpanded = expandedSections[difficulty];
            const totalInDifficulty = categories.reduce((sum, cat) => sum + catMap[cat].length, 0);
            const completedInDifficulty = categories.reduce(
              (sum, cat) => sum + catMap[cat].filter((t) => completedIds.has(t.id)).length,
              0,
            );

            return (
              <div key={difficulty} className="mb-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between px-3 h-10 rounded-xl hover:bg-muted/70 transition-all"
                  onClick={() => toggleSection(difficulty)}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-lg ${
                        difficulty === 'beginner'
                          ? 'bg-emerald-100 dark:bg-emerald-900/30'
                          : difficulty === 'intermediate'
                            ? 'bg-blue-100 dark:bg-blue-900/30'
                            : 'bg-amber-100 dark:bg-amber-900/30'
                      }`}
                    >
                      <span
                        className={`text-xs font-bold ${
                          difficulty === 'beginner'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : difficulty === 'intermediate'
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {difficulty === 'beginner' ? '1' : difficulty === 'intermediate' ? '2' : '3'}
                      </span>
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-semibold text-foreground">{DIFFICULTY_LABELS[difficulty]}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-medium">
                          {completedInDifficulty}/{totalInDifficulty}
                        </span>
                        {totalInDifficulty > 0 && (
                          <div className="h-1 w-12 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                difficulty === 'beginner'
                                  ? 'bg-emerald-500'
                                  : difficulty === 'intermediate'
                                    ? 'bg-blue-500'
                                    : 'bg-amber-500'
                              }`}
                              style={{ width: `${(completedInDifficulty / totalInDifficulty) * 100}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
                {isExpanded && (
                  <div className="ml-2 space-y-1 border-l-2 border-border/40 pl-3 py-2">
                    {categories.map((cat) => {
                      const tasks = catMap[cat];
                      const catKey = `${difficulty}-${cat}`;
                      const catIsExpanded = expandedCategories[catKey] !== false;
                      const completedInCat = tasks.filter((t) => completedIds.has(t.id)).length;

                      return (
                        <div key={cat} className="mb-0.5">
                          {categories.length > 1 && (
                            <button
                              onClick={() => toggleCategory(catKey)}
                              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs transition-all hover:bg-muted/60 hover:pl-3.5 group"
                            >
                              <Badge
                                className={`text-xs px-2.5 py-0.5 flex items-center gap-1.5 shadow-sm ${CATEGORY_COLORS[cat]}`}
                              >
                                {(() => {
                                  const IconComponent = cat !== 'base' ? CATEGORY_ICONS[cat as TaskCategory] : null;
                                  return IconComponent ? <IconComponent className="h-3.5 w-3.5" /> : null;
                                })()}
                                <span className="font-semibold">{categoryLabel(cat)}</span>
                              </Badge>
                              <span className="text-xs text-muted-foreground font-medium">
                                {completedInCat}/{tasks.length}
                              </span>
                              {tasks.length > 3 && (
                                <div className="ml-auto">
                                  {catIsExpanded ? (
                                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-foreground transition-colors" />
                                  ) : (
                                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-foreground transition-colors" />
                                  )}
                                </div>
                              )}
                            </button>
                          )}
                          {(catIsExpanded || tasks.length <= 3 || categories.length === 1) && (
                            <div className="space-y-1 mt-1.5">
                              {tasks.map((task) => (
                                <TaskRow
                                  key={task.id}
                                  task={task}
                                  isActive={task.id === currentTaskId}
                                  isDone={completedIds.has(task.id)}
                                  isBookmarked={bookmarkedIds.has(task.id)}
                                  onActivate={() => setCurrentTaskId(task.id)}
                                  onToggleBookmark={() => toggleBookmark(task.id)}
                                  t={t}
                                />
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
      <div className="border-t border-border/60 p-4 space-y-2.5 bg-gradient-to-t from-muted/40 to-muted/20">
        <ExportImportDialog />

        {session?.user && (
          <Button
            variant="outline"
            size="sm"
            className="w-full h-10 rounded-xl hover:bg-muted/70 transition-all"
            asChild
          >
            <Link href="/profile">
              <User className="mr-2.5 h-4 w-4" />
              <span className="font-medium">{t('action.profile')}</span>
            </Link>
          </Button>
        )}
        <Button
          variant={currentTaskId === null ? 'default' : 'outline'}
          size="sm"
          className={`w-full h-10 rounded-xl transition-all ${
            currentTaskId === null
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/25'
              : 'hover:bg-muted/70'
          }`}
          onClick={() => setCurrentTaskId(null)}
        >
          <GraduationCap className={`mr-2.5 h-4 w-4 ${currentTaskId === null ? 'text-white' : ''}`} />
          <span className="font-medium">{t('action.freeMode')}</span>
        </Button>
      </div>
    </div>
  );
}
