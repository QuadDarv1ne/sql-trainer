'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Clock, TrendingUp, Users, Activity } from 'lucide-react';
import { t } from '@/lib/i18n';
import { useAnalyticsQuery } from '@/hooks/use-analytics-query';
import { AnalyticsCard } from './analytics-card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface StudyPatternSummary {
  avg_sessions_per_week: number;
  preferred_hour: number;
  preferred_day: string;
  consistency_score: number;
  hourly_distribution: Array<{ hour: number; sessions: number }>;
  weekly_distribution: Array<{ day: string; sessions: number }>;
  day_hour_heatmap: number[][];
  student_count: number;
}

function HeatmapCell({ value, max }: { value: number; max: number }) {
  const intensity = max > 0 ? value / max : 0;
  const bg =
    intensity === 0
      ? 'bg-gray-100 dark:bg-gray-800'
      : intensity < 0.25
        ? 'bg-blue-100 dark:bg-blue-900'
        : intensity < 0.5
          ? 'bg-blue-200 dark:bg-blue-800'
          : intensity < 0.75
            ? 'bg-blue-300 dark:bg-blue-700'
            : 'bg-blue-400 dark:bg-blue-600';
  return <div className={`w-6 h-6 rounded-sm ${bg}`} title={`${value}`} />;
}

export default function StudyPatterns() {
  const { data, loading, error, refetch } = useAnalyticsQuery<StudyPatternSummary>({
    endpoint: '/api/admin/analytics/study-patterns',
    dataKey: 'studyPatterns',
  });

  if (loading || error || !data) {
    return (
      <AnalyticsCard
        loading={loading}
        error={error}
        empty={!data}
        onRefresh={refetch}
        title={t('analytics.studyPatterns.title')}
        description={t('analytics.studyPatterns.description')}
      />
    );
  }

  const maxHeatmap = Math.max(...data.day_hour_heatmap.flat(), 1);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t('analytics.studyPatterns.sessionsPerWeek')}</span>
            </div>
            <div className="mt-2 text-3xl font-bold">{data.avg_sessions_per_week}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t('analytics.studyPatterns.preferredTime')}</span>
            </div>
            <div className="mt-2 text-3xl font-bold">{data.preferred_hour}:00</div>
            <div className="text-xs text-muted-foreground">
              {t('analytics.studyPatterns.preferredDay')}: {data.preferred_day}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t('analytics.studyPatterns.consistency')}</span>
            </div>
            <div className="mt-2 text-3xl font-bold">{data.consistency_score}</div>
            <div className="text-xs text-muted-foreground">/ 100</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t('analytics.studyPatterns.students')}</span>
            </div>
            <div className="mt-2 text-3xl font-bold">{data.student_count}</div>
          </CardContent>
        </Card>
      </div>

      {/* Hourly Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>{t('analytics.studyPatterns.hourlyDist')}</CardTitle>
          <CardDescription>{t('analytics.studyPatterns.hourlyDistDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.hourly_distribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip labelFormatter={(label: number) => `${label}:00`} />
              <Bar dataKey="sessions" fill="#3b82f6" name={t('analytics.studyPatterns.sessions')} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Weekly Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>{t('analytics.studyPatterns.weeklyDist')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.weekly_distribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="sessions" fill="#10b981" name={t('analytics.studyPatterns.sessions')} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Day-Hour Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>{t('analytics.studyPatterns.heatmap')}</CardTitle>
          <CardDescription>{t('analytics.studyPatterns.heatmapDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="flex gap-1 items-start">
              {/* Hour labels */}
              <div className="flex flex-col gap-0.5 pt-6">
                {data.day_hour_heatmap.map((_, dayIdx) => (
                  <div key={dayIdx} className="w-6 h-6 flex items-center text-xs text-muted-foreground">
                    {['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][dayIdx]}
                  </div>
                ))}
              </div>
              {/* Heatmap grid */}
              <div className="flex flex-col gap-0.5">
                {/* Hour labels row */}
                <div className="flex gap-0.5 mb-1">
                  {Array.from({ length: 24 }, (_, h) => (
                    <div key={h} className="w-6 text-center text-xs text-muted-foreground">
                      {h}
                    </div>
                  ))}
                </div>
                {data.day_hour_heatmap.map((row, dayIdx) => (
                  <div key={dayIdx} className="flex gap-0.5">
                    {row.map((value, hourIdx) => (
                      <HeatmapCell key={`${dayIdx}-${hourIdx}`} value={value} max={maxHeatmap} />
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
