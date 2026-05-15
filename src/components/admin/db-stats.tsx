'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Users, BookOpen, Award, HardDrive } from 'lucide-react';

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
  if (bytes === 0) return '0 Б';
  const k = 1024;
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 10) / 10 + ' ' + sizes[i];
}

export default function DBStats() {
  const [stats, setStats] = useState<DBStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((data) => setStats(data.stats))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-center py-4">Загрузка статистики...</p>;
  if (!stats) return <p className="text-center py-4 text-red-500">Не удалось загрузить статистику</p>;

  const statCards = [
    { label: 'Всего пользователей', value: stats.totalUsers, icon: Users, color: 'text-blue-600' },
    { label: 'Студенты', value: stats.studentsCount, icon: Users, color: 'text-blue-400' },
    { label: 'Преподаватели', value: stats.teachersCount, icon: Users, color: 'text-amber-600' },
    { label: 'Администраторы', value: stats.adminsCount, icon: Users, color: 'text-red-600' },
    { label: 'Выполнено заданий', value: stats.totalCompletions, icon: BookOpen, color: 'text-emerald-600' },
    { label: 'Получено достижений', value: stats.achievementsAwarded, icon: Award, color: 'text-purple-600' },
    { label: 'Размер БД', value: formatBytes(stats.dbSizeBytes), icon: Database, color: 'text-gray-600' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="h-5 w-5" />
          Статистика базы данных
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
