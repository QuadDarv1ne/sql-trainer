'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { t } from '@/lib/i18n';
import { logger } from '@/lib/logger';
import { useDateRange } from '../analytics-dashboard';
import EmptyState from './empty-state';

interface HeatmapData {
  date: string;
  completions: number;
  day_of_week: number;
  week_number: number;
}


function getColor(count: number, maxCount: number): string {
  if (count === 0) return 'hsl(142, 33%, 96%)';
  const intensity = count / maxCount;
  if (intensity < 0.2) return 'hsl(142, 50%, 85%)';
  if (intensity < 0.4) return 'hsl(142, 55%, 70%)';
  if (intensity < 0.6) return 'hsl(142, 60%, 55%)';
  if (intensity < 0.8) return 'hsl(142, 65%, 42%)';
  return 'hsl(142, 70%, 30%)';
}

export default function ActivityHeatmap() {
  const DAY_NAMES = [t('analytics.heatmap.day1'), t('analytics.heatmap.day2'), t('analytics.heatmap.day3'), t('analytics.heatmap.day4'), t('analytics.heatmap.day5'), t('analytics.heatmap.day6'), t('analytics.heatmap.day7')];
  const [data, setData] = useState<HeatmapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCompletions, setTotalCompletions] = useState(0);
  const { startDate, endDate } = useDateRange();

  useEffect(() => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', String(startDate));
    if (endDate) params.set('endDate', String(endDate));

    fetch(`/api/admin/analytics/activity-heatmap?${params}`)
      .then((res) => res.json())
      .then((res) => {
        setData(res.data || []);
        setTotalCompletions(res.total || 0);
        setLoading(false);
      })
      .catch((err) => {
        logger.error('Activity heatmap fetch failed', err);
        setError(t('analytics.error'));
        setLoading(false);
      });
  }, [startDate, endDate]);

  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle>{t('analytics.heatmap.dailyTitle')}</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader><CardTitle>{t('analytics.heatmap.dailyTitle')}</CardTitle></CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>{t('analytics.heatmap.dailyTitle')}</CardTitle></CardHeader>
        <CardContent>
          <EmptyState />
        </CardContent>
      </Card>
    );
  }

  // Build week grid
  const dataMap = new Map<string, number>();
  data.forEach((d) => dataMap.set(d.date, d.completions));
  const maxCount = Math.max(...data.map((d) => d.completions), 1);

  // Group by week
  const weeks: HeatmapData[][] = [];
  const dataByWeek = new Map<number, HeatmapData[]>();
  data.forEach((d) => {
    if (!dataByWeek.has(d.week_number)) dataByWeek.set(d.week_number, []);
    const week = dataByWeek.get(d.week_number);
    if (week) week.push(d);
  });

  Array.from(dataByWeek.keys()).sort((a, b) => a - b).forEach((w) => {
    const weekData = dataByWeek.get(w);
    if (weekData) weeks.push(weekData);
  });

  const totalDays = data.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t('analytics.heatmap.dailyTitle')}</CardTitle>
          <span className="text-sm text-muted-foreground">
            {t('analytics.heatmap.subtitle', { completions: String(totalCompletions), weeks: String(Math.round(totalDays / 7)) })}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="flex gap-1 min-w-fit">
            {/* Day labels */}
            <div className="flex flex-col gap-1 mr-1">
              {DAY_NAMES.map((day) => (
                <div key={day} className="h-3.5 w-6 text-[10px] text-muted-foreground text-right leading-3.5">
                  {day}
                </div>
              ))}
            </div>

            {/* Week columns */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {Array.from({ length: 7 }).map((_, di) => {
                  const dayData = week.find((d) => d.day_of_week === di);
                  const count = dayData?.completions ?? 0;
                  const date = dayData?.date ?? '';
                  return (
                    <div
                      key={di}
                      className="h-3.5 w-3.5 rounded-sm transition-colors"
                      style={{
                        backgroundColor: getColor(count, maxCount),
                      }}
                      title={`${date}: ${count} ${t('analytics.activity.completions').toLowerCase()}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1 mt-4 justify-end text-xs text-muted-foreground">
          <span>{t('analytics.heatmap.less')}</span>
          {[0, 0.2, 0.4, 0.6, 0.8, 1].map((level) => (
            <div
              key={level}
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: getColor(level * maxCount, maxCount) }}
            />
          ))}
          <span>{t('analytics.heatmap.more')}</span>
        </div>
      </CardContent>
    </Card>
  );
}
