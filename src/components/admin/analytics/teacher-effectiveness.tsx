'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Users, TrendingUp, Award } from 'lucide-react';
import { t } from '@/lib/i18n';
import { useDateRange } from '../analytics-dashboard';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import EmptyState from './empty-state';

export default function TeacherEffectiveness() {
  const [teachers, setTeachers] = useState<Array<{ id: string; name: string; student_count: number; avg_completion_rate: number; avg_attempts: number; avg_growth_rate: number }>>([]);
  const [summary, setSummary] = useState<{ total_teachers: number; avg_student_per_teacher: number; top_teacher: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { startDate, endDate } = useDateRange();

  useEffect(() => {
    fetch('/api/admin/analytics/teacher-effectiveness')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        setTeachers(data.teachers || []);
        setSummary(data.summary);
      })
      .catch(() => setError(t('analytics.error')))
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  if (loading) return <p className="text-center py-4">{t('analytics.loading')}</p>;
  if (error) return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>;
  if (!summary) return <EmptyState />;

  const stats = [
    { label: t('analytics.teacherEffectiveness.totalTeachers'), value: summary.total_teachers, icon: Users, color: 'text-blue-600' },
    { label: t('analytics.teacherEffectiveness.avgStudents'), value: summary.avg_student_per_teacher, icon: TrendingUp, color: 'text-emerald-600' },
    { label: t('analytics.teacherEffectiveness.topTeacher'), value: summary.top_teacher, icon: Award, color: 'text-amber-600' },
  ];

  const chartData = teachers.map(t => ({
    name: t.name,
    completion_rate: t.avg_completion_rate,
    student_count: t.student_count,
  }));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t('analytics.teacherEffectiveness.title')}</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      {chartData.length > 0 && (
        <Card>
          <CardHeader><CardTitle>{t('analytics.teacherEffectiveness.comparison')}</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completion_rate" fill="#3b82f6" name={t('analytics.teacherEffectiveness.completionRate')} />
                <Bar dataKey="student_count" fill="#10b981" name={t('analytics.teacherEffectiveness.studentCount')} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>{t('analytics.teacherEffectiveness.ranking')}</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>{t('analytics.teacherEffectiveness.teacher')}</TableHead>
                <TableHead>{t('analytics.teacherEffectiveness.studentCount')}</TableHead>
                <TableHead>{t('analytics.teacherEffectiveness.completionRate')}</TableHead>
                <TableHead>{t('analytics.teacherEffectiveness.avgAttempts')}</TableHead>
                <TableHead>{t('analytics.teacherEffectiveness.growthRate')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.map((teacher, i) => (
                <TableRow key={teacher.id}>
                  <TableCell><Badge className={i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-600' : 'bg-secondary'}>#{i + 1}</Badge></TableCell>
                  <TableCell className="font-medium">{teacher.name}</TableCell>
                  <TableCell>{teacher.student_count}</TableCell>
                  <TableCell>{teacher.avg_completion_rate}%</TableCell>
                  <TableCell>{teacher.avg_attempts}</TableCell>
                  <TableCell>{teacher.avg_growth_rate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
