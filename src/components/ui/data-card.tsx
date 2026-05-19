'use client';

import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { t } from '@/lib/i18n';

interface DataCardProps {
  title?: string;
  loading: boolean;
  error: string;
  hasData: boolean;
  onRetry?: () => void;
  children: ReactNode;
}

/**
 * Wrapper for data-fetching cards: shows skeleton while loading,
 * error alert with retry button on failure, or the actual content.
 */
export default function DataCard({
  title,
  loading,
  error,
  hasData,
  onRetry,
  children,
}: DataCardProps) {
  if (loading) {
    return (
      <Card>
        {title && (
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between gap-2">
          <span>{error}</span>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw className="h-3 w-3 mr-1" />
              {t('common.retry')}
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (!hasData) {
    return <p className="text-center py-4 text-muted-foreground">{t('teacher.noData')}</p>;
  }

  if (!title) return <>{children}</>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
