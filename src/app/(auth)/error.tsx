'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw, LogIn } from 'lucide-react';
import { logger } from '@/lib/logger';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Auth route error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <AlertTriangle className="h-12 w-12 text-amber-500" />
      <h2 className="text-lg font-semibold">Произошла ошибка</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        Ошибка при загрузке страницы. Попробуйте обновить страницу или войдите заново.
      </p>
      <div className="flex gap-2">
        <Button onClick={reset} variant="outline">
          <RotateCcw className="mr-2 h-4 w-4" />
          Попробовать снова
        </Button>
        <Button onClick={() => (window.location.href = '/login')}>
          <LogIn className="mr-2 h-4 w-4" />
          На вход
        </Button>
      </div>
    </div>
  );
}
