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
  currentTaskId,
  practiceMode,
}: ActionBarProps) {
  const { editorContent } = useSQLTrainerStore();
  const currentTask = currentTaskId ? getTaskById(currentTaskId) : null;

  return (
    <div className="flex items-center gap-1.5 border-b border-border px-3 py-1.5">
      {practiceMode.active && (
        <div className="flex items-center gap-2 rounded-md bg-emerald-50 px-2 py-1 text-xs text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
          <Shuffle className="h-3.5 w-3.5" />
          <span className="font-medium">
            {t('practice.title')}: {practiceMode.currentIndex + 1}/{practiceMode.taskOrder.length}
          </span>
          <Badge variant="secondary" className="text-[10px] px-1.5">
            ✓ {practiceMode.completedInSession.length}
          </Badge>
        </div>
      )}

      <Button
        size="sm"
        className="h-7 bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 gap-1.5 text-xs px-3"
        onClick={executeQuery}
        disabled={isExecuting || !editorContent.trim()}
      >
        {isExecuting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Play className="h-3.5 w-3.5" />
        )}
        <span className="hidden sm:inline">{t('action.executeShort')}</span>
        <kbd className="ml-1 hidden sm:inline-flex h-5 items-center rounded border border-current/20 bg-current/10 px-1.5 text-[10px] font-mono">
          Ctrl+↵
        </kbd>
      </Button>

      {currentTask && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={executeExplain}
              disabled={isExecuting || !editorContent.trim()}
            >
              <Search className="mr-1 h-3 w-3" />
              <span className="hidden sm:inline">{t('action.explain')}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('action.explainTooltip')}</TooltipContent>
        </Tooltip>
      )}

      <QueryHistory onRestoreQuery={onRestoreQuery} />

      <SavedQueries onLoadQuery={onRestoreQuery} />

      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearEditor}>
        <Trash2 className="mr-1 h-3 w-3" />
        {t('action.clear')}
      </Button>

      {!currentTask && <SqlTemplates onInsertTemplate={onInsertTemplate} />}

      {currentTask && (
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={resetDb}>
          <RotateCcw className="mr-1 h-3 w-3" />
          {t('action.resetDb')}
        </Button>
      )}

      <div className="ml-auto flex items-center gap-1.5">
        {currentTask && (
          <Badge variant="outline" className="text-xs px-2">
            <ChevronRight className="mr-0.5 h-3 w-3" />
            {currentTask.title}
          </Badge>
        )}
      </div>
    </div>
  );
}
