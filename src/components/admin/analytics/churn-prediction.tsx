'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertCircle, TrendingDown, TrendingUp, Minus, Shield } from 'lucide-react';
import { t } from '@/lib/i18n';
import { useDateRange } from '../analytics-dashboard';
import EmptyState from './empty-state';

interface ChurnPrediction {
  user_id: string;
  name: string;
  email: string;
  churn_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_factors: string[];
  last_active_days: number;
  completion_rate: number;
  velocity_trend: 'improving' | 'stable' | 'declining';
  predicted_action: string;
}

interface ChurnPredictionTableProps {
  apiEndpoint?: string;
}

export default function ChurnPredictionTable({ apiEndpoint = '/api/admin/analytics/churn-prediction' }: ChurnPredictionTableProps) {
  const [data, setData] = useState<ChurnPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const { startDate, endDate } = useDateRange();

  useEffect(() => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', String(startDate));
    if (endDate) params.set('endDate', String(endDate));

    fetch(`${apiEndpoint}?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load');
        return r.json();
      })
      .then((data) => setData(data.predictions))
      .catch(() => setError(t('analytics.error')))
      .finally(() => setLoading(false));
  }, [apiEndpoint, startDate, endDate]);

  if (loading) return <p className="text-center py-4">{t('analytics.loading')}</p>;
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  if (!data.length) return <EmptyState />;

  const filtered = filter === 'all' ? data : data.filter(d => d.risk_level === filter);

  const riskLevels = [
    { key: 'critical', label: t('analytics.churn.critical'), count: data.filter(d => d.risk_level === 'critical').length, color: 'text-red-700', bg: 'bg-red-100 dark:bg-red-950' },
    { key: 'high', label: t('analytics.churn.high'), count: data.filter(d => d.risk_level === 'high').length, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/50' },
    { key: 'medium', label: t('analytics.churn.medium'), count: data.filter(d => d.risk_level === 'medium').length, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/50' },
    { key: 'low', label: t('analytics.churn.low'), count: data.filter(d => d.risk_level === 'low').length, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/50' },
  ];

  const riskColors: Record<string, string> = {
    critical: 'bg-red-600 text-white',
    high: 'bg-red-500 text-white',
    medium: 'bg-amber-500 text-white',
    low: 'bg-emerald-500 text-white',
  };

  const trendIcons: Record<string, React.ReactNode> = {
    improving: <TrendingUp className="h-4 w-4 text-emerald-600" />,
    stable: <Minus className="h-4 w-4 text-gray-400" />,
    declining: <TrendingDown className="h-4 w-4 text-red-600" />,
  };

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        {riskLevels.map(level => (
          <Card
            key={level.key}
            className={`cursor-pointer transition ${filter === level.key ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setFilter(filter === level.key ? 'all' : level.key)}
          >
            <CardContent className={`p-4 ${level.bg}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-2xl font-bold ${level.color}`}>{level.count}</p>
                  <p className="text-xs text-muted-foreground">{level.label}</p>
                </div>
                <Shield className={`h-8 w-8 ${level.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-600" />
            {t('analytics.churn.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('analytics.churn.student')}</TableHead>
                  <TableHead className="text-right">{t('analytics.churn.risk')}</TableHead>
                  <TableHead>{t('analytics.churn.factors')}</TableHead>
                  <TableHead>{t('analytics.churn.trend')}</TableHead>
                  <TableHead className="text-right">{t('analytics.churn.progress')}</TableHead>
                  <TableHead>{t('analytics.churn.recommendation')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((prediction) => (
                  <TableRow key={prediction.user_id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{prediction.name}</div>
                        <div className="text-xs text-muted-foreground">{prediction.email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Progress value={prediction.churn_score} className="h-2 w-16" />
                        <Badge className={riskColors[prediction.risk_level]}>
                          {prediction.churn_score}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 max-w-[200px]">
                        {prediction.risk_factors.slice(0, 2).map((factor, i) => (
                          <p key={i} className="text-xs text-muted-foreground truncate">{factor}</p>
                        ))}
                        {prediction.risk_factors.length > 2 && (
                          <p className="text-xs text-muted-foreground">+{prediction.risk_factors.length - 2} {t('analytics.churn.more')}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {trendIcons[prediction.velocity_trend]}
                        <span className="text-xs">
                          {prediction.velocity_trend === 'improving' ? t('analytics.churn.improving') : prediction.velocity_trend === 'declining' ? t('analytics.churn.declining') : t('analytics.churn.stable')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{prediction.completion_rate}%</TableCell>
                    <TableCell>
                      <p className="text-xs text-muted-foreground max-w-[180px] truncate">
                        {prediction.predicted_action}
                      </p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
