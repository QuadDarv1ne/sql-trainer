'use client';

import { useSQLTrainerStore } from '@/lib/store';
import { getTaskById } from '@/lib/training-tasks';
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
  Loader2,
  Search,
  Shuffle,
  Undo2,
  Redo2,
} from 'lucide-react';

interface ActionBarProps {
  isExecuting: boolean;
  executeQuery: () => void;
  executeExplain: () => void;
  clearEditor: () => void;
  resetDb: () => void;
  onRestoreQuery: (sql: string) => void;
  onLoadQuery: (sql: string) => void;
  onInsertTemplate: (sql: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  currentTaskId: string | null;
  practiceMode: { active: boolean; currentIndex: number; taskOrder: string[]; completedInSession: string[] };
}

export default function ActionBar({
  isExecuting,
  executeQuery,
  executeExplain,
  clearEditor,
  resetDb,
  onRestoreQuery,
  onLoadQuery,
  onInsertTemplate,
  onUndo,
  onRedo,
  currentTaskId,
  practiceMode,
}: ActionBarProps) {
  const { editorContent } = useSQLTrainerStore();
  const currentTask = currentTaskId ? getTaskById(currentTaskId) : null;

  return (
    <div className="flex items-center gap-2 border-b border-border bg-muted/20 px-3 py-2 overflow-x-auto">
      {practiceMode.active && (
        <div className="flex items-center gap-2 rounded-md bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0">
          <Shuffle className="h-4 w-4" />
          <span className="font-medium">
            {t('practice.title')}: {practiceMode.currentIndex + 1}/{practiceMode.taskOrder.length}
          </span>
          <Badge variant="secondary" className="text-xs px-2">
            ✓ {practiceMode.completedInSession.length}
          </Badge>
        </div>
      )}

      {/* Primary action group */}
      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          className="h-9 bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 gap-1.5 text-xs px-3 sm:h-8"
          onClick={executeQuery}
          disabled={isExecuting || !editorContent.trim()}
        >
          {isExecuting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">{t('action.executeShort')}</span>
          <kbd className="ml-1 hidden sm:inline-flex h-4 items-center rounded border border-current/20 bg-current/10 px-1.5 text-[10px] font-mono">
            Ctrl+↵
          </kbd>
        </Button>

        {currentTask && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={executeExplain}
                disabled={isExecuting || !editorContent.trim()}
              >
                <Search className="mr-1 h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('action.explain')}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('action.explainTooltip')}</TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Separator */}
      <div className="h-6 w-px bg-border/50" />

      {/* Secondary action group */}
      <div className="flex items-center gap-1.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 text-xs sm:h-8"
              onClick={onUndo}
            >
              <Undo2 className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              <kbd className="ml-1.5 h-4 items-center rounded border border-current/20 bg-current/10 px-1 text-[9px] font-mono hidden sm:inline-flex">
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
              className="h-9 text-xs sm:h-8"
              onClick={onRedo}
            >
              <Redo2 className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              <kbd className="ml-1.5 h-4 items-center rounded border border-current/20 bg-current/10 px-1 text-[9px] font-mono hidden sm:inline-flex">
                Ctrl+Y
              </kbd>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{t('action.redo')}</TooltipContent>
        </Tooltip>

        <QueryHistory onRestoreQuery={onRestoreQuery} />

        <SavedQueries onLoadQuery={onRestoreQuery} />

        {!currentTask && <SqlTemplates onInsertTemplate={onInsertTemplate} />}

        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={clearEditor}>
          <Trash2 className="mr-1 h-3.5 w-3.5" />
          {t('action.clear')}
        </Button>

        {currentTask && (
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={resetDb}>
            <RotateCcw className="mr-1 h-3.5 w-3.5" />
            {t('action.resetDb')}
          </Button>
        )}
      </div>

      {/* Right side: task badge */}
      <div className="ml-auto flex items-center gap-2">
        {currentTask && (
          <Badge variant="outline" className="text-xs px-2.5 py-1">
            <ChevronRight className="mr-1 h-3.5 w-3.5" />
            {currentTask.title}
          </Badge>
        )}
      </div>
    </div>
  );
}
