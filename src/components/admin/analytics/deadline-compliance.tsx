'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Calendar, Clock, Users } from 'lucide-react';
import { t } from '@/lib/i18n';
import { useDateRange } from '../analytics-dashboard';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import EmptyState from './empty-state';

interface DeadlineEntry {
  deadline_id: string;
  title: string;
  due_at: number;
  targeted_students: number;
  completed_on_time: number;
  completed_late: number;
  missed: number;
  compliance_rate: number;
  avg_days_overdue: number;
}

interface OverdueStudent {
  user_id: string;
  name: string;
  email: string;
  deadline_title: string;
  due_at: number;
  days_overdue: number;
  completed: boolean;
}

export default function DeadlineCompliance() {
  const [deadlines, setDeadlines] = useState<DeadlineEntry[]>([]);
  const [overdueStudents, setOverdueStudents] = useState<OverdueStudent[]>([]);
  const [overallStats, setOverallStats] = useState<{
    total_deadlines: number;
    overall_compliance_rate: number;
    total_on_time: number;
    total_late: number;
    total_missed: number;
    avg_days_overdue: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { startDate, endDate } = useDateRange();

  useEffect(() => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', String(startDate));
    if (endDate) params.set('endDate', String(endDate));

    fetch(`/api/admin/analytics/deadline-compliance?${params}`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to fetch deadline compliance')))
      .then(data => {
        setDeadlines(data.deadlines || []);
        setOverdueStudents(data.overdue_students || []);
        setOverallStats(data.overall_stats);
      })
      .catch(() => setError(t('analytics.error')))
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  if (loading) return <p className="text-center py-4">{t('analytics.loading')}</p>;
  if (error) return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>;
  if (!overallStats) return <EmptyState />;

  const stats = [
    { label: t('analytics.deadlineCompliance.overall'), value: `${overallStats.overall_compliance_rate}%`, icon: Calendar, color: 'text-blue-600' },
    { label: t('analytics.deadlineCompliance.onTime'), value: overallStats.total_on_time, icon: Users, color: 'text-emerald-600' },
    { label: t('analytics.deadlineCompliance.late'), value: overallStats.total_late, icon: Clock, color: 'text-amber-600' },
    { label: t('analytics.deadlineCompliance.avgOverdue'), value: overallStats.avg_days_overdue, icon: AlertCircle, color: 'text-red-600' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t('analytics.deadlineCompliance.title')}</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(stat => (
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

      {deadlines.length > 0 && (
        <Card>
          <CardHeader><CardTitle>{t('analytics.deadlineCompliance.title')}</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('deadlines.title')}</TableHead>
                  <TableHead>{t('analytics.deadlineCompliance.dueDate')}</TableHead>
                  <TableHead>{t('analytics.deadlineCompliance.targeted')}</TableHead>
                  <TableHead>{t('analytics.deadlineCompliance.onTime')}</TableHead>
                  <TableHead>{t('analytics.deadlineCompliance.late')}</TableHead>
                  <TableHead>{t('analytics.deadlineCompliance.complianceRate')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deadlines.map(d => (
                  <TableRow key={d.deadline_id}>
                    <TableCell className="font-medium">{d.title}</TableCell>
                    <TableCell>{new Date(d.due_at).toLocaleDateString()}</TableCell>
                    <TableCell>{d.targeted_students}</TableCell>
                    <TableCell><Badge className="bg-emerald-100 text-emerald-800">{d.completed_on_time}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className="border-amber-500 text-amber-600">{d.completed_late}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={d.compliance_rate} className="w-20" />
                        <span className="text-sm">{d.compliance_rate}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {overdueStudents.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-red-600">{t('analytics.deadlineCompliance.overdueStudents')}</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('analytics.deadlineCompliance.student')}</TableHead>
                  <TableHead>{t('deadlines.title')}</TableHead>
                  <TableHead>{t('analytics.deadlineCompliance.daysOverdue')}</TableHead>
                  <TableHead>{t('analytics.deadlineCompliance.status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overdueStudents.slice(0, 20).map((s) => (
                  <TableRow key={`${s.user_id}-${s.deadline_title}`}>
                    <TableCell>{s.name}</TableCell>
                    <TableCell>{s.deadline_title}</TableCell>
                    <TableCell><Badge variant="destructive">{s.days_overdue}</Badge></TableCell>
                    <TableCell>{s.completed ? t('analytics.deadlineCompliance.completed') : t('analytics.deadlineCompliance.notCompleted')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
