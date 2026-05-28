'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { useSQLTrainerStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import { History, CheckCircle2, XCircle, Clock, RotateCcw } from 'lucide-react';
import { plural } from '@/lib/utils';
interface QueryHistoryProps {
  onRestoreQuery: (sql: string) => void;
}

export default function QueryHistory({ onRestoreQuery }: QueryHistoryProps) {
  const { queryHistory, clearHistory } = useSQLTrainerStore();

  const recentHistory = queryHistory.slice(0, 10);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const truncateSql = (sql: string, maxLen = 50) => {
    if (sql.length <= maxLen) return sql;
    return sql.substring(0, maxLen) + '...';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 text-xs" disabled={recentHistory.length === 0}>
          <History className="mr-1 h-3.5 w-3.5" />
          {t('action.history')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 max-h-96">
        <DropdownMenuLabel className="flex items-center justify-between px-3 py-2">
          <span className="text-sm font-medium">{t('action.queryHistory')}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              clearHistory();
            }}
          >
            <RotateCcw className="mr-1.5 h-3 w-3" />
            {t('action.clear')}
          </Button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {recentHistory.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            {t('history.empty')}
          </div>
        ) : (
          recentHistory.map((entry, idx) => (
            <DropdownMenuItem
              key={entry.timestamp + '-' + idx}
              className="flex flex-col items-start gap-1.5 py-2.5 px-3 cursor-pointer"
              onClick={() => onRestoreQuery(entry.sql)}
              aria-label={t('history.restoreQuery', { sql: truncateSql(entry.sql, 40) })}
            >
              <div className="flex w-full items-center gap-2">
                {entry.success ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                ) : (
                  <XCircle className="h-4 w-4 shrink-0 text-red-500" />
                )}
                <code className="flex-1 truncate text-xs font-mono">
                  {truncateSql(entry.sql)}
                </code>
                <span className="shrink-0 text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTime(entry.timestamp)}
                </span>
              </div>
              <div className="flex w-full items-center gap-2 pl-6 text-xs text-muted-foreground">
                <span>{entry.executionTime.toFixed(1)} {t('results.ms')}</span>
                {entry.rowCount !== undefined && (
                  <span>• {entry.rowCount} {plural(entry.rowCount, 'строка', 'строки', 'строк')}</span>
                )}
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
