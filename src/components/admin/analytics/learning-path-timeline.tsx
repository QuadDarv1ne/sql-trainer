'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { t } from '@/lib/i18n';

interface TimelineEntry {
  task_id: string;
  completed_at: number;
  attempts: number;
  cumulative_count: number;
  difficulty: string;
}

interface LearningPathTimelineProps {
  userId: string;
}

export default function LearningPathTimeline({ userId }: LearningPathTimelineProps) {
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [student, setStudent] = useState<{ name: string; email: string; tasks_completed: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/analytics/student/${userId}/timeline`);
        const json = await res.json();
        setStudent(json.student);
        setTimeline(json.timeline || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [userId]);

  if (loading) return <div className="flex justify-center py-4">{t('analytics.loading')}</div>;
  if (error) return <div className="text-red-500 py-4">{error.message}</div>;
  if (timeline.length === 0) return <div className="text-center py-4 text-muted-foreground">{t('analytics.noData')}</div>;

  const diffColors: Record<string, string> = { beginner: '#22c55e', intermediate: '#f59e0b', advanced: '#ef4444', other: '#6b7280' };

  const chartData = timeline.map(t => ({
    date: new Date(t.completed_at).toLocaleDateString(),
    cumulative: t.cumulative_count,
    attempts: t.attempts,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('analytics.timeline.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="cumulative" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-1 max-h-40 overflow-y-auto">
          {timeline.slice(-20).reverse().map((entry) => (
            <div key={`${entry.task_id}-${entry.completed_at}`} className="flex items-center justify-between py-1 border-b text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline" style={{ borderColor: diffColors[entry.difficulty] }}>
                  {entry.difficulty}
                </Badge>
                <span className="font-mono text-xs">{entry.task_id}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <span>{entry.attempts} {t('analytics.attempts')}</span>
                <span>{new Date(entry.completed_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
