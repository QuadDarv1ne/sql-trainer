'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Copy,
  Download,
  ShieldCheck,
  Lightbulb,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import { t } from '@/lib/i18n';
import { plural } from '@/lib/utils';
import type { VerificationResult } from '@/lib/store';
import QueryResultChart from '@/components/query-result-chart';

interface ResultsTableProps {
  success: boolean;
  columns: string[];
  rows: Record<string, unknown>[];
  error?: string;
  executionTime: number;
  message?: string;
  verification?: VerificationResult;
  suggestion?: string;
  isExecuting?: boolean;
}

type SortDirection = 'asc' | 'desc' | null;

export default function ResultsTable({
  success,
  columns,
  rows,
  error,
  executionTime,
  message,
  verification,
  suggestion,
  isExecuting = false,
}: ResultsTableProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [chartView, setChartView] = useState(false);
  const pageSize = 100;

  // Reset page when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [rows]);

  const handleSort = useCallback(
    (col: string) => {
      if (sortColumn === col) {
        if (sortDirection === 'asc') {
          setSortDirection('desc');
        } else if (sortDirection === 'desc') {
          setSortDirection(null);
          setSortColumn(null);
        } else {
          setSortDirection('asc');
        }
      } else {
        setSortColumn(col);
        setSortDirection('asc');
      }
    },
    [sortColumn, sortDirection],
  );

  const sortedRows = useMemo(() => {
    if (!sortColumn || !sortDirection || rows.length === 0) return rows;
    return [...rows].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      if (aVal === null || aVal === undefined) return sortDirection === 'asc' ? -1 : 1;
      if (bVal === null || bVal === undefined) return sortDirection === 'asc' ? 1 : -1;
      let comparison = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal), 'ru');
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [rows, sortColumn, sortDirection]);

  const paginatedRows = useMemo(() => {
    return sortedRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [sortedRows, currentPage]);

  const totalPages = Math.ceil(sortedRows.length / pageSize);

  const copyResults = useCallback(() => {
    const header = columns.join('\t');
    const data = sortedRows.map((row) => columns.map((col) => formatCellValue(row[col])).join('\t')).join('\n');
    navigator.clipboard.writeText(header + '\n' + data).then(() => {
      toast.success(t('results.copied'));
    });
  }, [columns, sortedRows]);

  const exportCSV = useCallback(() => {
    const header = columns.map((c) => `"${c}"`).join(',');
    const data = sortedRows
      .map((row) =>
        columns
          .map((col) => {
            const val = formatForCSV(row[col]);
            return val.includes(',') || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;
          })
          .join(','),
      )
      .join('\n');
    const csv = '\uFEFF' + header + '\n' + data;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'query_result.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('results.downloaded'));
  }, [columns, sortedRows]);

  if (!success && error) {
    return (
      <div className="flex h-full flex-col gap-3 p-4">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <span className="font-medium">{t('results.queryError')}</span>
            <pre className="mt-2 whitespace-pre-wrap break-words rounded-md bg-destructive/10 p-3 text-sm font-mono">
              {error}
            </pre>
            {suggestion && (
              <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50/50 p-3 dark:border-amber-700 dark:bg-amber-950/20">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <div>
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-400">{t('results.hint')}</span>
                  <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">{suggestion}</p>
                </div>
              </div>
            )}
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
          <div className="flex flex-col gap-2 items-center">
            <p className="text-sm text-muted-foreground">{message}</p>
            {verification && (
              <p
                className={`text-sm font-medium ${
                  verification.verified
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {verification.message}
              </p>
            )}
          </div>
        )}
        {!message && <p className="text-xs text-muted-foreground">{t('results.ddlSuccess')}</p>}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-card rounded-lg overflow-hidden border border-border/50 shadow-sm">
      {/* Loading state */}
      {isExecuting && (
        <div className="flex flex-1 items-center justify-center border-b border-border px-3 sm:px-4 py-8 sm:py-12">
          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
            <Clock className="h-4 w-4 animate-spin" />
            <span>{t('results.executing')}</span>
          </div>
        </div>
      )}

      {/* Verification banner */}
      {verification && (
        <div
          className={`px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2 text-xs sm:text-sm font-medium border-b ${
            verification.verified
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400'
              : 'bg-amber-50/80 border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-400'
          }`}
        >
          {verification.verified ? (
            <ShieldCheck className="h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          )}
          <span className="line-clamp-2">{verification.message}</span>
        </div>
      )}

      {/* Result header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border bg-muted/30 px-3 sm:px-4 py-2 gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="text-sm font-semibold text-foreground">
            {rows.length} {plural(rows.length, 'строка', 'строки', 'строк')}
          </span>
          {columns.length > 0 && (
            <Badge variant="secondary" className="text-xs px-2 py-0.5">
              {columns.length} {plural(columns.length, 'столбец', 'столбца', 'столбцов')}
            </Badge>
          )}
          {sortColumn && sortDirection && (
            <Badge variant="outline" className="text-xs px-2 py-0.5">
              {t('results.sorting')}: {sortColumn} {sortDirection === 'asc' ? '↑' : '↓'}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={copyResults}
            className="flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground transition-all hover:bg-muted hover:text-foreground hover:scale-105"
            title={t('results.copyAll')}
            aria-label={t('results.copyAll')}
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground transition-all hover:bg-muted hover:text-foreground hover:scale-105"
            title={t('results.exportCSV')}
            aria-label={t('results.exportCSV')}
          >
            <Download className="h-4 w-4" />
          </button>
          {columns.length >= 2 && (
            <button
              onClick={() => setChartView(!chartView)}
              className={`flex items-center justify-center h-8 w-8 rounded-lg transition-all hover:scale-105 ${
                chartView
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              title={t('results.visualization')}
              aria-label={t('results.visualization')}
            >
              <BarChart3 className="h-4 w-4" />
            </button>
          )}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-1 rounded bg-muted/50">
            <Clock className="h-3 w-3" />
            {executionTime.toFixed(1)} {t('results.ms')}
          </div>
        </div>
      </div>

      {/* Table or Chart */}
      <div className="flex-1 overflow-auto bg-card">
        {chartView ? (
          <QueryResultChart columns={columns} rows={sortedRows} onClose={() => setChartView(false)} />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b-2 border-muted bg-muted/50 hover:bg-muted/50">
                  <TableHead className="w-12 text-center text-xs font-semibold text-muted-foreground">#</TableHead>
                  {columns.map((col) => {
                    const isSorted = sortColumn === col;
                    const dir = isSorted ? sortDirection : null;
                    return (
                      <TableHead
                        key={col}
                        className={`whitespace-nowrap text-xs sm:text-sm font-semibold cursor-pointer select-none transition-colors px-2 sm:px-3 py-2 ${
                          isSorted
                            ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                        onClick={() => handleSort(col)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleSort(col);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        title={t('results.sortClick')}
                        aria-label={t('results.sortByColumn', {
                          col,
                          state:
                            isSorted && dir === 'asc'
                              ? t('results.sortAsc')
                              : isSorted && dir === 'desc'
                                ? t('results.sortDesc')
                                : t('results.sortNone'),
                        })}
                      >
                        <div className="flex items-center gap-1">
                          {col}
                          {dir === 'asc' && <ArrowUp className="h-3 w-3" />}
                          {dir === 'desc' && <ArrowDown className="h-3 w-3" />}
                          {!dir && <ArrowUpDown className="h-3 w-3 opacity-40" />}
                        </div>
                      </TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length + 1} className="h-24 text-center text-muted-foreground">
                      {t('results.noData')}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRows.map((row, idx) => (
                    <TableRow
                      key={`page-${currentPage}-row-${idx}-${JSON.stringify(Object.values(row)).slice(0, 20)}`}
                      className="text-sm hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="text-center text-xs font-medium text-muted-foreground">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </TableCell>
                      {columns.map((col) => (
                        <TableCell key={col} className="whitespace-nowrap font-mono text-xs sm:text-sm py-2.5 px-2 sm:px-3">
                          {formatCellValue(row[col])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!chartView && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-border bg-muted/30 px-3 sm:px-4 py-2 gap-2">
          <span className="text-xs sm:text-sm text-muted-foreground font-medium">
            {t('results.showing', {
              start: String((currentPage - 1) * pageSize + 1),
              end: String(Math.min(currentPage * pageSize, sortedRows.length)),
              total: String(sortedRows.length),
            })}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label={t('results.prev')}
              className="rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-all disabled:opacity-40 hover:bg-background disabled:hover:bg-transparent border border-border"
            >
              {t('results.prev')}
            </button>
            <span className="px-3 py-1.5 text-xs sm:text-sm font-medium bg-background border border-border rounded-lg">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              aria-label={t('results.next')}
              className="rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-all disabled:opacity-40 hover:bg-background disabled:hover:bg-transparent border border-border"
            >
              {t('results.next')}
            </button>
          </div>
        </div>
      )}

      {/* Footer message */}
      {message && (
        <div className="border-t border-border bg-muted/20 px-3 sm:px-4 py-2">
          <p className="text-xs text-muted-foreground">{message}</p>
        </div>
      )}
    </div>
  );
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
