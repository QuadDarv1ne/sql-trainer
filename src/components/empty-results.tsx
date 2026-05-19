'use client';

import { t } from '@/lib/i18n';
import { Table as TableIcon } from 'lucide-react';

export default function EmptyResults() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="rounded-full bg-muted p-4">
        <TableIcon className="h-8 w-8 text-muted-foreground/40" />
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          {t('results.title')}
        </p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          {t('results.executeHint')}
        </p>
      </div>
    </div>
  );
}
