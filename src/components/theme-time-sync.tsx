'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { getLocale, tWithLocale } from '@/lib/i18n';

/**
 * Компонент для автоматического переключения темы по времени суток.
 * Светлая тема с 7:00 до 20:00, тёмная — в остальное время.
 * Работает только когда пользователь выбрал системную тему (theme=system).
 */
export function ThemeTimeSync() {
  const { setTheme, resolvedTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const themeValueRef = useRef(theme);
  const resolvedRef = useRef(resolvedTheme);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { themeValueRef.current = theme; }, [theme]);
  useEffect(() => { resolvedRef.current = resolvedTheme; }, [resolvedTheme]);

  useEffect(() => {
    if (!mounted) return;

    const updateTheme = () => {
      const current = themeValueRef.current;
      // Interfere only when user relies on system preference (or hasn't chosen yet)
      if (current && current !== 'system') return;

      const hour = new Date().getHours();
      const shouldDark = hour < 7 || hour >= 20;
      const targetTheme = shouldDark ? 'dark' : 'light';
      const currentResolved = resolvedRef.current === 'dark' ? 'dark' : 'light';

      if (currentResolved !== targetTheme) {
        setTheme(targetTheme);
        const locale = getLocale();
        const themeName = targetTheme === 'dark'
          ? tWithLocale(locale, 'header.theme.dark')
          : tWithLocale(locale, 'header.theme.light');
        const timeDesc = shouldDark
          ? tWithLocale(locale, 'theme.time.evening')
          : tWithLocale(locale, 'theme.time.daytime');
        toast.info(tWithLocale(locale, 'theme.autoSwitch', { theme: themeName }), {
          description: `${hour}:00 — ${timeDesc}`,
          duration: 4000,
        });

        // After auto-switching, schedule a reset back to 'system'
        // so the system theme can take over again at the next time boundary
        const minutesToBoundary = shouldDark
          ? (7 - hour + 24) % 24 * 60
          : (20 - hour + 24) % 24 * 60;
        if (minutesToBoundary > 0) {
          setTimeout(() => {
            // Reset to system — OS or next time boundary will handle the switch
            if (themeValueRef.current !== 'system') {
              setTheme('system');
            }
          }, minutesToBoundary * 60 * 1000);
        }
      }
    };

    updateTheme();
    const interval = setInterval(updateTheme, 60000);
    return () => clearInterval(interval);
  }, [mounted, setTheme, theme, resolvedTheme]);

  return null;
}
