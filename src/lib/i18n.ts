/**
 * Lightweight i18n system for SQL Trainer.
 * Supports Russian (default), English, and Chinese translations.
 *
 * Translation data lives in src/locales/{ru,en,zh}.json
 * (split from the original 327KB monolith for maintainability).
 */

import ru from '@/locales/ru.json';
import en from '@/locales/en.json';
import zh from '@/locales/zh.json';

export type Locale = 'ru' | 'en' | 'zh';

export const translations: Record<Locale, Record<string, string>> = { ru, en, zh };

// Current locale (can be persisted in localStorage)
let currentLocale: Locale = 'en';

export function setLocale(locale: Locale) {
  currentLocale = locale;
  if (typeof window !== 'undefined') {
    localStorage.setItem('sql-trainer-locale', locale);
    document.cookie = `sql-trainer-locale=${locale}; path=/; max-age=31536000; SameSite=Lax`;
  }
}

export function getLocale(): Locale {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('sql-trainer-locale') as Locale;
    if (stored && (stored === 'ru' || stored === 'en' || stored === 'zh')) {
      currentLocale = stored;
    }
  }
  return currentLocale;
}

export function t(key: string, params?: Record<string, string> & { default?: string }): string {
  const { default: defaultVal, ...restParams } = params || {};
  let value = translations[currentLocale]?.[key] ?? defaultVal ?? translations.ru[key] ?? key;
  if (restParams) {
    Object.entries(restParams).forEach(([k, v]) => {
      value = value.replace(`{${k}}`, v);
    });
  }
  return value;
}

/**
 * Translate with explicit locale without mutating global state.
 * Safe for server-side concurrent usage.
 */
export function tWithLocale(
  locale: Locale,
  key: string,
  params?: Record<string, string> & { default?: string },
): string {
  const { default: defaultVal, ...restParams } = params || {};
  let value = translations[locale]?.[key] || defaultVal || translations.ru[key] || key;
  if (restParams) {
    Object.entries(restParams).forEach(([k, v]) => {
      value = value.replace(`{${k}}`, v);
    });
  }
  return value;
}

/**
 * Parse locale from cookie string (server-side).
 * Returns the detected locale or defaults to 'ru'.
 */
export function getLocaleFromCookies(cookieHeader?: string | null): Locale {
  if (!cookieHeader) return 'ru';

  const match = cookieHeader.match(/sql-trainer-locale=([^;]+)/);
  if (match) {
    const locale = match[1] as Locale;
    if (locale === 'ru' || locale === 'en' || locale === 'zh') {
      return locale;
    }
  }
  return 'ru';
}
