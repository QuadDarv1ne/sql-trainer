/**
 * Validates that all i18n locale files have consistent keys.
 * Detects missing or extra keys between ru/en/zh locales.
 */
import { describe, it, expect } from 'vitest';
import ru from '@/locales/ru.json';
import en from '@/locales/en.json';
import zh from '@/locales/zh.json';

const locales = { ru, en, zh } as const;

describe('i18n locale key consistency', () => {
  const ruKeys = Object.keys(ru);
  const enKeys = Object.keys(en);
  const zhKeys = Object.keys(zh);

  it('ru and en have the same keys', () => {
    const missingInEn = ruKeys.filter((k) => !enKeys.includes(k));
    const extraInEn = enKeys.filter((k) => !ruKeys.includes(k));
    expect(missingInEn).toEqual([]);
    expect(extraInEn).toEqual([]);
  });

  it('ru and zh have the same keys', () => {
    const missingInZh = ruKeys.filter((k) => !zhKeys.includes(k));
    const extraInZh = zhKeys.filter((k) => !ruKeys.includes(k));
    expect(missingInZh).toEqual([]);
    expect(extraInZh).toEqual([]);
  });

  it('no locale has empty translation values', () => {
    const emptyKeys: string[] = [];
    for (const [locale, translations] of Object.entries(locales)) {
      for (const [key, value] of Object.entries(translations)) {
        if (!value || value.trim() === '') {
          emptyKeys.push(`${locale}:${key}`);
        }
      }
    }
    expect(emptyKeys).toEqual([]);
  });

  it('all locales have the same key count', () => {
    const counts = Object.entries(locales).map(([name, t]) => ({
      name,
      count: Object.keys(t).length,
    }));
    const unique = new Set(counts.map((c) => c.count));
    expect(unique.size).toBe(1);
  });
});
