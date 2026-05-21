'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { GraduationCap, TrendingUp } from 'lucide-react';
import { t } from '@/lib/i18n';
import { useAnalyticsQuery } from '@/hooks/use-analytics-query';
import { AnalyticsCard } from './analytics-card';

const DAY_NAMES_RU = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

interface AggregatePerformance {
  level_distribution: { beginner: number; intermediate: number; advanced: number };
  activity_heatmap: number[][];
  weekly_trend: Array<{ week: string; completions: number; unique_users: number }>;
  correlation_data: Array<{ tasks_completed: number; avg_attempts: number }>;
}

function LevelCard({ level, count, color }: { level: string; count: number; color: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 pt-6">
        <GraduationCap className={`h-6 w-6 ${color}`} />
        <div>
          <div className="text-sm text-muted-foreground">{level}</div>
          <div className="text-2xl font-bold">{count}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function HeatmapCell({ value, max }: { value: number; max: number }) {
  const intensity = max > 0 ? value / max : 0;
  const bg = intensity === 0
    ? 'bg-muted/30'
    : intensity < 0.25
      ? 'bg-primary/20'
      : intensity < 0.5
        ? 'bg-primary/40'
        : intensity < 0.75
          ? 'bg-primary/60'
          : 'bg-primary';

  return (
    <div
      className={`h-6 w-6 rounded-sm ${bg} transition-colors`}
      title={`${value}`}
    />
  );
}

export default function AggregatePerformance() {
  const { data, loading, error, refetch } = useAnalyticsQuery<AggregatePerformance>({
    endpoint: '/api/admin/analytics/aggregate-performance',
    dataKey: 'aggregatePerformance',
  });

  if (loading || error || !data) {
    return (
      <AnalyticsCard loading={loading} error={error} empty={!data} onRefresh={refetch} title={t('analytics.aggregatePerformance.title')} />
    );
  }

  const ld = data.level_distribution;
  const maxHeat = Math.max(...data.activity_heatmap.flat(), 1);

  return (
    <div className="space-y-6">
      {/* Level distribution */}
      <div className="grid gap-4 sm:grid-cols-3">
        <LevelCard level={t('analytics.student.beginner')} count={ld.beginner} color="text-emerald-600" />
        <LevelCard level={t('analytics.student.intermediate')} count={ld.intermediate} color="text-amber-600" />
        <LevelCard level={t('analytics.student.advanced')} count={ld.advanced} color="text-red-600" />
      </div>

      {/* Weekly trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('analytics.aggregatePerformance.weeklyTrend')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.weekly_trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="completions"
                name={t('analytics.aggregatePerformance.completions')}
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="unique_users"
                name={t('analytics.aggregatePerformance.uniqueUsers')}
                fill="hsl(var(--muted-foreground))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Activity heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>{t('analytics.aggregatePerformance.activityHeatmap')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="flex gap-0.5">
              {/* Day labels */}
              <div className="flex flex-col gap-0.5 pr-2">
                <div className="h-6" /> {/* Header spacer */}
                {DAY_NAMES_RU.map((day) => (
                  <div key={day} className="h-6 flex items-center text-xs text-muted-foreground w-8">
                    {day}
                  </div>
                ))}
              </div>
              {/* Hour labels */}
              <div className="flex flex-col gap-0.5">
                <div className="flex gap-0.5">
                  {Array.from({ length: 24 }, (_, h) => (
                    <div key={h} className="w-6 text-center text-xs text-muted-foreground">
                      {h}
                    </div>
                  ))}
                </div>
                {/* Heatmap rows */}
                {data.activity_heatmap.map((row, dayIdx) => (
                  <div key={dayIdx} className="flex gap-0.5">
                    {row.map((value, hourIdx) => (
                      <HeatmapCell key={`${dayIdx}-${hourIdx}`} value={value} max={maxHeat} />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
