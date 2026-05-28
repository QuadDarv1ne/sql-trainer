'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Users, BookOpen, Award, HardDrive } from 'lucide-react';
import { t } from '@/lib/i18n';
import { logger } from '@/lib/logger';

interface DBStats {
  totalUsers: number;
  studentsCount: number;
  teachersCount: number;
  adminsCount: number;
  totalCompletions: number;
  achievementsAwarded: number;
  dbSizeBytes: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return t('admin.stats.bytes.zero');
  const k = 1024;
  const sizes = [t('admin.stats.bytes.B'), t('admin.stats.bytes.KB'), t('admin.stats.bytes.MB'), t('admin.stats.bytes.GB')];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 10) / 10 + ' ' + sizes[i];
}

export default function DBStats() {
  const [stats, setStats] = useState<DBStats | null>(null);
  const [loading, setLoading] = useState(true);

  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    fetch('/api/admin/stats', { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to fetch');
        return r.json();
      })
      .then((data) => { if (!controller.signal.aborted) setStats(data.stats); })
      .catch((e) => {
        if (!controller.signal.aborted) {
          logger.error('Failed to fetch DB stats:', e);
          setStats(null);
        }
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  if (loading) return <p className="text-center py-4">{t('admin.stats.loading')}</p>;
  if (!stats) return <p className="text-center py-4 text-red-500">{t('admin.stats.error')}</p>;

  const statCards = [
    { label: t('admin.stats.totalUsers'), value: stats.totalUsers, icon: Users, color: 'text-blue-600 dark:text-blue-400' },
    { label: t('admin.stats.students'), value: stats.studentsCount, icon: Users, color: 'text-blue-400' },
    { label: t('admin.stats.teachers'), value: stats.teachersCount, icon: Users, color: 'text-amber-600 dark:text-amber-400' },
    { label: t('admin.stats.admins'), value: stats.adminsCount, icon: Users, color: 'text-red-600 dark:text-red-400' },
    { label: t('admin.stats.completions'), value: stats.totalCompletions, icon: BookOpen, color: 'text-emerald-600 dark:text-emerald-400' },
    { label: t('admin.stats.achievements'), value: stats.achievementsAwarded, icon: Award, color: 'text-purple-600 dark:text-purple-400' },
    { label: t('admin.stats.dbSize'), value: formatBytes(stats.dbSizeBytes), icon: Database, color: 'text-gray-600 dark:text-gray-400' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="h-5 w-5" />
          {t('admin.stats.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center p-4 rounded-lg border bg-card">
              <stat.icon className={`h-8 w-8 ${stat.color} mb-2`} />
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground text-center">{stat.label}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
