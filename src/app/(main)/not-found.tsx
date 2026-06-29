'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion, Home } from 'lucide-react';
import { t } from '@/lib/i18n';

export default function NotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <FileQuestion className="h-16 w-16 text-muted-foreground" />
      <h1 className="text-4xl font-bold tracking-tight">404</h1>
      <h2 className="text-lg font-semibold">{t('notFound.title')}</h2>
      <p className="max-w-md text-sm text-muted-foreground">{t('notFound.description')}</p>
      <Button asChild variant="outline">
        <Link href="/">
          <Home className="mr-2 h-4 w-4" />
          {t('notFound.home')}
        </Link>
      </Button>
    </div>
  );
}
