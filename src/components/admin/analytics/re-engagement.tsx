'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, RotateCcw, Users, Clock } from 'lucide-react';
import { t } from '@/lib/i18n';
import { useDateRange } from '../analytics-dashboard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function ReEngagement() {
  const [reEngagedStudents, setReEngagedStudents] = useState<
    Array<{
      user_id: string;
      name: string;
      email: string;
      last_gap_days: number;
      re_engaged_at: number;
      tasks_before_gap: number;
      tasks_after_gap: number;
    }>
  >([]);
  const [bringBackTasks, setBringBackTasks] = useState<
    Array<{ task_id: string; task_title: string; re_engagement_count: number }>
  >([]);
  const [rate, setRate] = useState(0);
  const [avgGap, setAvgGap] = useState(0);
  const [totalReEngaged, setTotalReEngaged] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { startDate, endDate } = useDateRange();

  useEffect(() => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', String(startDate));
    if (endDate) params.set('endDate', String(endDate));

    fetch(`/api/admin/analytics/re-engagement?${params}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to fetch re-engagement data'))))
      .then((data) => {
        setReEngagedStudents(data.re_engaged_students || []);
        setBringBackTasks(data.bring_back_tasks || []);
        setRate(data.re_engagement_rate || 0);
        setAvgGap(data.avg_gap_days || 0);
        setTotalReEngaged(data.total_re_engaged || 0);
      })
      .catch(() => setError(t('analytics.error')))
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  if (loading) return <p className="text-center py-4">{t('analytics.loading')}</p>;
  if (error)
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );

  const stats = [
    { label: t('analytics.reEngagement.rate'), value: `${rate}%`, icon: RotateCcw, color: 'text-blue-600' },
    {
      label: t('analytics.reEngagement.totalReEngaged'),
      value: totalReEngaged,
      icon: Users,
      color: 'text-emerald-600',
    },
    { label: t('analytics.reEngagement.avgGap'), value: avgGap, icon: Clock, color: 'text-amber-600' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t('analytics.reEngagement.title')}</h2>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {reEngagedStudents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('analytics.reEngagement.student')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('analytics.deadlineCompliance.student')}</TableHead>
                    <TableHead>{t('analytics.reEngagement.gapDays')}</TableHead>
                    <TableHead>{t('analytics.reEngagement.tasksBefore')}</TableHead>
                    <TableHead>{t('analytics.reEngagement.tasksAfter')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reEngagedStudents.slice(0, 15).map((s) => (
                    <TableRow key={s.user_id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>
                        <Badge>{s.last_gap_days}</Badge>
                      </TableCell>
                      <TableCell>{s.tasks_before_gap}</TableCell>
                      <TableCell>
                        <Badge className="bg-emerald-100 text-emerald-800">{s.tasks_after_gap}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {bringBackTasks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('analytics.reEngagement.bringBackTasks')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={bringBackTasks.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="task_title" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="re_engagement_count" fill="#8b5cf6" name="Count" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
