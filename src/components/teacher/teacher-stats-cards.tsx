'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, CheckCircle, TrendingUp, AlertTriangle, Clock, Award } from 'lucide-react';
import { t } from '@/lib/i18n';

interface TeacherStats {
  totalStudents: number;
  activeStudents: number;
  totalCompletions: number;
  avgCompletionRate: number;
  atRiskCount: number;
  avgAttempts: number;
}

export default function TeacherStatsCards() {
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/teacher/stats')
      .then((r) => r.json())
      .then((data) => setStats(data.stats))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats) return null;

  const cards = [
    {
      label: t('teacher.stats.totalStudents'),
      value: stats.totalStudents,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      label: t('teacher.stats.activeStudents'),
      value: stats.activeStudents,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-950',
    },
    {
      label: t('teacher.stats.totalCompletions'),
      value: stats.totalCompletions,
      icon: CheckCircle,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-950',
    },
    {
      label: t('teacher.stats.avgCompletionRate'),
      value: `${stats.avgCompletionRate}%`,
      icon: Award,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-950',
    },
    {
      label: t('teacher.stats.atRisk'),
      value: stats.atRiskCount,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50 dark:bg-red-950',
    },
    {
      label: t('teacher.stats.avgAttempts'),
      value: stats.avgAttempts,
      icon: Clock,
      color: 'text-gray-600',
      bg: 'bg-gray-50 dark:bg-gray-950',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.label} className={card.bg}>
          <CardContent className="p-4 flex items-center gap-3">
            <card.icon className={`h-8 w-8 ${card.color}`} />
            <div>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
