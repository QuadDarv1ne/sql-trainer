'use client';

import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownRight, Minus, Users } from 'lucide-react';
import { t } from '@/lib/i18n';
import { useAnalyticsQuery } from '@/hooks/use-analytics-query';
import { AnalyticsCard } from './analytics-card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

interface AtRiskStudent {
  user_id: string;
  name: string;
  email: string;
  completion_rate: number;
  days_since_active: number;
  avg_attempts: number;
  performance_trend: 'improving' | 'stable' | 'declining';
  risk_level: 'high' | 'medium' | 'low';
  risk_reasons: string[];
}

const reasonLabels: Record<string, string> = {
  low_completion: t('analytics.atRisk.lowCompletion'),
  no_activity: t('analytics.atRisk.noActivity'),
  high_attempts: t('analytics.atRisk.highAttempts'),
  declining: t('analytics.atRisk.declining'),
};

function RiskBadge({ level }: { level: string }) {
  const config = {
    high: { label: t('analytics.atRisk.highRisk'), className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
    medium: { label: t('analytics.atRisk.mediumRisk'), className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
    low: { label: t('analytics.atRisk.lowRisk'), className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  };
  const { label, className } = config[level as keyof typeof config] || config.low;
  return <Badge className={className}>{label}</Badge>;
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'improving') return <ArrowUpRight className="h-4 w-4 text-emerald-600" />;
  if (trend === 'declining') return <ArrowDownRight className="h-4 w-4 text-red-600" />;
  return <Minus className="h-4 w-4 text-gray-400" />;
}

export default function AtRiskStudents() {
  const { data, loading, error, refetch } = useAnalyticsQuery<AtRiskStudent[]>({
    endpoint: '/api/admin/analytics/at-risk',
    dataKey: 'atRiskStudents',
  });

  if (loading || error || !data) {
    return (
      <AnalyticsCard
        loading={loading}
        error={error}
        empty={!data}
        onRefresh={refetch}
        title={t('analytics.atRisk.title')}
        description={t('analytics.atRisk.description')}
      />
    );
  }

  const highCount = data.filter(s => s.risk_level === 'high').length;
  const mediumCount = data.filter(s => s.risk_level === 'medium').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{t('analytics.atRisk.totalAtRisk')}</span>
          <span className="font-bold text-lg">{data.length}</span>
        </div>
        {highCount > 0 && (
          <Badge variant="destructive">{highCount} {t('analytics.atRisk.highRisk')}</Badge>
        )}
        {mediumCount > 0 && (
          <Badge className="bg-amber-100 text-amber-800">{mediumCount} {t('analytics.atRisk.mediumRisk')}</Badge>
        )}
      </div>

      <AnalyticsCard title={t('analytics.atRisk.title')} loading={false} error={null} onRefresh={refetch}>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('analytics.leaderboard.name')}</TableHead>
                <TableHead className="text-center">{t('analytics.atRisk.riskLevel')}</TableHead>
                <TableHead>{t('analytics.atRisk.reasons')}</TableHead>
                <TableHead className="text-right">{t('analytics.atRisk.completionRate')}</TableHead>
                <TableHead className="text-right">{t('analytics.atRisk.daysInactive')}</TableHead>
                <TableHead className="text-right">{t('analytics.atRisk.avgAttempts')}</TableHead>
                <TableHead className="text-center">{t('analytics.atRisk.trend')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((student) => (
                <TableRow key={student.user_id}>
                  <TableCell className="font-medium">
                    <div>{student.name}</div>
                    <div className="text-xs text-muted-foreground">{student.email}</div>
                  </TableCell>
                  <TableCell className="text-center"><RiskBadge level={student.risk_level} /></TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {student.risk_reasons.map(reason => (
                        <Badge key={reason} variant="outline" className="text-xs">
                          {reasonLabels[reason] || reason}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={student.completion_rate < 25 ? 'text-red-600 font-medium' : ''}>
                      {student.completion_rate}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={student.days_since_active >= 14 ? 'text-amber-600 font-medium' : ''}>
                      {student.days_since_active >= 999 ? '—' : `${student.days_since_active}d`}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{student.avg_attempts}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <TrendIcon trend={student.performance_trend} />
                      <span className="text-xs">{t(`analytics.students.trend.${student.performance_trend}`)}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </AnalyticsCard>
    </div>
  );
}
