'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { t } from '@/lib/i18n';
import { useDateRange } from '../analytics-dashboard';
import EmptyState from './empty-state';

interface GrowthEntry {
  week_label: string;
  new_users: number;
  active_users: number;
  total_users: number;
}

interface StudentGrowthTrendsProps {
  apiEndpoint?: string;
}

export default function StudentGrowthTrends({ apiEndpoint = '/api/admin/analytics/growth' }: StudentGrowthTrendsProps) {
  const [data, setData] = useState<GrowthEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { startDate, endDate } = useDateRange();

  useEffect(() => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', String(startDate));
    if (endDate) params.set('endDate', String(endDate));

    fetch(`${apiEndpoint}?${params}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => setData(d.growth))
      .catch(() => setError(t('analytics.error')))
      .finally(() => setLoading(false));
  }, [apiEndpoint, startDate, endDate]);

  if (loading) return <p className="text-center py-4 text-muted-foreground">{t('analytics.loading')}</p>;
  if (error) return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>;
  if (!data.length) return <EmptyState />;

  const activeSum = data.reduce((s, d) => s + d.active_users, 0);
  const avgActive = Math.round(activeSum / data.length);
  const latestTotal = data[data.length - 1].total_users;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('analytics.growth.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">{latestTotal}</p>
            <p className="text-xs text-muted-foreground">{t('analytics.growth.totalUsers')}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">{avgActive}</p>
            <p className="text-xs text-muted-foreground">{t('analytics.growth.activeUsers')}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">{data[data.length - 1]?.new_users || 0}</p>
            <p className="text-xs text-muted-foreground">{t('analytics.growth.newUsers')}</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week_label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              labelFormatter={(label) => `${t('analytics.growth.week')}: ${label}`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="total_users"
              name={t('analytics.growth.totalUsers')}
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="active_users"
              name={t('analytics.growth.activeUsers')}
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="new_users"
              name={t('analytics.growth.newUsers')}
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
