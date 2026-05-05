'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table as TableIcon,
  Key,
  Hash,
  Type,
  ToggleLeft,
  AlignLeft,
} from 'lucide-react';
import type { DatabaseInfo, TableInfo, ColumnInfo } from '@/lib/sql-engine';
import { plural } from '@/lib/utils';

interface SchemaViewerProps {
  schema: DatabaseInfo | null;
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

export default function SchemaViewer({ schema }: SchemaViewerProps) {
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
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {schema.tables.length}{' '}
          {plural(schema.tables.length, 'таблица', 'таблицы', 'таблиц')}
        </p>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-3 p-3">
          {schema.tables.map((table) => (
            <TableCard key={table.name} table={table} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function TableCard({ table }: { table: TableInfo }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="px-3 py-2">
        <CardTitle className="flex items-center gap-1.5 text-sm">
          <TableIcon className="h-3.5 w-3.5 text-emerald-500" />
          {table.name}
          <Badge variant="secondary" className="ml-auto text-[10px] px-1.5">
            {table.columns.length} {plural(table.columns.length, 'поле', 'поля', 'полей')}
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
                <span className="font-mono text-xs">{col.name}</span>
                <span className={`ml-auto font-mono text-[10px] ${getTypeColor(col.type)}`}>
                  {col.type}
                </span>
                {col.notNull && (
                  <span className="text-[10px] text-muted-foreground">NN</span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
