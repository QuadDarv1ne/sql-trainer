'use client';

import { BarChart3, FileText, Users, AlertCircle } from 'lucide-react';
import { t } from '@/lib/i18n';

interface EmptyStateProps {
  icon?: 'chart' | 'table' | 'users' | 'alert';
  title?: string;
  description?: string;
}

export default function EmptyState({ icon = 'chart', title, description }: EmptyStateProps) {
  const Icon = icon === 'table' ? FileText : icon === 'users' ? Users : icon === 'alert' ? AlertCircle : BarChart3;

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="h-12 w-12 text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-medium text-muted-foreground">
        {title || t('analytics.noData')}
      </h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
        {description || t('analytics.noDataDescription')}
      </p>
    </div>
  );
}
