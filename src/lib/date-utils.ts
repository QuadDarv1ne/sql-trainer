/**
 * Shared date formatting utilities.
 * Consolidates duplicate formatDate functions across components.
 */
import { getLocale } from './i18n';

/**
 * Format a timestamp for display (locale-aware).
 * Includes day, short month, hour, and minute.
 */
export function formatDateDisplay(ts: number): string {
  const locale = getLocale() === 'en' ? 'en-US' : 'ru-RU';
  return new Date(ts).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a timestamp for display with year (locale-aware).
 * Includes day, short month, year, hour, and minute.
 */
export function formatDateDisplayWithYear(ts: number): string {
  const locale = getLocale() === 'en' ? 'en-US' : 'ru-RU';
  return new Date(ts).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
