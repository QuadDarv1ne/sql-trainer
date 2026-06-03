'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Target, Activity } from 'lucide-react';
import { t } from '@/lib/i18n';
import { useAnalyticsQuery } from '@/hooks/use-analytics-query';
import { AnalyticsCard } from './analytics-card';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface AttemptEfficiencyEntry {
  week_label: string;
  first_attempt_rate: number;
  avg_attempts: number;
  total_completions: number;
}

export default function AttemptEfficiency() {
  const { data, loading, error, refetch } = useAnalyticsQuery<AttemptEfficiencyEntry[]>({
    endpoint: '/api/admin/analytics/attempt-efficiency',
    dataKey: 'attemptEfficiency',
  });

  if (loading || error || !data) {
    return (
      <AnalyticsCard
        loading={loading}
        error={error}
        empty={!data}
        onRefresh={refetch}
        title={t('analytics.attemptEfficiency.title')}
        description={t('analytics.attemptEfficiency.description')}
      />
    );
  }

  const latest = data[data.length - 1];
  const first = data[0];
  const rateChange = latest && first ? latest.first_attempt_rate - first.first_attempt_rate : 0;
  const attemptsChange = latest && first ? latest.avg_attempts - first.avg_attempts : 0;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t('analytics.attemptEfficiency.currentRate')}</span>
            </div>
            <div className="mt-2 text-3xl font-bold">{latest?.first_attempt_rate ?? 0}%</div>
            <div
              className={`flex items-center gap-1 text-xs mt-1 ${rateChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
            >
              {rateChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {rateChange >= 0 ? '+' : ''}
              {rateChange.toFixed(1)}pp
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t('analytics.attemptEfficiency.currentAvg')}</span>
            </div>
            <div className="mt-2 text-3xl font-bold">{latest?.avg_attempts ?? 0}</div>
            <div
              className={`flex items-center gap-1 text-xs mt-1 ${attemptsChange <= 0 ? 'text-emerald-600' : 'text-red-600'}`}
            >
              {attemptsChange <= 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
              {attemptsChange >= 0 ? '+' : ''}
              {attemptsChange.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t('analytics.attemptEfficiency.bestRate')}</span>
            </div>
            <div className="mt-2 text-3xl font-bold">{Math.max(...data.map((d) => d.first_attempt_rate), 0)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t('analytics.attemptEfficiency.totalCompletions')}</span>
            </div>
            <div className="mt-2 text-3xl font-bold">{data.reduce((s, d) => s + d.total_completions, 0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* First Attempt Rate Trend */}
      <Card>
        <CardHeader>
          <CardTitle>{t('analytics.attemptEfficiency.rateTrend')}</CardTitle>
          <CardDescription>{t('analytics.attemptEfficiency.rateTrendDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week_label" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="first_attempt_rate"
                name={t('analytics.attemptEfficiency.firstAttemptRate')}
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Avg Attempts Trend */}
      <Card>
        <CardHeader>
          <CardTitle>{t('analytics.attemptEfficiency.attemptsTrend')}</CardTitle>
          <CardDescription>{t('analytics.attemptEfficiency.attemptsTrendDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week_label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="avg_attempts"
                name={t('analytics.attemptEfficiency.avgAttempts')}
                fill="#3b82f6"
                fillOpacity={0.3}
                stroke="#3b82f6"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
