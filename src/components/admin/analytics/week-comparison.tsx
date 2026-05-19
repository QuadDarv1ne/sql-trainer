'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ArrowUp, ArrowDown, Minus, Loader2 } from 'lucide-react';

interface WeekData {
  metric: string;
  current: number;
  previous: number;
  change_percent: number;
}

const metricLabels: Record<string, string> = {
  completions: 'Завершения заданий',
  active_users: 'Активные пользователи',
  avg_attempts: 'Среднее число попыток',
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

  useEffect(() => {
    fetch('/api/admin/analytics/week-comparison')
      .then((res) => res.json())
      .then((res) => {
        setData(res.data || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle>Сравнение с прошлой неделей</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader><CardTitle>Сравнение с прошлой неделей</CardTitle></CardHeader>
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
        <CardHeader><CardTitle>Сравнение с прошлой неделей</CardTitle></CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">Нет данных для отображения</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>Сравнение с прошлой неделей</CardTitle></CardHeader>
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
                      было: {item.metric === 'avg_attempts'
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
