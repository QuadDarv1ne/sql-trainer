'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { t } from '@/lib/i18n';
import { useDateRange } from '../analytics-dashboard';
import EmptyState from './empty-state';

interface GradeDistributionEntry {
  bracket: string;
  student_count: number;
  percentage: number;
}

interface GradeDistributionChartProps {
  apiEndpoint?: string;
}

const BAR_COLORS = [
  '#ef4444',
  '#ef4444',
  '#f59e0b',
  '#f59e0b',
  '#f59e0b',
  '#10b981',
  '#10b981',
  '#10b981',
  '#10b981',
  '#10b981',
];

export default function GradeDistributionChart({
  apiEndpoint = '/api/admin/analytics/grade-distribution',
}: GradeDistributionChartProps) {
  const [data, setData] = useState<GradeDistributionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { startDate, endDate } = useDateRange();

  useEffect(() => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', String(startDate));
    if (endDate) params.set('endDate', String(endDate));

    fetch(`${apiEndpoint}?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => setData(d.distribution))
      .catch(() => setError(t('analytics.error')))
      .finally(() => setLoading(false));
  }, [apiEndpoint, startDate, endDate]);

  if (loading) return <p className="text-center py-4 text-muted-foreground">{t('analytics.loading')}</p>;
  if (error)
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  if (!data.length) return <EmptyState />;

  const totalStudents = data.reduce((s, d) => s + d.student_count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('analytics.grade.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">{totalStudents}</p>
            <p className="text-xs text-muted-foreground">{t('analytics.grade.students')}</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="bracket" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(value: number) => [value, t('analytics.grade.count')]}
              labelFormatter={(label) => `${t('analytics.grade.bracket')}: ${label}`}
            />
            <Bar dataKey="student_count" name={t('analytics.grade.students')} radius={[4, 4, 0, 0]}>
              {data.map((entry) => (
                <Cell key={entry.bracket} fill={BAR_COLORS[data.indexOf(entry) % BAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#ef4444' }} />
            <span>0–40%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#f59e0b' }} />
            <span>40–60%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#10b981' }} />
            <span>60–100%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
