'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

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
      // Only auto-switch when user hasn't explicitly chosen a theme
      if (themeRef.current !== 'system' && themeRef.current !== undefined) return;

      const hour = new Date().getHours();
      const shouldDark = hour < 7 || hour >= 20;
      const currentTheme = resolvedThemeRef.current === 'dark' ? 'dark' : 'light';
      const targetTheme = shouldDark ? 'dark' : 'light';
      const timeKey = `${hour}-${shouldDark ? 'dark' : 'light'}`;

      if (currentTheme !== targetTheme && lastThemeChangeRef.current !== timeKey) {
        setTheme(targetTheme);
        setLastThemeChange(timeKey);

        const themeName = targetTheme === 'dark' ? 'тёмную' : 'светлую';
        toast.info(`Автоматически переключено на ${themeName} тему`, {
          description: `Сейчас ${hour}:00 — ${shouldDark ? 'вечер/ночь' : 'день'}`,
        });
      }
    };

    updateTheme();

    const interval = setInterval(updateTheme, 60000);
    return () => clearInterval(interval);
  }, [setTheme]);

  return null;
}