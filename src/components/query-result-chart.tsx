'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3, X } from 'lucide-react';
import { t } from '@/lib/i18n';

interface ChartData {
  label: string;
  value: number;
  color: string;
}

interface QueryResultChartProps {
  columns: string[];
  rows: Record<string, unknown>[];
  onClose: () => void;
}

const CHART_COLORS = [
  'bg-emerald-500',
  'bg-sky-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-rose-500',
  'bg-teal-500',
  'bg-indigo-500',
  'bg-orange-500',
];

export default function QueryResultChart({ columns, rows, onClose }: QueryResultChartProps) {
  const [chartType, setChartType] = useState<'bar' | 'horizontal'>('bar');

  const { chartData, labelColumn, valueColumn } = useMemo(() => {
    if (rows.length === 0 || columns.length < 2) {
      return { chartData: [], labelColumn: '', valueColumn: '' };
    }

    // Find numeric columns
    const numericCols = columns.filter((col) => {
      const firstVal = rows[0]?.[col];
      return typeof firstVal === 'number';
    });

    if (numericCols.length === 0) {
      return { chartData: [], labelColumn: '', valueColumn: '' };
    }

    // Use first non-numeric column as label, or first column if all are numeric
    const labelCol = columns.find((col) => {
      const firstVal = rows[0]?.[col];
      return typeof firstVal !== 'number';
    }) || columns[0];

    // Use first numeric column as value
    const valueCol = numericCols[0];

    const data: ChartData[] = rows.slice(0, 20).map((row, idx) => {
      const label = String(row[labelCol] ?? '');
      const value = typeof row[valueCol] === 'number' ? (row[valueCol] as number) : 0;
      return {
        label: label.length > 15 ? label.substring(0, 15) + '...' : label,
        value,
        color: CHART_COLORS[idx % CHART_COLORS.length],
      };
    });

    return { chartData: data, labelColumn: labelCol, valueColumn: valueCol };
  }, [columns, rows]);

  const maxValue = useMemo(() => {
    if (chartData.length === 0) return 1;
    return Math.max(...chartData.map((d) => Math.abs(d.value)), 1);
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center">
        <div>
          <BarChart3 className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <p className="mt-2 text-sm text-muted-foreground">
            Нет числовых данных для визуализации
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            Для построения графика нужен хотя бы один числовой столбец
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Chart header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-emerald-500" />
          <span className="text-sm font-medium">
            Визуализация: {labelColumn} → {valueColumn}
          </span>
          <Badge variant="secondary" className="text-xs">
            {chartData.length} {chartData.length === 1 ? 'запись' : 'записей'}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={chartType === 'bar' ? 'default' : 'outline'}
            size="sm"
            className="h-6 text-xs"
            onClick={() => setChartType('bar')}
            aria-pressed={chartType === 'bar'}
          >
            {t('results.chart.bar')}
          </Button>
          <Button
            variant={chartType === 'horizontal' ? 'default' : 'outline'}
            size="sm"
            className="h-6 text-xs"
            onClick={() => setChartType('horizontal')}
            aria-pressed={chartType === 'horizontal'}
          >
            {t('results.chart.horizontal')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onClose}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Chart content */}
      <div className="flex-1 overflow-auto p-4">
        {chartType === 'bar' ? (
          <div className="flex items-end gap-2" style={{ height: '100%', minHeight: '200px' }}>
            {chartData.map((d) => {
              const heightPercent = (Math.abs(d.value) / maxValue) * 100;
              return (
                <div
                  key={d.label}
                  className="flex flex-1 flex-col items-center gap-1"
                >
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {typeof d.value === 'number' && d.value % 1 !== 0
                      ? d.value.toFixed(1)
                      : d.value.toLocaleString('ru-RU')}
                  </span>
                  <div
                    className={`w-full rounded-t ${d.color} transition-all`}
                    style={{ height: `${Math.max(heightPercent, 2)}%` }}
                    title={`${d.label}: ${d.value}`}
                  />
                  <span
                    className="truncate text-[10px] text-muted-foreground"
                    title={d.label}
                  >
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {chartData.map((d) => {
              const widthPercent = (Math.abs(d.value) / maxValue) * 100;
              return (
                <div key={d.label} className="flex items-center gap-2">
                  <span
                    className="w-24 shrink-0 truncate text-right text-xs font-mono text-muted-foreground"
                    title={d.label}
                  >
                    {d.label}
                  </span>
                  <div className="flex-1">
                    <div
                      className={`h-5 rounded ${d.color} transition-all`}
                      style={{ width: `${Math.max(widthPercent, 2)}%` }}
                      title={`${d.label}: ${d.value}`}
                    />
                  </div>
                  <span className="w-16 shrink-0 text-xs font-mono text-muted-foreground">
                    {typeof d.value === 'number' && d.value % 1 !== 0
                      ? d.value.toFixed(1)
                      : d.value.toLocaleString('ru-RU')}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
