'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Download,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface VerificationInfo {
  verified: boolean;
  userRowCount: number;
  expectedRowCount: number;
  message: string;
}

interface ResultsTableProps {
  success: boolean;
  columns: string[];
  rows: Record<string, unknown>[];
  error?: string;
  executionTime: number;
  message?: string;
  verification?: VerificationInfo | null;
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
  const [copied, setCopied] = useState(false);
  const [showFullError, setShowFullError] = useState(false);

  const copyResultsAsCSV = async () => {
    if (columns.length === 0 && rows.length === 0) return;

    const header = columns.join('\t');
    const data = rows
      .map((row) => columns.map((col) => formatCellValue(row[col])).join('\t'))
      .join('\n');
    const text = header + '\n' + data;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Результаты скопированы в буфер обмена');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Не удалось скопировать');
    }
  };

  const downloadAsCSV = () => {
    if (columns.length === 0 && rows.length === 0) return;

    const header = columns.map(escapeCSV).join(',');
    const data = rows
      .map((row) => columns.map((col) => escapeCSV(formatCellValue(row[col]))).join(','))
      .join('\n');
    const csv = '\uFEFF' + header + '\n' + data; // BOM for Excel

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query-result-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV файл загружен');
  };

  // Error view
  if (!success && error) {
    const shortError = error.length > 300 ? error.substring(0, 300) + '...' : error;
    return (
      <div className="flex h-full flex-col gap-3 p-4">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <span className="font-medium">Ошибка выполнения запроса:</span>
            <pre className="mt-2 whitespace-pre-wrap break-words rounded-md bg-destructive/10 p-3 text-sm font-mono">
              {showFullError ? error : shortError}
            </pre>
            {error.length > 300 && (
              <button
                onClick={() => setShowFullError(!showFullError)}
                className="mt-2 flex items-center gap-1 text-xs text-destructive/80 hover:text-destructive transition-colors"
              >
                {showFullError ? (
                  <>
                    <ChevronUp className="h-3 w-3" /> Свернуть
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" /> Показать полностью ({error.length} символов)
                  </>
                )}
              </button>
            )}
          </AlertDescription>
        </Alert>
        <ErrorHints error={error} />
      </div>
    );
  }

  // DDL success view
  if (columns.length === 0 && rows.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center">
        <div className="rounded-full bg-emerald-100 dark:bg-emerald-950/30 p-4">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        </div>
        {message && (
          <p className="text-sm text-muted-foreground">{message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          DDL операция выполнена успешно
        </p>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {executionTime.toFixed(1)} мс
        </span>
      </div>
    );
  }

  // Results table view
  return (
    <div className="flex h-full flex-col">
      {/* Verification banner */}
      <AnimatePresence>
        {verification && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Alert
              className={`rounded-none border-x-0 border-t-0 ${
                verification.verified
                  ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30'
                  : 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30'
              }`}
            >
              {verification.verified ? (
                <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              )}
              <AlertDescription
                className={`text-sm ${
                  verification.verified
                    ? 'text-emerald-800 dark:text-emerald-300'
                    : 'text-amber-800 dark:text-amber-300'
                }`}
              >
                {verification.message}
                {!verification.verified && (
                  <span className="block mt-1 text-xs opacity-80">
                    Ваши строки: {verification.userRowCount}, ожидается: {verification.expectedRowCount}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result header with actions */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span className="text-sm font-medium">
            {rows.length} {pluralizeRows(rows.length)}
          </span>
          {columns.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {columns.length} {pluralizeColumns(columns.length)}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-2">
            <Clock className="h-3 w-3" />
            {executionTime.toFixed(1)} мс
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={copyResultsAsCSV}
              >
                {copied ? (
                  <Check className="h-3 w-3 text-emerald-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Копировать результат (TSV)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={downloadAsCSV}
              >
                <Download className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Скачать CSV</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <tr className="hover:bg-transparent">
              <TableHead className="w-12 text-center text-xs font-medium text-muted-foreground sticky top-0 bg-background">#</TableHead>
              {columns.map((col) => (
                <TableHead
                  key={col}
                  className="whitespace-nowrap text-xs font-medium text-emerald-600 dark:text-emerald-400 sticky top-0 bg-background"
                >
                  {col}
                </TableHead>
              ))}
            </tr>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <tr>
                <TableCell
                  colSpan={columns.length + 1}
                  className="h-24 text-center text-muted-foreground"
                >
                  Нет данных
                </TableCell>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <motion.tr
                  key={idx}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.1, delay: Math.min(idx * 0.015, 0.3) }}
                  className="border-b transition-colors hover:bg-muted/50 text-sm"
                >
                  <td className="p-2 align-middle text-center text-xs text-muted-foreground font-mono">
                    {idx + 1}
                  </td>
                  {columns.map((col) => (
                    <td key={col} className="p-2 align-middle whitespace-nowrap font-mono text-xs max-w-[300px] truncate">
                      {formatCellValue(row[col])}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer message */}
      {message && (
        <div className="border-t border-border px-4 py-2 shrink-0">
          <p className="text-xs text-muted-foreground">{message}</p>
        </div>
      )}
    </div>
  );
}

// Helper: format cell values for display
function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return value.toLocaleString('ru-RU');
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

// Helper: escape CSV values
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

// Helper: Russian pluralization for rows
function pluralizeRows(n: number): string {
  if (n === 0) return 'строк';
  if (n === 1) return 'строка';
  if (n >= 2 && n <= 4) return 'строки';
  return 'строк';
}

// Helper: Russian pluralization for columns
function pluralizeColumns(n: number): string {
  if (n === 1) return 'столбец';
  if (n >= 2 && n <= 4) return 'столбца';
  return 'столбцов';
}

// Error hints component - provides contextual suggestions based on error type
function ErrorHints({ error }: { error: string }) {
  const hints: { check: string; hint: string }[] = [];
  const errLower = error.toLowerCase();

  if (errLower.includes('no such table')) {
    const match = error.match(/no such table:\s*(\S+)/i);
    hints.push({
      check: `Таблица "${match?.[1] || '...'}" не найдена`,
      hint: 'Проверьте название таблицы в секции FROM. Используйте вкладку "Схема" для справки.',
    });
  } else if (errLower.includes('no such column')) {
    const match = error.match(/no such column:\s*(\S+)/i);
    hints.push({
      check: `Столбец "${match?.[1] || '...'}" не найден`,
      hint: 'Проверьте название столбца. Возможно нужно указать таблицу: таблица.столбец.',
    });
  } else if (errLower.includes('near') && errLower.includes('syntax error')) {
    hints.push({
      check: 'Синтаксическая ошибка в запросе',
      hint: 'Проверьте правильность написания SQL. Частые ошибки: пропущена запятая, некорректный оператор, незакрытая скобка.',
    });
  } else if (errLower.includes('ambiguous column')) {
    hints.push({
      check: 'Неоднозначный столбец',
      hint: 'Укажите таблицу для столбца: таблица.столбец. Конфликт возникает при JOIN нескольких таблиц.',
    });
  } else if (errLower.includes('group by')) {
    hints.push({
      check: 'Ошибка GROUP BY',
      hint: 'Все столбцы в SELECT должны быть либо в GROUP BY, либо в агрегатной функции (COUNT, SUM, AVG и т.д.).',
    });
  } else if (errLower.includes('uniqueness constraint failed') || errLower.includes('constraint')) {
    hints.push({
      check: 'Нарушение ограничения',
      hint: 'Возможно, попытка вставить дубликат уникального значения (PRIMARY KEY или UNIQUE).',
    });
  } else if (errLower.includes('foreign key')) {
    hints.push({
      check: 'Ошибка внешнего ключа',
      hint: 'Ссылочное значение не существует в связанной таблице.',
    });
  } else {
    hints.push({
      check: 'Ошибка выполнения',
      hint: 'Проверьте синтаксис запроса и используйте справочник SQL для подсказки.',
    });
  }

  return (
    <div className="space-y-2">
      {hints.map((h, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 + i * 0.1 }}
          className="rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20 p-3"
        >
          <p className="text-xs font-medium text-amber-800 dark:text-amber-300">{h.check}</p>
          <p className="mt-1 text-xs text-amber-700/80 dark:text-amber-400/80">{h.hint}</p>
        </motion.div>
      ))}
    </div>
  );
}
