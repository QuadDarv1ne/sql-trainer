'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertCircle } from 'lucide-react';
import { t } from '@/lib/i18n';
import EmptyState from './empty-state';
import { useAnalyticsQuery } from '@/hooks/use-analytics-query';

interface CohortEntry {
  cohort_month: string;
  month_0: number;
  month_1: number;
  month_2: number;
  month_3: number;
  total_students: number;
}

export default function CohortAnalysisTable() {
  const { data, loading, error } = useAnalyticsQuery<CohortEntry[]>({
    endpoint: '/api/admin/analytics/cohort',
    dataKey: 'cohorts',
  });

  if (loading) return <p className="text-center py-4">{t('analytics.loading')}</p>;
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  if (!data || !data.length) return <EmptyState />;

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
        <CardTitle>{t('analytics.cohort.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('analytics.cohort.month')}</TableHead>
                <TableHead>{t('analytics.cohort.total')}</TableHead>
                <TableHead>{t('analytics.cohort.month0')}</TableHead>
                <TableHead>{t('analytics.cohort.month1')}</TableHead>
                <TableHead>{t('analytics.cohort.month2')}</TableHead>
                <TableHead>{t('analytics.cohort.month3')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.map((cohort) => (
                <TableRow key={cohort.cohort_month}>
                  <TableCell className="font-medium">{cohort.cohort_month}</TableCell>
                  <TableCell>{cohort.total_students}</TableCell>
                  <TableCell className={getRetentionColor(cohort.month_0, cohort.total_students)}>
                    <Badge variant="outline">{cohort.month_0}</Badge>
                  </TableCell>
                  <TableCell className={getRetentionColor(cohort.month_1, cohort.total_students)}>
                    <Badge variant="outline">{cohort.month_1}</Badge>
                  </TableCell>
                  <TableCell className={getRetentionColor(cohort.month_2, cohort.total_students)}>
                    <Badge variant="outline">{cohort.month_2}</Badge>
                  </TableCell>
                  <TableCell className={getRetentionColor(cohort.month_3, cohort.total_students)}>
                    <Badge variant="outline">{cohort.month_3}</Badge>
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
