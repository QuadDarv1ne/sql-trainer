'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertCircle, Users } from 'lucide-react';
import { t } from '@/lib/i18n';

interface CohortEntry {
  cohort_month: string;
  month_0: number;
  month_1: number;
  month_2: number;
  month_3: number;
  total_students: number;
}

export default function TeacherCohortAnalysis() {
  const [data, setData] = useState<CohortEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/teacher/cohort')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load');
        return r.json();
      })
      .then((res) => setData(res.data))
      .catch(() => setError(t('teacher.error')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-center py-4">{t('teacher.loading')}</p>;
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  if (!data.length) return <p className="text-center py-4">{t('teacher.noData')}</p>;

  const getRetentionColor = (value: number, total: number) => {
    if (total === 0) return '';
    const percent = (value / total) * 100;
    if (percent >= 75) return 'text-emerald-600';
    if (percent >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {t('teacher.cohort.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('teacher.cohort.month')}</TableHead>
                <TableHead className="text-right">{t('teacher.cohort.total')}</TableHead>
                <TableHead className="text-right">{t('teacher.cohort.month0')}</TableHead>
                <TableHead className="text-right">{t('teacher.cohort.month1')}</TableHead>
                <TableHead className="text-right">{t('teacher.cohort.month2')}</TableHead>
                <TableHead className="text-right">{t('teacher.cohort.month3')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((cohort) => (
                <TableRow key={cohort.cohort_month}>
                  <TableCell className="font-medium">{cohort.cohort_month}</TableCell>
                  <TableCell className="text-right">{cohort.total_students}</TableCell>
                  <TableCell className={`text-right ${getRetentionColor(cohort.month_0, cohort.total_students)}`}>
                    {cohort.month_0} ({cohort.total_students > 0 ? Math.round((cohort.month_0 / cohort.total_students) * 100) : 0}%)
                  </TableCell>
                  <TableCell className={`text-right ${getRetentionColor(cohort.month_1, cohort.total_students)}`}>
                    {cohort.month_1} ({cohort.total_students > 0 ? Math.round((cohort.month_1 / cohort.total_students) * 100) : 0}%)
                  </TableCell>
                  <TableCell className={`text-right ${getRetentionColor(cohort.month_2, cohort.total_students)}`}>
                    {cohort.month_2} ({cohort.total_students > 0 ? Math.round((cohort.month_2 / cohort.total_students) * 100) : 0}%)
                  </TableCell>
                  <TableCell className={`text-right ${getRetentionColor(cohort.month_3, cohort.total_students)}`}>
                    {cohort.month_3} ({cohort.total_students > 0 ? Math.round((cohort.month_3 / cohort.total_students) * 100) : 0}%)
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
