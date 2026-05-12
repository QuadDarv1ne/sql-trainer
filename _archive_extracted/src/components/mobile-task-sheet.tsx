'use client';

import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen } from 'lucide-react';
import TaskPanel from '@/components/task-panel';
import type { TrainingTask } from '@/lib/training-tasks';

interface MobileTaskSheetProps {
  task: TrainingTask | null;
  isCompleted: boolean;
  hintVisible: boolean;
  onShowHint: () => void;
  solutionVisible?: boolean;
  onShowSolution?: () => void;
  onUseSolution?: (sql: string) => void;
  onNextTask?: () => void;
  nextTaskLabel?: string;
  isLastTask?: boolean;
  allCompleted?: boolean;
}

export default function MobileTaskSheet({
  task,
  isCompleted,
  hintVisible,
  onShowHint,
  solutionVisible,
  onShowSolution,
  onUseSolution,
  onNextTask,
  nextTaskLabel,
  isLastTask,
  allCompleted,
}: MobileTaskSheetProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 lg:hidden">
          <BookOpen className="h-3.5 w-3.5" />
          Задание
          {task && (
            <Badge variant="secondary" className="text-[10px] px-1.5 h-4">
              {task.title.length > 15 ? task.title.slice(0, 15) + '...' : task.title}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-xl">
        <SheetHeader className="border-b border-border px-4 py-3">
          <SheetTitle className="text-sm flex items-center gap-1.5">
            <BookOpen className="h-4 w-4 text-emerald-500" />
            {task ? task.title : 'Задание'}
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-1 h-[calc(85vh-52px)]">
          <TaskPanel
            task={task}
            isCompleted={isCompleted}
            hintVisible={hintVisible}
            onShowHint={onShowHint}
            solutionVisible={solutionVisible}
            onShowSolution={onShowSolution}
            onUseSolution={onUseSolution}
            onNextTask={onNextTask}
            nextTaskLabel={nextTaskLabel}
            isLastTask={isLastTask}
            allCompleted={allCompleted}
          />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
