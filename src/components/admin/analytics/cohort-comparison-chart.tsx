'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { t } from '@/lib/i18n';
import EmptyState from './empty-state';

interface CohortComparisonEntry {
  cohort_name: string;
  student_count: number;
  avg_completion_rate: number;
  avg_attempts: number;
  avg_velocity: number;
  avg_engagement_score: number;
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];

export default function CohortComparisonChart() {
  const [data, setData] = useState<CohortComparisonEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/analytics/cohort-comparison');
        const json = await res.json();
        setData(json.cohorts || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <div className="flex justify-center py-8">{t('analytics.loading')}</div>;
  if (error) return <div className="text-red-500 py-8">{error.message}</div>;
  if (data.length === 0) return <EmptyState icon="chart" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('analytics.cohortComparison.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="cohort_name" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="avg_completion_rate" name="Completion Rate (%)" fill="#22c55e" />
              <Bar dataKey="avg_engagement_score" name="Engagement Score" fill="#3b82f6" />
              <Bar dataKey="avg_velocity" name="Velocity (tasks/wk)" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
