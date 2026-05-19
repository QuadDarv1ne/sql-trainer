'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
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
import { t } from '@/lib/i18n';

interface DistributionBucket {
  range: string;
  min: number;
  max: number;
  student_count: number;
}

export default function CompletionDistributionChart() {
  const [data, setData] = useState<DistributionBucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/analytics/distribution')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load');
        return r.json();
      })
      .then((data) => setData(data.distribution))
      .catch(() => setError(t('analytics.error')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-center py-4">{t('analytics.loading')}</p>;
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  if (!data.length) return <p className="text-center py-4">{t('analytics.noData')}</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('analytics.distribution.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="range" />
            <YAxis allowDecimals={false} />
            <Tooltip
              formatter={(value: number) => [value, t('analytics.distribution.students')]}
              labelFormatter={(label) => `${t('analytics.distribution.completions')}: ${label}`}
            />
            <Legend />
            <Bar
              dataKey="student_count"
              name={t('analytics.distribution.students')}
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
