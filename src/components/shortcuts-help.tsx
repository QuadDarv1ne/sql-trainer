'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HelpCircle, Keyboard } from 'lucide-react';

const SHORTCUTS = [
  {
    category: 'Выполнение',
    items: [
      { keys: 'Ctrl + Enter', description: 'Выполнить запрос' },
      { keys: 'Ctrl + L', description: 'Очистить редактор' },
    ],
  },
  {
    category: 'Редактор',
    items: [
      { keys: 'Tab', description: 'Отступ (2 пробела)' },
      { keys: 'Ctrl + Z', description: 'Отменить' },
      { keys: 'Ctrl + Shift + Z', description: 'Повторить' },
      { keys: 'Ctrl + F', description: 'Найти' },
      { keys: 'Ctrl + /', description: 'Комментарий' },
      { keys: 'Ctrl + Shift + F', description: 'Форматировать SQL' },
    ],
  },
  {
    category: 'Подсказки',
    items: [
      { keys: 'Ctrl + Shift + H', description: 'Показать подсказку к заданию' },
      { keys: 'Ctrl + Shift + S', description: 'Показать решение' },
    ],
  },
  {
    category: 'Навигация',
    items: [
      { keys: 'Ctrl + G', description: 'Перейти к строке' },
      { keys: 'Home / End', description: 'Начало / конец строки' },
      { keys: 'Ctrl + Home / End', description: 'Начало / конец документа' },
      { keys: 'Ctrl + D', description: 'Выделить следующее вхождение' },
    ],
  },
];

export default function ShortcutsHelp() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <HelpCircle className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-emerald-500" />
            Горячие клавиши
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {SHORTCUTS.map((section) => (
            <div key={section.category}>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {section.category}
              </h4>
              <div className="space-y-1.5">
                {section.items.map((item) => (
                  <div
                    key={item.keys}
                    className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
                  >
                    <span className="text-sm">{item.description}</span>
                    <kbd className="rounded border border-border bg-background px-2 py-0.5 font-mono text-xs">
                      {item.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
