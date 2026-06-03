'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';

/**
 * Dynamically updates the <meta name="theme-color"> tag
 * based on the current theme to match the browser UI.
 */
export function ThemeColorMeta() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', resolvedTheme === 'dark' ? '#0c0a09' : '#10b981');
    }
  }, [resolvedTheme]);

  return null;
}
