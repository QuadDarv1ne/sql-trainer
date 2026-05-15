'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import * as Icons from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { logger } from '@/lib/logger';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned_at: number;
}

export default function AchievementsGrid() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/user/achievements')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setAchievements(data.achievements);
      })
      .catch((e) => logger.error('Failed to fetch achievements', e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (achievements.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Icons.Award className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Достижений пока нет</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Выполняйте задания, чтобы получить бейджи</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {achievements.map((a) => {
        const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[a.icon] || Icons.Award;
        const earnedDate = new Date(a.earned_at).toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'short',
        });

        return (
          <Card key={a.id} className="border-emerald-200 dark:border-emerald-900/50">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <IconComponent className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-sm truncate">{a.title}</h4>
                  <Badge variant="secondary" className="text-[10px] px-1.5 shrink-0">
                    {earnedDate}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{a.description}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
