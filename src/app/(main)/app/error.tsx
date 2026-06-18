'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { t } from '@/lib/i18n';
import { logger } from '@/lib/logger';

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    logger.error('SQL Trainer error:', error);
  }, [error]);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <AlertTriangle className="h-12 w-12 text-amber-500" />
      <h2 className="text-lg font-semibold">{t('error.title')}</h2>
      <p className="max-w-md text-sm text-muted-foreground">{t('error.description')}</p>
      <Button onClick={reset} variant="outline">
        <RotateCcw className="mr-2 h-4 w-4" />
        {t('error.retry')}
      </Button>
    </div>
  );
}
