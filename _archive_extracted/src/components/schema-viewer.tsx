'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Table as TableIcon,
  Key,
  Hash,
  Type,
  ToggleLeft,
  AlignLeft,
} from 'lucide-react';
import type { DatabaseInfo, TableInfo, ColumnInfo } from '@/lib/sql-engine';

interface SchemaViewerProps {
  schema: DatabaseInfo | null;
  onInsertText?: (text: string) => void;
}

function getTypeIcon(type: string) {
  const upper = type.toUpperCase();
  if (upper.includes('INT') || upper.includes('SERIAL')) return Hash;
  if (upper.includes('TEXT') || upper.includes('CHAR') || upper.includes('VARCHAR')) return Type;
  if (upper.includes('BOOL')) return ToggleLeft;
  if (upper.includes('REAL') || upper.includes('FLOAT') || upper.includes('NUMERIC') || upper.includes('DECIMAL')) return AlignLeft;
  return Type;
}

function getTypeColor(type: string) {
  const upper = type.toUpperCase();
  if (upper.includes('INT') || upper.includes('SERIAL'))
    return 'text-amber-600 dark:text-amber-400';
  if (upper.includes('TEXT') || upper.includes('CHAR') || upper.includes('VARCHAR'))
    return 'text-sky-600 dark:text-sky-400';
  if (upper.includes('BOOL'))
    return 'text-purple-600 dark:text-purple-400';
  if (upper.includes('REAL') || upper.includes('FLOAT') || upper.includes('NUMERIC') || upper.includes('DECIMAL'))
    return 'text-emerald-600 dark:text-emerald-400';
  return 'text-muted-foreground';
}

export default function SchemaViewer({ schema, onInsertText }: SchemaViewerProps) {
  if (!schema || schema.tables.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <TableIcon className="h-10 w-10 text-muted-foreground/30" />
        <div>
          <p className="text-sm text-muted-foreground">Схема базы данных</p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            Выберите задание или выполните CREATE TABLE
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-4 py-3">
        <h3 className="flex items-center gap-1.5 text-sm font-medium">
          <TableIcon className="h-4 w-4 text-emerald-500" />
          Структура базы данных
          {onInsertText && (
            <span className="ml-auto text-[10px] text-muted-foreground/60">Нажмите для вставки</span>
          )}
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {schema.tables.length}{' '}
          {schema.tables.length === 1 ? 'таблица' : schema.tables.length < 5 ? 'таблицы' : 'таблиц'}
        </p>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-3 p-3">
          {schema.tables.map((table) => (
            <TableCard key={table.name} table={table} onInsertText={onInsertText} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function TableCard({ table, onInsertText }: { table: TableInfo; onInsertText?: (text: string) => void }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="px-3 py-2">
        <CardTitle className="flex items-center gap-1.5 text-sm">
          <TableIcon className="h-3.5 w-3.5 text-emerald-500" />
          {onInsertText ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onInsertText(table.name)}
                  className="font-medium text-left hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  {table.name}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                Нажмите для вставки
              </TooltipContent>
            </Tooltip>
          ) : (
            <span>{table.name}</span>
          )}
          <Badge variant="secondary" className="ml-auto text-[10px] px-1.5">
            {table.columns.length} {table.columns.length === 1 ? 'поле' : table.columns.length < 5 ? 'поля' : 'полей'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-2 pt-0">
        <div className="space-y-0.5">
          {table.columns.map((col) => {
            const Icon = getTypeIcon(col.type);
            return (
              <div
                key={col.name}
                className="flex items-center gap-1.5 rounded px-1.5 py-0.5 text-xs hover:bg-muted/50"
              >
                {col.primaryKey ? (
                  <Key className="h-3 w-3 shrink-0 text-amber-500" />
                ) : (
                  <Icon className={`h-3 w-3 shrink-0 ${getTypeColor(col.type)}`} />
                )}
                {onInsertText ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onInsertText(`${table.name}.${col.name}`)}
                        className="font-mono text-xs text-left hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer flex-1 truncate"
                      >
                        {col.name}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      Нажмите для вставки
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <span className="font-mono text-xs truncate flex-1">{col.name}</span>
                )}
                <span className={`font-mono text-[10px] shrink-0 ${getTypeColor(col.type)}`}>
                  {col.type}
                </span>
                {col.notNull && (
                  <span className="text-[10px] text-muted-foreground shrink-0">NN</span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
