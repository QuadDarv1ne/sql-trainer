'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { t } from '@/lib/i18n';
import { logger } from '@/lib/logger';
import EmptyState from './empty-state';

interface StudentGroupEntry {
  group_name: string;
  student_count: number;
  avg_completion_rate: number;
  avg_attempts: number;
  avg_velocity: number;
  avg_engagement: number;
  tasks_completed: number;
  total_students: number;
}

export default function StudentGroupsChart() {
  const [data, setData] = useState<StudentGroupEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/analytics/groups');
        const json = await res.json();
        setData(json.groups || []);
      } catch (err) {
        logger.error('Student groups fetch failed', err);
        setError(t('analytics.error'));
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) return <div className="flex justify-center py-8">{t('analytics.loading')}</div>;
  if (error) return <div className="text-red-500 py-8">{error}</div>;
  
  const totalStudents = data.reduce((sum, g) => sum + g.student_count, 0);
  if (totalStudents === 0) return <EmptyState />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('analytics.groups.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="group_name" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="student_count" name="Students" fill="#3b82f6" />
              <Bar dataKey="avg_completion_rate" name="Completion Rate (%)" fill="#22c55e" />
              <Bar dataKey="avg_velocity" name="Velocity (tasks/wk)" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
