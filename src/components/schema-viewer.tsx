'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
          <p className="mt-1 text-xs text-muted-foreground/70">
            {t('schemaViewer.emptyDesc')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-3 py-2.5">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-medium">
            <TableIcon className="h-4 w-4 text-emerald-500" />
            {t('schemaViewer.title')}
          </h3>
          <div className="flex gap-1">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'diagram' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setViewMode('diagram')}
            >
              <GitBranch className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {schema.tables.length} {getTablePlural(schema.tables.length)}
        </p>
      </div>
      <ScrollArea className="flex-1">
        {viewMode === 'diagram' ? (
          <div className="p-3">
            <ERDiagram schema={schema} />
          </div>
        ) : (
          <div className="space-y-3 p-3">
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
    <Card className="overflow-hidden">
      <CardHeader className="px-3 py-2.5">
        <CardTitle className="flex items-center gap-2 text-sm">
          <TableIcon className="h-4 w-4 text-emerald-500" />
          {table.name}
          <Badge variant="secondary" className="ml-auto text-xs px-2">
            {table.columns.length} {getColumnPlural(table.columns.length)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3 pt-0">
        <div className="space-y-0.5">
          {table.columns.map((col) => {
            const Icon = getTypeIcon(col.type);
            return (
              <div
                key={col.name}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted/50"
              >
                {col.primaryKey ? (
                  <Key className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                ) : (
                  <Icon className={`h-3.5 w-3.5 shrink-0 ${getTypeColor(col.type)}`} />
                )}
                <span className="font-mono text-xs">{col.name}</span>
                {col.notNull && (
                  <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">NN</Badge>
                )}
                <span className={`ml-auto font-mono text-[10px] ${getTypeColor(col.type)}`}>
                  {col.type}
                </span>
              </div>
            );
          })}
        </div>
        {onPreview && (
          <div className="mt-2 flex gap-1.5 border-t border-border pt-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 flex-1 text-xs"
              onClick={() => {
                setIsExpanded(!isExpanded);
                onPreview(table.name);
              }}
            >
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              {t('schemaViewer.preview')}
              {isExpanded ? (
                <ChevronUp className="ml-1.5 h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="ml-1.5 h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
