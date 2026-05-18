'use client';

import { useSQLTrainerStore, ACHIEVEMENTS, type Achievement } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Map achievement icons to Lucide icon names
const ACHIEVEMENT_ICONS: Record<string, string> = {
  '🎯': 'Target',
  '🌱': 'Sprout',
  '⭐': 'Star',
  '🏆': 'Trophy',
  '💯': 'Award',
  '🔥': 'Flame',
  '👑': 'Crown',
  '📊': 'BarChart3',
  '📚': 'BookOpen',
  '💥': 'Zap',
};

export default function AchievementsGrid() {
  const { unlockedAchievements } = useSQLTrainerStore();
  const unlockedIds = new Set(unlockedAchievements.map((a) => a.id));
  const allAchievements = Object.values(ACHIEVEMENTS);
  const unlockedCount = unlockedIds.size;
  const totalCount = allAchievements.length;

  return (
    <div>
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
          const iconName = ACHIEVEMENT_ICONS[a.icon] || 'Award';
          const IconComponent = getIcon(iconName);

          return (
            <Card
              key={a.id}
              className={
                unlocked
                  ? 'border-emerald-200 dark:border-emerald-900/50'
                  : 'border-border opacity-50'
              }
            >
              <CardContent className="p-4 flex items-start gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                    unlocked
                      ? 'bg-emerald-100 dark:bg-emerald-900/30'
                      : 'bg-muted'
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
                  {!unlocked && (
                    <p className="mt-1 text-[10px] text-muted-foreground/60">
                      🔒 Заблокировано
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function getIcon(name: string): React.ComponentType<{ className?: string }> {
  // Lazy import icons to avoid bundling all of lucide-react
  const icons = require('lucide-react') as Record<string, React.ComponentType<{ className?: string }>>;
  return icons[name] || icons.Award;
}
