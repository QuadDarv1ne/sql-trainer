'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun, SunMoon } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ThemeValue = 'light' | 'dark' | 'system';

const themeCycle: ThemeValue[] = ['light', 'dark', 'system'];

interface ThemeToggleProps {
  size?: 'sm' | 'default';
  className?: string;
}

export function ThemeToggle({ size = 'default', className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleToggle = () => {
    const current = (theme as ThemeValue) || 'system';
    const currentIndex = themeCycle.indexOf(current);
    const next = themeCycle[(currentIndex + 1) % themeCycle.length];
    setTheme(next);
  };

  const btnClass = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';
  const iconClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  // Placeholder during SSR/hydration to prevent mismatch
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className={`${btnClass} ${className || ''}`} aria-label="Toggle theme">
        <Sun className={iconClass} />
      </Button>
    );
  }

  const Icon = theme === 'dark' ? Moon : theme === 'system' ? SunMoon : Sun;
  const nextTheme = themeCycle[(themeCycle.indexOf((theme as ThemeValue) || 'system') + 1) % themeCycle.length];

  return (
    <Button
      variant="ghost"
      size="icon"
      className={`${btnClass} ${className || ''}`}
      onClick={handleToggle}
      aria-label={`Switch to ${nextTheme} theme`}
    >
      <Icon className={iconClass} />
    </Button>
  );
}
