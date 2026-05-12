'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Clock, AlertTriangle, Copy, Download, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { plural } from '@/lib/utils';
import type { VerificationResult } from '@/lib/store';

interface ResultsTableProps {
  success: boolean;
  columns: string[];
  rows: Record<string, unknown>[];
  error?: string;
  executionTime: number;
  message?: string;
  verification?: VerificationResult;
}

export default function ResultsTable({
  success,
  columns,
  rows,
  error,
  executionTime,
  message,
  verification,
}: ResultsTableProps) {
  if (!success && error) {
    return (
      <div className="flex h-full flex-col gap-3 p-4">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <span className="font-medium">Ошибка выполнения запроса:</span>
            <pre className="mt-2 whitespace-pre-wrap break-words rounded-md bg-destructive/10 p-3 text-sm font-mono">
              {error}
            </pre>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (columns.length === 0 && rows.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center">
        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        {message && (
          <p className="text-sm text-muted-foreground">{message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          DDL операция выполнена успешно
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Verification banner */}
      {verification && (
        <div
          className={`px-4 py-2.5 flex items-center gap-2 border-b text-sm font-medium ${
            verification.verified
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400'
              : 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400'
          }`}
        >
          {verification.verified ? (
            <ShieldCheck className="h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          )}
          <span>{verification.message}</span>
        </div>
      )}

      {/* Result header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span className="text-sm font-medium">
            {rows.length} {plural(rows.length, 'строка', 'строки', 'строк')}
          </span>
          {columns.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {columns.length} {plural(columns.length, 'столбец', 'столбца', 'столбцов')}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => copyResults(columns, rows)}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Копировать результат"
            aria-label="Копировать результат"
          >
            <Copy className="h-3 w-3" />
          </button>
          <button
            onClick={() => exportCSV(columns, rows)}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Экспорт CSV"
            aria-label="Экспорт CSV"
          >
            <Download className="h-3 w-3" />
          </button>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {executionTime.toFixed(1)} мс
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12 text-center text-xs font-medium text-muted-foreground">#</TableHead>
              {columns.map((col) => (
                <TableHead
                  key={col}
                  className="whitespace-nowrap text-xs font-medium text-emerald-600 dark:text-emerald-400"
                >
                  {col}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="h-24 text-center text-muted-foreground">
                  Нет данных
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, idx) => (
                <TableRow key={idx} className="text-sm">
                  <TableCell className="text-center text-xs text-muted-foreground">
                    {idx + 1}
                  </TableCell>
                  {columns.map((col) => (
                    <TableCell key={col} className="whitespace-nowrap font-mono text-xs">
                      {formatCellValue(row[col])}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer message */}
      {message && (
        <div className="border-t border-border px-4 py-2">
          <p className="text-xs text-muted-foreground">{message}</p>
        </div>
      )}
    </div>
  );
}

function copyResults(columns: string[], rows: Record<string, unknown>[]) {
  const header = columns.join('\t');
  const data = rows.map(row =>
    columns.map(col => formatCellValue(row[col])).join('\t')
  ).join('\n');
  navigator.clipboard.writeText(header + '\n' + data).then(() => {
    toast.success('Результат скопирован в буфер обмена');
  });
}

function exportCSV(columns: string[], rows: Record<string, unknown>[]) {
  const header = columns.map(c => `"${c}"`).join(',');
  const data = rows.map(row =>
    columns.map(col => {
      const val = formatForCSV(row[col]);
      return val.includes(',') || val.includes('"')
        ? `"${val.replace(/"/g, '""')}"`
        : val;
    }).join(',')
  ).join('\n');
  const csv = '\uFEFF' + header + '\n' + data;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'query_result.csv';
  a.click();
  URL.revokeObjectURL(url);
  toast.success('CSV файл скачан');
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return value.toLocaleString('ru-RU');
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function formatForCSV(value: unknown): string {
  if (value === null || value === undefined) return '';
  return formatCellValue(value);
}
