'use client';

import { useState, useMemo } from 'react';
import { useSQLTrainerStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  History,
  Play,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QueryHistoryPanelProps {
  onLoadQuery: (sql: string) => void;
}

export default function QueryHistoryPanel({ onLoadQuery }: QueryHistoryPanelProps) {
  const { queryHistory, clearHistory } = useSQLTrainerStore();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const filteredHistory = useMemo(() => {
    if (!search) return queryHistory;
    return queryHistory.filter(
      (entry) =>
        entry.sql.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, queryHistory]);

  const handleLoadQuery = (sql: string) => {
    onLoadQuery(sql);
    setOpen(false);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMs / 3600000);

    if (diffMin < 1) return 'только что';
    if (diffMin < 60) return `${diffMin} мин. назад`;
    if (diffHour < 24) return `${diffHour} ч. назад`;

    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateSQL = (sql: string, maxLen = 80) => {
    if (sql.length <= maxLen) return sql;
    return sql.substring(0, maxLen) + '...';
  };

  const successCount = queryHistory.filter((e) => e.success).length;
  const failCount = queryHistory.filter((e) => !e.success).length;
  const avgTime =
    queryHistory.length > 0
      ? queryHistory.reduce((sum, e) => sum + e.executionTime, 0) / queryHistory.length
      : 0;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 text-xs relative">
          <History className="h-3.5 w-3.5 mr-1" />
          <span className="hidden sm:inline">История</span>
          {queryHistory.length > 0 && (
            <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-muted px-1 text-[10px] font-medium">
              {queryHistory.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 sm:w-96 p-0 flex flex-col">
        <SheetHeader className="border-b border-border px-4 py-3 shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-sm flex items-center gap-2">
              <History className="h-4 w-4" />
              История запросов
            </SheetTitle>
            {queryHistory.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={clearHistory}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Очистить историю</TooltipContent>
              </Tooltip>
            )}
          </div>
        </SheetHeader>

        {/* Stats bar */}
        {queryHistory.length > 0 && (
          <div className="flex items-center gap-3 border-b border-border px-4 py-2 text-xs shrink-0">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              {successCount}
            </span>
            {failCount > 0 && (
              <span className="flex items-center gap-1 text-red-500">
                <XCircle className="h-3 w-3" />
                {failCount}
              </span>
            )}
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              {avgTime.toFixed(1)} мс ср.
            </span>
          </div>
        )}

        {/* Search */}
        {queryHistory.length > 5 && (
          <div className="border-b border-border px-4 py-2 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Поиск по истории..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-8 py-1.5 text-xs outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
        )}

        {/* History list */}
        <ScrollArea className="flex-1">
          {filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 px-4 text-center">
              <div className="rounded-full bg-muted p-3">
                <History className="h-6 w-6 text-muted-foreground/40" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {search ? 'Ничего не найдено' : 'История пуста'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  {search
                    ? 'Попробуйте изменить поисковый запрос'
                    : 'Выполните запрос, чтобы он появился здесь'}
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border">
              <AnimatePresence mode="popLayout">
                {filteredHistory.map((entry, idx) => (
                  <motion.div
                    key={`${entry.timestamp}-${idx}`}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.15 }}
                    className="group px-4 py-2.5 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      {/* Status icon */}
                      <div className="mt-0.5 shrink-0">
                        {entry.success ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-red-500" />
                        )}
                      </div>

                      {/* SQL preview */}
                      <div className="flex-1 min-w-0">
                        <pre className="text-xs font-mono leading-relaxed whitespace-pre-wrap break-words text-foreground/90">
                          {truncateSQL(entry.sql, 120)}
                        </pre>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                          <span>{formatTime(entry.timestamp)}</span>
                          <span className="flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" />
                            {entry.executionTime.toFixed(1)} мс
                          </span>
                          {entry.rowCount !== undefined && (
                            <span>{entry.rowCount} строк</span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleLoadQuery(entry.sql)}
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Загрузить в редактор</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
