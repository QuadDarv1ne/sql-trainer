'use client';

import { Badge } from '@/components/ui/badge';
import { BookOpen, AlertTriangle } from 'lucide-react';
import { t } from '@/lib/i18n';
import { useAnalyticsQuery } from '@/hooks/use-analytics-query';
import { AnalyticsCard } from './analytics-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface SkillGapEntry {
  user_id: string;
  name: string;
  category: string;
  category_label: string;
  total_tasks: number;
  completed_tasks: number;
  completion_rate: number;
  avg_attempts: number;
  is_weak: boolean;
}

function CellColor({ rate }: { rate: number }) {
  if (rate >= 75) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
  if (rate >= 50) return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
  return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
}

export default function SkillGapMatrix() {
  const { data, loading, error, refetch } = useAnalyticsQuery<SkillGapEntry[]>({
    endpoint: '/api/admin/analytics/skill-gap',
    dataKey: 'skillGapData',
  });

  if (loading || error || !data) {
    return (
      <AnalyticsCard
        loading={loading}
        error={error}
        empty={!data}
        onRefresh={refetch}
        title={t('analytics.skillGap.title')}
        description={t('analytics.skillGap.description')}
      />
    );
  }

  // Group by student
  const studentMap = new Map<string, { name: string; skills: SkillGapEntry[] }>();
  for (const entry of data) {
    if (!studentMap.has(entry.user_id)) {
      studentMap.set(entry.user_id, { name: entry.name, skills: [] });
    }
    studentMap.get(entry.user_id)?.skills.push(entry);
  }

  const students = Array.from(studentMap.entries());
  const categories = data.length > 0 ? [...new Set(data.map((d) => d.category))] : [];
  const weakCount = data.filter((d) => d.is_weak).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {students.length} {t('analytics.skillGap.students')}
          </span>
        </div>
        {weakCount > 0 && (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {weakCount} {t('analytics.skillGap.weakAreas')}
          </Badge>
        )}
      </div>

      <AnalyticsCard title={t('analytics.skillGap.title')} loading={false} error={null} onRefresh={refetch}>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-background z-10">{t('analytics.leaderboard.name')}</TableHead>
                {categories.map((cat) => {
                  const entry = data.find((d) => d.category === cat);
                  return (
                    <TableHead key={cat} className="text-center min-w-[120px]">
                      {entry?.category_label || cat}
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map(([userId, { name, skills }]) => (
                <TableRow key={userId}>
                  <TableCell className="font-medium sticky left-0 bg-background z-10">{name}</TableCell>
                  {categories.map((cat) => {
                    const skill = skills.find((s) => s.category === cat);
                    if (!skill)
                      return (
                        <TableCell key={cat} className="text-center text-muted-foreground">
                          —
                        </TableCell>
                      );
                    return (
                      <TableCell key={cat} className="text-center">
                        <Badge className={CellColor({ rate: skill.completion_rate })}>{skill.completion_rate}%</Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          {skill.completed_tasks}/{skill.total_tasks}
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </AnalyticsCard>

      <AnalyticsCard title={t('analytics.skillGap.legend')} loading={false} error={null}>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-100 text-emerald-800">75%+</Badge>
            <span className="text-muted-foreground">{t('analytics.skillGap.strong')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-100 text-amber-800">50-74%</Badge>
            <span className="text-muted-foreground">{t('analytics.skillGap.moderate')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-red-100 text-red-800">&lt;50%</Badge>
            <span className="text-muted-foreground">{t('analytics.skillGap.weak')}</span>
          </div>
        </div>
      </AnalyticsCard>
    </div>
  );
}
