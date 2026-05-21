'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Download, RefreshCw } from 'lucide-react';
import { t } from '@/lib/i18n';

interface DateRangeFilterProps {
  onFilterChange?: (startDate: number | null, endDate: number | null) => void;
  onExport?: () => void;
  onRefresh?: () => void;
}

export default function DateRangeFilter({ onFilterChange, onExport, onRefresh }: DateRangeFilterProps) {
  const [selectedRange, setSelectedRange] = useState<string>('30');

  const handleRangeChange = (value: string) => {
    setSelectedRange(value);
    
    if (value === 'custom') {
      // For custom range, would use date pickers (simplified here)
      onFilterChange?.(null, null);
      return;
    }

    const days = parseInt(value);
    const endDate = Date.now();
    const startDate = endDate - days * 24 * 60 * 60 * 1000;
    onFilterChange?.(startDate, endDate);
  };

  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{t('analytics.filter.dateRange')}:</span>
        </div>
        
        <Select value={selectedRange} onValueChange={handleRangeChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">{t('analytics.filter.last7')}</SelectItem>
            <SelectItem value="14">{t('analytics.filter.last14')}</SelectItem>
            <SelectItem value="30">{t('analytics.filter.last30')}</SelectItem>
            <SelectItem value="90">{t('analytics.filter.last90')}</SelectItem>
            <SelectItem value="custom">{t('analytics.filter.custom')}</SelectItem>
          </SelectContent>
        </Select>

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
