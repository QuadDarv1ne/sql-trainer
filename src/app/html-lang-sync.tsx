'use client';

import { useEffect } from 'react';
import { getLocale } from '@/lib/i18n';

/**
 * Client component that syncs the html lang attribute with the user's selected locale.
 * Must be used inside <html> with suppressHydrationWarning.
 */
export function HtmlLangSync() {
  useEffect(() => {
    const locale = getLocale();
    document.documentElement.lang = locale;
  }, []);

  return null;
}
