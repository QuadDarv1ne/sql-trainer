'use client';

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, BookOpen, Code, AlertCircle } from 'lucide-react';
import type { TrainingTask } from '@/lib/training-tasks';
import { t } from '@/lib/i18n';

interface ContextualTip {
  icon: React.ReactNode;
  title: string;
  content: string;
  color: string;
}

export function getContextualTips(task: TrainingTask): ContextualTip[] {
  const tips: ContextualTip[] = [];
  const { taskText, sampleSolution, hint } = task;
  const combined = `${taskText} ${sampleSolution} ${hint}`.toLowerCase();

  if (combined.includes('join')) {
    tips.push({
      icon: <BookOpen className="h-3.5 w-3.5" />,
      title: t('contextualTips.join.title'),
      content: t('contextualTips.join.content'),
      color: 'text-blue-600 dark:text-blue-400',
    });
  }

  if (
    combined.includes('group by') ||
    combined.includes('count(') ||
    combined.includes('sum(') ||
    combined.includes('avg(')
  ) {
    tips.push({
      icon: <BookOpen className="h-3.5 w-3.5" />,
      title: t('contextualTips.groupBy.title'),
      content: t('contextualTips.groupBy.content'),
      color: 'text-emerald-600 dark:text-emerald-400',
    });
  }

  if (combined.includes('over') && combined.includes('partition')) {
    tips.push({
      icon: <BookOpen className="h-3.5 w-3.5" />,
      title: t('contextualTips.window.title'),
      content: t('contextualTips.window.content'),
      color: 'text-violet-600 dark:text-violet-400',
    });
  }

  if (combined.includes('row_number') || combined.includes('rank()') || combined.includes('dense_rank')) {
    tips.push({
      icon: <Code className="h-3.5 w-3.5" />,
      title: t('contextualTips.rowNumber.title'),
      content: t('contextualTips.rowNumber.content'),
      color: 'text-purple-600 dark:text-purple-400',
    });
  }

  if (combined.includes('with ') && combined.includes(' as')) {
    tips.push({
      icon: <Lightbulb className="h-3.5 w-3.5" />,
      title: t('contextualTips.cte.title'),
      content: t('contextualTips.cte.content'),
      color: 'text-amber-600 dark:text-amber-400',
    });
  }

  if (combined.includes('select') && combined.split('select').length > 2 && !combined.includes('with ')) {
    tips.push({
      icon: <Code className="h-3.5 w-3.5" />,
      title: t('contextualTips.subquery.title'),
      content: t('contextualTips.subquery.content'),
      color: 'text-orange-600 dark:text-orange-400',
    });
  }

  if (
    combined.includes('coalesce') ||
    combined.includes('is null') ||
    combined.includes('ifnull') ||
    combined.includes('isnull')
  ) {
    tips.push({
      icon: <AlertCircle className="h-3.5 w-3.5" />,
      title: t('contextualTips.null.title'),
      content: t('contextualTips.null.content'),
      color: 'text-red-600 dark:text-red-400',
    });
  }

  if (combined.includes('case ') && combined.includes('when')) {
    tips.push({
      icon: <Code className="h-3.5 w-3.5" />,
      title: t('contextualTips.case.title'),
      content: t('contextualTips.case.content'),
      color: 'text-indigo-600 dark:text-indigo-400',
    });
  }

  if (combined.includes('exists')) {
    tips.push({
      icon: <Lightbulb className="h-3.5 w-3.5" />,
      title: t('contextualTips.exists.title'),
      content: t('contextualTips.exists.content'),
      color: 'text-teal-600 dark:text-teal-400',
    });
  }

  if (combined.includes('distinct')) {
    tips.push({
      icon: <AlertCircle className="h-3.5 w-3.5" />,
      title: t('contextualTips.distinct.title'),
      content: t('contextualTips.distinct.content'),
      color: 'text-yellow-600 dark:text-yellow-400',
    });
  }

  if (
    combined.includes('date') ||
    combined.includes('strftime') ||
    combined.includes('datediff') ||
    combined.includes('toyyyyyy')
  ) {
    tips.push({
      icon: <BookOpen className="h-3.5 w-3.5" />,
      title: t('contextualTips.dates.title'),
      content: t('contextualTips.dates.content'),
      color: 'text-cyan-600 dark:text-cyan-400',
    });
  }

  if (
    combined.includes('concat') ||
    combined.includes('substr') ||
    combined.includes('length') ||
    combined.includes('upper') ||
    combined.includes('lower') ||
    combined.includes('like')
  ) {
    tips.push({
      icon: <Code className="h-3.5 w-3.5" />,
      title: t('contextualTips.strings.title'),
      content: t('contextualTips.strings.content'),
      color: 'text-pink-600 dark:text-pink-400',
    });
  }

  if (combined.includes('having')) {
    tips.push({
      icon: <Lightbulb className="h-3.5 w-3.5" />,
      title: t('contextualTips.having.title'),
      content: t('contextualTips.having.content'),
      color: 'text-lime-600 dark:text-lime-400',
    });
  }

  if (combined.includes('limit') || combined.includes('top ') || combined.includes('fetch first')) {
    tips.push({
      icon: <AlertCircle className="h-3.5 w-3.5" />,
      title: t('contextualTips.rowLimiting.title'),
      content: t('contextualTips.rowLimiting.content'),
      color: 'text-rose-600 dark:text-rose-400',
    });
  }

  if (
    combined.includes('join') &&
    combined.split(' as ').length > 2 &&
    (combined.includes('e1') || combined.includes('e2') || combined.includes('t1') || combined.includes('t2'))
  ) {
    tips.push({
      icon: <Lightbulb className="h-3.5 w-3.5" />,
      title: t('contextualTips.selfJoin.title'),
      content: t('contextualTips.selfJoin.content'),
      color: 'text-sky-600 dark:text-sky-400',
    });
  }

  if (task.dbType === 'clickhouse' || combined.includes('clickhouse')) {
    tips.push({
      icon: <AlertCircle className="h-3.5 w-3.5" />,
      title: t('contextualTips.clickhouse.title'),
      content: t('contextualTips.clickhouse.content'),
      color: 'text-fuchsia-600 dark:text-fuchsia-400',
    });
  }

  if (task.dbType === 'mysql' || combined.includes('mysql')) {
    tips.push({
      icon: <AlertCircle className="h-3.5 w-3.5" />,
      title: t('contextualTips.mysql.title'),
      content: t('contextualTips.mysql.content'),
      color: 'text-amber-600 dark:text-amber-400',
    });
  }

  return tips.slice(0, 2);
}

interface ContextualTipsProps {
  task: TrainingTask;
}

export default function ContextualTips({ task }: ContextualTipsProps) {
  const tips = useMemo(() => getContextualTips(task), [task]);

  if (tips.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
        <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
        {t('contextualTips.label')}
      </h4>
      {tips.map((tip, i) => (
        <Card key={i} className="bg-muted/20 border-border/50">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <span className={`shrink-0 mt-0.5 ${tip.color}`}>{tip.icon}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-mono">
                    {tip.title}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{tip.content}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
