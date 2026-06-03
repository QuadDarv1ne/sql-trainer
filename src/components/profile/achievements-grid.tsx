'use client';

import type * as React from 'react';
import { useSQLTrainerStore, ACHIEVEMENTS } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const STREAK_MILESTONES = [3, 5, 7, 14, 30] as const;

function StreakProgress() {
  const streak = useSQLTrainerStore((s) => s.streak);
  const currentStreak = streak.currentStreak;

  if (currentStreak === 0) return null;

  const nextMilestone = STREAK_MILESTONES.find((m) => m > currentStreak);
  const progress = nextMilestone ? (currentStreak / nextMilestone) * 100 : 100;

  return (
    <Card className="border-amber-200 dark:border-amber-900/50">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔥</span>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                Серия практики: <span className="text-amber-600">{currentStreak} дн.</span>
              </p>
              {nextMilestone && <p className="text-xs text-muted-foreground">До следующего: {nextMilestone} дн.</p>}
            </div>
            <Progress value={progress} className="mt-2 h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AchievementsGrid() {
  const { unlockedAchievements } = useSQLTrainerStore();
  const unlockedIds = new Set(unlockedAchievements.map((a) => a.id));
  const allAchievements = Object.values(ACHIEVEMENTS);
  const unlockedCount = unlockedIds.size;
  const totalCount = allAchievements.length;

  return (
    <div>
      <StreakProgress />
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Разблокировано: <span className="font-medium text-emerald-600">{unlockedCount}</span> из {totalCount}
        </p>
        <div className="h-2 w-32 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0}%` }}
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {allAchievements.map((a) => {
          const unlocked = unlockedIds.has(a.id);
          const unlockedData = unlockedAchievements.find((u) => u.id === a.id);

          return (
            <Card
              key={a.id}
              className={unlocked ? 'border-emerald-200 dark:border-emerald-900/50' : 'border-border opacity-50'}
            >
              <CardContent className="p-4 flex items-start gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                    unlocked ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-muted'
                  }`}
                >
                  <span className="text-lg">{a.icon}</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className={`text-sm font-medium truncate ${unlocked ? '' : 'text-muted-foreground'}`}>
                      {a.title}
                    </h4>
                    {unlocked && unlockedData?.unlockedAt && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 shrink-0">
                        {new Date(unlockedData.unlockedAt).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{a.description}</p>
                  {!unlocked && <p className="mt-1 text-[10px] text-muted-foreground/60">🔒 Заблокировано</p>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
