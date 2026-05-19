'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ArrowUp, ArrowDown, Minus, Loader2 } from 'lucide-react';
import { t } from '@/lib/i18n';
import { useDateRange } from '../analytics-dashboard';
import EmptyState from './empty-state';

interface WeekData {
  metric: string;
  current: number;
  previous: number;
  change_percent: number;
}

const metricLabels: Record<string, string> = {
  completions: t('analytics.weekComparison.completions'),
  active_users: t('analytics.weekComparison.activeUsers'),
  avg_attempts: t('analytics.weekComparison.avgAttempts'),
};

function ChangeIndicator({ value, inverted }: { value: number; inverted?: boolean }) {
  const isPositive = inverted ? value < 0 : value > 0;
  const isNegative = inverted ? value > 0 : value < 0;

  if (value === 0) return <Minus className="h-4 w-4 text-muted-foreground" />;
  if (isPositive) return <ArrowUp className="h-4 w-4 text-emerald-500" />;
  if (isNegative) return <ArrowDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

export default function WeekOverWeekComparison() {
  const [data, setData] = useState<WeekData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { startDate, endDate } = useDateRange();

  useEffect(() => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', String(startDate));
    if (endDate) params.set('endDate', String(endDate));

    fetch(`/api/admin/analytics/week-comparison?${params}`)
      .then((res) => res.json())
      .then((res) => {
        setData(res.data || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [startDate, endDate]);

  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle>{t('analytics.weekComparison.title')}</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader><CardTitle>{t('analytics.weekComparison.title')}</CardTitle></CardHeader>
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
        <CardHeader><CardTitle>{t('analytics.weekComparison.title')}</CardTitle></CardHeader>
        <CardContent>
          <EmptyState />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>{t('analytics.weekComparison.title')}</CardTitle></CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {data.map((item) => {
            const label = metricLabels[item.metric] || item.metric;
            const isInverted = item.metric === 'avg_attempts'; // lower is better
            const isPositive = isInverted ? item.change_percent < 0 : item.change_percent > 0;
            const changeColor = item.change_percent === 0
              ? 'text-muted-foreground'
              : isPositive
                ? 'text-emerald-500'
                : 'text-red-500';

            return (
              <div key={item.metric} className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground mb-2">{label}</p>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold">
                      {item.metric === 'avg_attempts'
                        ? item.current.toFixed(1)
                        : item.current}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('analytics.weekComparison.was')} {item.metric === 'avg_attempts'
                        ? item.previous.toFixed(1)
                        : item.previous}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1 ${changeColor}`}>
                    <ChangeIndicator value={item.change_percent} inverted={isInverted} />
                    <span className="text-sm font-medium">
                      {item.change_percent > 0 ? '+' : ''}{item.change_percent}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
