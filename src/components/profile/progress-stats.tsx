'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TRAINING_TASKS, DIFFICULTY_LABELS, DIFFICULTY_COLORS } from '@/lib/training-tasks';
import { Trophy, Target, Zap, Award, Calendar } from 'lucide-react';

interface ProgressData {
  task_id: string;
  completed_at: number;
  attempts: number;
}

export default function ProgressStats() {
  const [progress, setProgress] = useState<ProgressData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/user/progress')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setProgress(data.progress);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  const totalTasks = TRAINING_TASKS.length;
  const completedCount = progress.length;
  const progressPercent = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;
  const totalAttempts = progress.reduce((sum, p) => sum + p.attempts, 0);
  const avgAttempts = completedCount > 0 ? (totalAttempts / completedCount).toFixed(1) : '0';

  // Stats by difficulty
  const difficulties = ['beginner', 'intermediate', 'advanced'] as const;
  const statsByDifficulty = difficulties.map((d) => {
    const total = TRAINING_TASKS.filter((t) => t.difficulty === d).length;
    const completed = progress.filter((p) => {
      const task = TRAINING_TASKS.find((t) => t.id === p.task_id);
      return task && task.difficulty === d;
    }).length;
    return { difficulty: d, total, completed };
  });

  // Best result (fewest attempts)
  const bestResult = progress.length > 0
    ? progress.reduce((best, p) => (p.attempts < best.attempts ? p : best), progress[0])
    : null;

  return (
    <div className="space-y-4">
      {/* Stats cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Target className="h-8 w-8 text-emerald-500" />
            <div>
              <p className="text-2xl font-bold">{completedCount}/{totalTasks}</p>
              <p className="text-xs text-muted-foreground">Заданий выполнено</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Zap className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-2xl font-bold">{avgAttempts}</p>
              <p className="text-xs text-muted-foreground">Среднее попыток</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Trophy className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold">{bestResult ? bestResult.attempts : '—'}</p>
              <p className="text-xs text-muted-foreground">Лучший результат</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Calendar className="h-8 w-8 text-sky-500" />
            <div>
              <p className="text-2xl font-bold">{Math.round(progressPercent)}%</p>
              <p className="text-xs text-muted-foreground">Общий прогресс</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall progress */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Общий прогресс</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={progressPercent} className="h-3" />
        </CardContent>
      </Card>

      {/* Progress by difficulty */}
      <div className="grid gap-3 sm:grid-cols-3">
        {statsByDifficulty.map(({ difficulty, total, completed }) => {
          const pct = total > 0 ? (completed / total) * 100 : 0;
          return (
            <Card key={difficulty}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <Badge className={`text-[10px] px-1.5 ${DIFFICULTY_COLORS[difficulty]}`}>
                    {DIFFICULTY_LABELS[difficulty]}
                  </Badge>
                  <span className="text-muted-foreground">{Math.round(pct)}%</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={pct} className="h-1.5" />
                <p className="mt-1 text-xs text-muted-foreground">{completed}/{total} заданий</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
