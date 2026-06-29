'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { t } from '@/lib/i18n';
import { logger } from '@/lib/logger';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    logger.error('Global error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-8 text-center">
          <AlertTriangle className="h-16 w-16 text-destructive" />
          <h1 className="text-2xl font-bold">{t('global.error.title')}</h1>
          <p className="max-w-md text-muted-foreground">{t('global.error.desc')}</p>
          <pre className="max-w-2xl overflow-auto rounded-md bg-muted p-4 text-xs font-mono">{error.message}</pre>
          <Button onClick={reset} size="lg">
            <RotateCcw className="mr-2 h-4 w-4" />
            {t('global.error.refresh')}
          </Button>
        </div>
      </body>
    </html>
  );
}
