'use client';

import { useSQLTrainerStore } from '@/lib/store';
import { getTaskById, TRAINING_TASKS, DIFFICULTY_LABELS, DIFFICULTY_COLORS } from '@/lib/training-tasks';
import { t } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import QueryHistory from '@/components/query-history';
import SavedQueries from '@/components/saved-queries';
import SqlTemplates from '@/components/sql-templates';
import {
  Play,
  RotateCcw,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Search,
  Shuffle,
  Undo2,
  Redo2,
  CheckCircle2,
  Bookmark,
  History,
  ClipboardCopy,
} from 'lucide-react';

interface ActionBarProps {
  isExecuting: boolean;
  executeQuery: () => void;
  executeExplain: () => void;
  executeVerify?: () => void;
  clearEditor: () => void;
  resetDb: () => void;
  onRestoreQuery: (sql: string) => void;
  onLoadQuery: (sql: string) => void;
  onInsertTemplate: (sql: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  currentTaskId: string | null;
  practiceMode: { active: boolean; currentIndex: number; taskOrder: string[]; completedInSession: string[] };
}

export default function ActionBar({
  isExecuting,
  executeQuery,
  executeExplain,
  executeVerify,
  clearEditor,
  resetDb,
  onRestoreQuery,
  onLoadQuery,
  onInsertTemplate,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  currentTaskId,
  practiceMode,
}: ActionBarProps) {
  const { editorContent, queryHistory, setCurrentTaskId, bookmarkedTasks, toggleBookmark, clearHistory } =
    useSQLTrainerStore();
  const currentTask = currentTaskId ? getTaskById(currentTaskId) : null;
  const isBookmarked = currentTaskId ? bookmarkedTasks.includes(currentTaskId) : false;

  const taskIndex = currentTask ? TRAINING_TASKS.findIndex((t) => t.id === currentTask.id) : -1;
  const hasPrev = taskIndex > 0;
  const hasNext = taskIndex >= 0 && taskIndex < TRAINING_TASKS.length - 1;

  return (
    <div className="flex items-center gap-2 border-b border-border bg-gradient-to-b from-muted/40 to-muted/20 px-2 sm:px-4 py-2 overflow-x-auto">
      {practiceMode.active && (
        <div className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 px-2.5 sm:px-3 py-1.5 text-xs text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 shrink-0 shadow-sm">
          <Shuffle className="h-4 w-4" />
          <span className="font-semibold hidden sm:inline">
            {t('practice.title')}: {practiceMode.currentIndex + 1}/{practiceMode.taskOrder.length}
          </span>
          <span className="font-semibold sm:hidden">
            {practiceMode.currentIndex + 1}/{practiceMode.taskOrder.length}
          </span>
          <Badge
            variant="secondary"
            className="text-xs px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-0"
          >
            ✓ {practiceMode.completedInSession.length}
          </Badge>
        </div>
      )}

      {/* Primary action group */}
      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          className="h-8 sm:h-9 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800 gap-1.5 text-xs sm:text-sm px-3 sm:px-4 shadow-lg shadow-emerald-500/20 transition-all"
          onClick={executeQuery}
          disabled={isExecuting || !editorContent.trim()}
        >
          {isExecuting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          <span className="hidden sm:inline font-semibold">{t('action.executeShort')}</span>
          <kbd className="ml-1 hidden lg:inline-flex h-4 items-center rounded border border-white/20 bg-white/10 px-1.5 text-[10px] font-mono">
            Ctrl+↵
          </kbd>
        </Button>

        {currentTask && executeVerify && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs sm:text-sm border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all"
                onClick={executeVerify}
                disabled={isExecuting || !editorContent.trim()}
              >
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                <span className="hidden sm:inline font-medium">{t('action.verify')}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('action.verifyTooltip')}</TooltipContent>
          </Tooltip>
        )}

        {currentTask && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs sm:text-sm hover:bg-muted transition-all"
                onClick={executeExplain}
                disabled={isExecuting || !editorContent.trim()}
              >
                <Search className="mr-1 h-3.5 w-3.5" />
                <span className="hidden sm:inline font-medium">{t('action.explain')}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('action.explainTooltip')}</TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Separator */}
      <div className="h-6 w-px bg-border/60" />

      {/* Secondary action group */}
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs sm:text-sm hover:bg-muted/70 transition-all"
              onClick={onUndo}
              disabled={!canUndo}
            >
              <Undo2 className="h-4 w-4" />
              <kbd className="ml-1.5 h-3.5 items-center rounded border border-current/20 bg-current/10 px-1 text-[9px] font-mono hidden sm:inline-flex">
                Ctrl+Z
              </kbd>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{t('action.undo')}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs sm:text-sm hover:bg-muted/70 transition-all"
              onClick={onRedo}
              disabled={!canRedo}
            >
              <Redo2 className="h-4 w-4" />
              <kbd className="ml-1.5 h-3.5 items-center rounded border border-current/20 bg-current/10 px-1 text-[9px] font-mono hidden sm:inline-flex">
                Ctrl+Y
              </kbd>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{t('action.redo')}</TooltipContent>
        </Tooltip>

        <QueryHistory onRestoreQuery={onRestoreQuery} />

        <SavedQueries onLoadQuery={onLoadQuery} />

        {queryHistory.length > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs sm:text-sm hover:bg-muted/70 transition-all"
                onClick={() => {
                  if (window.confirm(t('action.clearHistoryConfirm', { default: 'Clear query history?' }))) {
                    clearHistory();
                  }
                }}
              >
                <History className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('action.clearHistory', { default: 'Clear history' })}</TooltipContent>
          </Tooltip>
        )}

        {!currentTask && <SqlTemplates onInsertTemplate={onInsertTemplate} />}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs sm:text-sm hover:bg-muted/70 transition-all"
              disabled={!editorContent.trim()}
              onClick={() => {
                navigator.clipboard.writeText(editorContent);
              }}
            >
              <ClipboardCopy className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('action.copySql', { default: 'Copy SQL' })}</TooltipContent>
        </Tooltip>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs sm:text-sm hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 transition-all"
          onClick={() => {
            if (
              editorContent.trim() &&
              !window.confirm(t('action.clearConfirm', { default: 'Clear the editor? Unsaved content will be lost.' }))
            )
              return;
            clearEditor();
          }}
        >
          <Trash2 className="mr-1 h-3.5 w-3.5" />
          <span className="hidden sm:inline font-medium">{t('action.clear')}</span>
        </Button>

        {currentTask && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs sm:text-sm hover:bg-amber-50 dark:hover:bg-amber-950/20 hover:text-amber-600 dark:hover:text-amber-400 transition-all"
            onClick={resetDb}
          >
            <RotateCcw className="mr-1 h-3.5 w-3.5" />
            <span className="hidden sm:inline font-medium">{t('action.resetDb')}</span>
          </Button>
        )}
      </div>

      {/* Right side: task info + navigation */}
      <div className="ml-auto flex items-center gap-2">
        {/* Character count */}
        {editorContent.length > 0 && (
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-1 rounded bg-muted/50">
            <span className="font-mono">{editorContent.length}</span>
            <span>chars</span>
          </div>
        )}

        {/* Query count indicator */}
        {queryHistory.length > 0 && (
          <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-1 rounded bg-muted/50">
            <span className="font-semibold">{queryHistory.length}</span>
            <span className="hidden lg:inline">{queryHistory.length === 1 ? 'query' : 'queries'}</span>
          </div>
        )}

        {/* Task progress indicator */}
        {currentTask && taskIndex >= 0 && (
          <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-1 rounded bg-muted/50">
            <span className="font-semibold">{taskIndex + 1}</span>
            <span>/</span>
            <span>{TRAINING_TASKS.length}</span>
          </div>
        )}

        {/* Bookmark toggle */}
        {currentTask && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 transition-all ${isBookmarked ? 'text-amber-500 hover:text-amber-600' : 'text-muted-foreground hover:text-amber-500'}`}
                onClick={() => toggleBookmark(currentTask.id)}
              >
                <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-amber-500' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isBookmarked ? t('action.removeFromBookmark') : t('action.addToBookmark')}</TooltipContent>
          </Tooltip>
        )}

        {/* Prev/Next task navigation */}
        {currentTask && (
          <div className="hidden sm:flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  disabled={!hasPrev}
                  onClick={() => {
                    if (hasPrev) setCurrentTaskId(TRAINING_TASKS[taskIndex - 1].id);
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('task.prev', { default: 'Previous task' })}</TooltipContent>
            </Tooltip>

            <Badge className={`${DIFFICULTY_COLORS[currentTask.difficulty]} text-[10px] px-2 py-0.5 shadow-sm`}>
              {DIFFICULTY_LABELS[currentTask.difficulty]}
            </Badge>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  disabled={!hasNext}
                  onClick={() => {
                    if (hasNext) setCurrentTaskId(TRAINING_TASKS[taskIndex + 1].id);
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('task.next', { default: 'Next task' })}</TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Task title badge */}
        {currentTask && (
          <Badge
            variant="outline"
            className="text-xs px-2 sm:px-3 py-1.5 bg-background border-border/70 shadow-sm hidden lg:flex"
          >
            <span className="font-medium max-w-[150px] truncate">{currentTask.title}</span>
          </Badge>
        )}
      </div>
    </div>
  );
}
