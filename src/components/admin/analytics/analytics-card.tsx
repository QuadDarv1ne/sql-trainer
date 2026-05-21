/**
 * AnalyticsCard — universal wrapper for analytics components.
 * Provides consistent Card + loading/error/empty states + refresh button.
 */
'use client';

import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { t } from '@/lib/i18n';
import EmptyState from '@/components/admin/analytics/empty-state';

interface AnalyticsCardProps {
  title?: string;
  description?: string;
  loading: boolean;
  error: string | null;
  empty?: boolean;
  /** Optional callback to refetch data (replaces full page reload) */
  onRefresh?: () => void;
  children: ReactNode;
  className?: string;
}

export function AnalyticsCard({
  title,
  description,
  loading,
  error,
  empty = false,
  onRefresh,
  children,
  className = '',
}: AnalyticsCardProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">{t('analytics.loading')}</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="rounded p-1.5 hover:bg-muted transition-colors"
              title={t('analytics.refresh')}
            >
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (empty) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="rounded p-1.5 hover:bg-muted transition-colors"
              title={t('analytics.refresh')}
            >
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </CardHeader>
        <CardContent>
          <EmptyState />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {(title || description || onRefresh) && (
        <CardHeader className="flex flex-row items-start justify-between pb-2">
          <div>
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="rounded p-1.5 hover:bg-muted transition-colors shrink-0"
              title={t('analytics.refresh')}
            >
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
    </Card>
  );
}
