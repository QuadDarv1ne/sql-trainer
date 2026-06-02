'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { getLocale, tWithLocale } from '@/lib/i18n';

/**
 * Компонент для автоматического переключения темы по времени суток.
 * Светлая тема с 7:00 до 20:00, тёмная — в остальное время.
 */
export function ThemeTimeSync() {
  const { setTheme, resolvedTheme, theme } = useTheme();
  const [lastThemeChange, setLastThemeChange] = useState<string | null>(null);

  // Use refs to avoid re-subscribing to interval on every state change
  const resolvedThemeRef = useRef(resolvedTheme);
  const lastThemeChangeRef = useRef(lastThemeChange);
  const themeRef = useRef(theme);

  useEffect(() => {
    resolvedThemeRef.current = resolvedTheme;
  }, [resolvedTheme]);

  useEffect(() => {
    lastThemeChangeRef.current = lastThemeChange;
  }, [lastThemeChange]);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    const updateTheme = () => {
      // Only auto-switch when theme is 'system' or undefined (user hasn't manually set)
      const current = themeRef.current;
      if (current !== 'system' && current !== undefined && current !== null) return;

      const hour = new Date().getHours();
      const shouldDark = hour < 7 || hour >= 20;
      const currentResolved = resolvedThemeRef.current === 'dark' ? 'dark' : 'light';
      const targetTheme = shouldDark ? 'dark' : 'light';
      const timeKey = `${new Date().toDateString()}-${targetTheme}`;

      if (currentResolved !== targetTheme && lastThemeChangeRef.current !== timeKey) {
        setTheme(targetTheme);
        setLastThemeChange(timeKey);

        const locale = getLocale();
        const themeName = targetTheme === 'dark'
          ? tWithLocale(locale, 'header.theme.dark')
          : tWithLocale(locale, 'header.theme.light');
        const timeDesc = shouldDark
          ? tWithLocale(locale, 'theme.time.evening')
          : tWithLocale(locale, 'theme.time.daytime');
        toast.info(tWithLocale(locale, 'theme.autoSwitch', { theme: themeName }), {
          description: `${hour}:00 — ${timeDesc}`,
        });
      }
    };

    updateTheme();

    const interval = setInterval(updateTheme, 60000);
    return () => clearInterval(interval);
  }, [setTheme]);

  return null;
}