'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Download, RefreshCw, Check } from 'lucide-react';
import { t } from '@/lib/i18n';

interface DateRangeFilterProps {
  onFilterChange?: (startDate: number | null, endDate: number | null) => void;
  onExport?: () => void;
  onRefresh?: () => void;
}

const DATE_PRESETS = [
  { value: '7', labelKey: 'analytics.filter.last7', days: 7 },
  { value: '14', labelKey: 'analytics.filter.last14', days: 14 },
  { value: '30', labelKey: 'analytics.filter.last30', days: 30 },
  { value: '90', labelKey: 'analytics.filter.last90', days: 90 },
  { value: '180', labelKey: 'analytics.filter.last180', days: 180 },
  { value: 'custom', labelKey: 'analytics.filter.custom', days: null },
];

const STORAGE_KEY = 'analytics-date-range';

function loadSavedRange(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || '30';
  } catch {
    return '30';
  }
}

function saveSavedRange(value: string) {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Ignore
  }
}

export default function DateRangeFilter({ onFilterChange, onExport, onRefresh }: DateRangeFilterProps) {
  const [selectedRange, setSelectedRange] = useState<string>(loadSavedRange);
  const [pendingRange, setPendingRange] = useState<string>(selectedRange);

  // Apply range change
  const applyRange = (value: string) => {
    setSelectedRange(value);
    saveSavedRange(value);

    if (value === 'custom') {
      onFilterChange?.(null, null);
      return;
    }

    const days = parseInt(value);
    const endDate = Date.now();
    const startDate = endDate - days * 24 * 60 * 60 * 1000;
    onFilterChange?.(startDate, endDate);
  };

  const handleSelectChange = (value: string) => {
    setPendingRange(value);
  };

  const handleApply = () => {
    applyRange(pendingRange);
  };

  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{t('analytics.filter.dateRange')}:</span>
        </div>

        <Select value={pendingRange} onValueChange={handleSelectChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DATE_PRESETS.map((preset) => (
              <SelectItem key={preset.value} value={preset.value}>
                {t(preset.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="default" size="sm" onClick={handleApply}>
          <Check className="h-4 w-4 mr-1" />
          {t('analytics.filter.apply')}
        </Button>

        <div className="ml-auto flex items-center gap-2">
          {onRefresh && (
            <Button variant="ghost" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-1" />
              {t('analytics.refresh')}
            </Button>
          )}
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              {t('analytics.export.csv')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
