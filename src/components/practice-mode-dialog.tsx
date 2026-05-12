'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useSQLTrainerStore } from '@/lib/store';
import {
  DIFFICULTY_LABELS,
  DIFFICULTY_COLORS,
  type Difficulty,
} from '@/lib/training-tasks';
import { Play, Shuffle, CheckCircle2, X } from 'lucide-react';

export default function PracticeModeDialog() {
  const { practiceMode, startPracticeMode, stopPracticeMode, nextPracticeTask, currentTaskId } =
    useSQLTrainerStore();
  const [open, setOpen] = useState(false);

  const handleStart = (difficulty: Difficulty | 'all') => {
    startPracticeMode(difficulty);
    setOpen(false);
  };

  const handleNext = () => {
    nextPracticeTask();
    setOpen(false);
  };

  if (practiceMode.active) {
    const currentIdx = practiceMode.currentIndex;
    const total = practiceMode.taskOrder.length;
    const completed = practiceMode.completedInSession.length;

    return (
      <div className="rounded-lg border-2 border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/30">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shuffle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              Режим практики
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500"
            onClick={stopPracticeMode}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="mb-2 text-xs text-emerald-600/70 dark:text-emerald-400/70">
          Задание {currentIdx + 1} из {total} &middot; Выполнено: {completed}
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={handleNext}
            disabled={currentIdx >= total - 1}
          >
            <Play className="mr-1.5 h-3.5 w-3.5" />
            Следующее
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={stopPracticeMode}
          >
            Завершить
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Shuffle className="mr-2 h-4 w-4" />
          Режим практики
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shuffle className="h-5 w-5 text-emerald-500" />
            Режим практики
          </DialogTitle>
          <DialogDescription>
            Выберите уровень сложности для случайного порядка заданий
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 pt-2">
          {(['all', 'beginner', 'intermediate', 'advanced'] as const).map((d) => (
            <button
              key={d}
              onClick={() => handleStart(d === 'all' ? 'all' : d as Difficulty)}
              className="flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted/50"
            >
              <Play className="h-4 w-4 text-emerald-500" />
              <span className="flex-1 text-sm font-medium">
                {d === 'all' ? 'Все задания' : DIFFICULTY_LABELS[d as Difficulty]}
              </span>
              {d !== 'all' && (
                <Badge className={`${DIFFICULTY_COLORS[d as Difficulty]} text-[10px]`}>
                  {DIFFICULTY_LABELS[d as Difficulty]}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
