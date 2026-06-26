'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HelpCircle, Keyboard } from 'lucide-react';
import { t } from '@/lib/i18n';

const SHORTCUTS = [
  {
    category: t('shortcuts.execution'),
    items: [
      { keys: 'Ctrl + Enter', description: t('shortcuts.execute') },
      { keys: 'Ctrl + L', description: t('shortcuts.clearEditor') },
    ],
  },
  {
    category: t('shortcuts.editor'),
    items: [
      { keys: 'Tab', description: t('shortcuts.indentDesc') },
      { keys: 'Ctrl + Z', description: t('shortcuts.undo') },
      { keys: 'Ctrl + Shift + Z', description: t('shortcuts.redo') },
      { keys: 'Ctrl + F', description: t('shortcuts.find') },
      { keys: 'Ctrl + /', description: t('shortcuts.comment') },
      { keys: 'Ctrl + Shift + F', description: t('shortcuts.formatSql') },
    ],
  },
  {
    category: t('shortcuts.hints'),
    items: [
      { keys: 'Ctrl + Shift + H', description: t('shortcuts.showHint') },
      { keys: 'Ctrl + Shift + S', description: t('shortcuts.showSolution') },
    ],
  },
  {
    category: t('shortcuts.navigation'),
    items: [
      { keys: 'Ctrl + G', description: t('shortcuts.goToLine') },
      { keys: 'Home / End', description: t('shortcuts.lineStartEnd') },
      { keys: 'Ctrl + Home / End', description: t('shortcuts.documentStartEnd') },
      { keys: 'Ctrl + D', description: t('shortcuts.selectNext') },
    ],
  },
  {
    category: t('shortcuts.interface', { default: 'Interface' }),
    items: [
      { keys: 'Ctrl + B', description: t('shortcuts.toggleSidebar', { default: 'Toggle sidebar' }) },
      { keys: 'Ctrl + Shift + D', description: t('shortcuts.toggleTheme', { default: 'Toggle theme' }) },
    ],
  },
];

export default function ShortcutsHelp() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={t('shortcuts.title')}>
          <HelpCircle className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-emerald-500" />
            {t('shortcuts.title')}
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
                  <div key={item.keys} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
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
