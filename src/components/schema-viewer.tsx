'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  Table as TableIcon,
  Key,
  Hash,
  Type,
  ToggleLeft,
  AlignLeft,
  Eye,
  ChevronDown,
  ChevronUp,
  GitBranch,
  List,
} from 'lucide-react';
import type { DatabaseInfo, TableInfo } from '@/lib/sql-engine';
import { t } from '@/lib/i18n';
import ERDiagram from '@/components/er-diagram';

interface SchemaViewerProps {
  schema: DatabaseInfo | null;
  onPreviewTable?: (tableName: string) => void;
}

function getTypeIcon(type: string) {
  const upper = type.toUpperCase();
  if (upper.includes('INT') || upper.includes('SERIAL')) return Hash;
  if (upper.includes('TEXT') || upper.includes('CHAR') || upper.includes('VARCHAR')) return Type;
  if (upper.includes('BOOL')) return ToggleLeft;
  if (upper.includes('REAL') || upper.includes('FLOAT') || upper.includes('NUMERIC') || upper.includes('DECIMAL'))
    return AlignLeft;
  return Type;
}

function getTypeColor(type: string) {
  const upper = type.toUpperCase();
  if (upper.includes('INT') || upper.includes('SERIAL')) return 'text-amber-600 dark:text-amber-400';
  if (upper.includes('TEXT') || upper.includes('CHAR') || upper.includes('VARCHAR'))
    return 'text-sky-600 dark:text-sky-400';
  if (upper.includes('BOOL')) return 'text-purple-600 dark:text-purple-400';
  if (upper.includes('REAL') || upper.includes('FLOAT') || upper.includes('NUMERIC') || upper.includes('DECIMAL'))
    return 'text-emerald-600 dark:text-emerald-400';
  return 'text-muted-foreground';
}

function getTablePlural(count: number): string {
  if (count === 1) return t('schemaViewer.table');
  if (count >= 2 && count <= 4) return t('schemaViewer.tables');
  return t('schemaViewer.tablesp');
}

function getColumnPlural(count: number): string {
  if (count === 1) return t('schemaViewer.column');
  if (count >= 2 && count <= 4) return t('schemaViewer.columns');
  return t('schemaViewer.columnsp');
}

export default function SchemaViewer({ schema, onPreviewTable }: SchemaViewerProps) {
  const [viewMode, setViewMode] = useState<'list' | 'diagram'>('list');

  if (!schema || schema.tables.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <TableIcon className="h-10 w-10 text-muted-foreground/30" />
        <div>
          <p className="text-sm text-muted-foreground">{t('schemaViewer.empty')}</p>
          <p className="mt-1 text-xs text-muted-foreground/70">{t('schemaViewer.emptyDesc')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-gradient-to-br from-muted/30 to-muted/10">
      <div className="border-b border-border/60 px-3.5 py-2.5 bg-gradient-to-b from-muted/50 to-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <TableIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{t('schemaViewer.title')}</h3>
              <p className="text-[10px] text-muted-foreground font-medium">
                {schema.tables.length} {getTablePlural(schema.tables.length)}
              </p>
            </div>
          </div>
          <div className="flex gap-1 rounded-lg bg-muted/50 p-0.5">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 w-7 p-0 rounded transition-all"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'diagram' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 w-7 p-0 rounded transition-all"
              onClick={() => setViewMode('diagram')}
            >
              <GitBranch className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <ScrollArea className="flex-1">
        {viewMode === 'diagram' ? (
          <div className="p-3">
            <ERDiagram schema={schema} />
          </div>
        ) : (
          <div className="space-y-2.5 p-3">
            {schema.tables.map((table) => (
              <TableCard key={table.name} table={table} onPreview={onPreviewTable} />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function TableCard({ table, onPreview }: { table: TableInfo; onPreview?: (tableName: string) => void }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-muted/60 to-muted/40 shadow-sm">
      <div className="px-3.5 py-2.5 bg-muted/50">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-emerald-100 dark:bg-emerald-900/30">
            <TableIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="text-sm font-semibold text-foreground">{table.name}</span>
          <Badge variant="secondary" className="ml-auto text-[10px] px-2 py-0.5 bg-muted/70 border-0 font-medium">
            {table.columns.length} {getColumnPlural(table.columns.length)}
          </Badge>
        </div>
      </div>
      <div className="px-3.5 pb-2.5 pt-1.5">
        <div className="space-y-1">
          {table.columns.map((col) => {
            const Icon = getTypeIcon(col.type);
            return (
              <div
                key={col.name}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs transition-all hover:bg-muted/60"
              >
                {col.primaryKey ? (
                  <div className="flex h-5 w-5 items-center justify-center rounded bg-amber-100 dark:bg-amber-900/30">
                    <Key className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                  </div>
                ) : (
                  <div className={`flex h-5 w-5 items-center justify-center rounded bg-muted/50`}>
                    <Icon className={`h-3 w-3 shrink-0 ${getTypeColor(col.type)}`} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <span className="font-mono text-xs font-medium text-foreground">{col.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {col.notNull && (
                    <Badge
                      variant="outline"
                      className="text-[9px] px-1 py-0 h-4 border-amber-200 text-amber-700 dark:border-amber-700 dark:text-amber-400 font-bold"
                    >
                      NN
                    </Badge>
                  )}
                  <span className={`font-mono text-[10px] font-medium ${getTypeColor(col.type)}`}>{col.type}</span>
                </div>
              </div>
            );
          })}
        </div>
        {onPreview && (
          <div className="mt-2.5 pt-2.5 border-t border-border/50">
            <Button
              variant="outline"
              size="sm"
              className="w-full h-9 hover:bg-muted/70 transition-all"
              onClick={() => {
                setIsExpanded(!isExpanded);
                onPreview(table.name);
              }}
            >
              <Eye className="mr-2 h-3.5 w-3.5" />
              <span className="text-xs font-medium">{t('schemaViewer.preview')}</span>
              {isExpanded ? (
                <ChevronUp className="ml-1.5 h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="ml-1.5 h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
