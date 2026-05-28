'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe, Check } from 'lucide-react';
import { getLocale, setLocale, type Locale } from '@/lib/i18n';

const LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

export default function LocaleSelector() {
  const [locale, setLocalLocale] = useState<Locale>(() => getLocale());

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale);
    setLocalLocale(newLocale);
    // Reload page to apply translation
    window.location.reload();
  };

  const current = LOCALES.find((l) => l.code === locale);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs">
          <Globe className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{current?.flag} {current?.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LOCALES.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => handleLocaleChange(l.code)}
            className="flex items-center justify-between"
          >
            <span>
              {l.flag} {l.label}
            </span>
            {locale === l.code && <Check className="h-4 w-4 text-emerald-500" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
