'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Keyboard } from 'lucide-react';

const SHORTCUTS = [
  { keys: ['Ctrl', 'Enter'], description: 'Выполнить запрос' },
  { keys: ['Ctrl', 'L'], description: 'Очистить редактор и результаты' },
  { keys: ['Ctrl', 'Shift', 'F'], description: 'Форматировать SQL' },
  { keys: ['Ctrl', 'Shift', 'H'], description: 'Показать подсказку к заданию' },
  { keys: ['Ctrl', 'Shift', 'S'], description: 'Показать/скрыть решение' },
  { keys: ['Tab'], description: 'Вставить 2 пробела' },
  { keys: ['Ctrl', 'Z'], description: 'Отменить (Undo)' },
  { keys: ['Ctrl', 'Shift', 'Z'], description: 'Повторить (Redo)' },
  { keys: ['Ctrl', 'F'], description: 'Поиск в редакторе' },
  { keys: ['Ctrl', 'A'], description: 'Выделить весь текст' },
];

export default function ShortcutsDialog() {
  const [open, setOpen] = useState(false);

  // Global shortcut: Ctrl+K to open shortcuts dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Keyboard className="h-4 w-4" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Горячие клавиши (Ctrl+K)</TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Keyboard className="h-5 w-5 text-emerald-500" />
            Горячие клавиши
          </DialogTitle>
        </DialogHeader>
        <div className="divide-y divide-border">
          {SHORTCUTS.map((shortcut) => (
            <div
              key={shortcut.description}
              className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
            >
              <span className="text-sm text-muted-foreground">{shortcut.description}</span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key, idx) => (
                  <span key={idx}>
                    <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded border border-border bg-muted px-1.5 text-[11px] font-mono font-medium text-foreground shadow-sm">
                      {key}
                    </kbd>
                    {idx < shortcut.keys.length - 1 && (
                      <span className="mx-0.5 text-[10px] text-muted-foreground">+</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
