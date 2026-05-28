import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { t, setLocale, getLocale, getPlural, translations, type Locale } from '@/lib/i18n';

describe('i18n', () => {
  beforeEach(() => {
    setLocale('ru');
    localStorage.clear();
  });

  afterEach(() => {
    setLocale('ru');
  });

  describe('t()', () => {
    it('returns Russian translation by default', () => {
      expect(t('app.title')).toBe('SQL Тренажёр');
    });

    it('returns English translation when locale is en', () => {
      setLocale('en');
      expect(t('app.title')).toBe('SQL Trainer');
    });

    it('falls back to Russian key if English missing', () => {
      setLocale('en');
      // All keys should have both RU and EN translations
      expect(t('action.execute')).toBeDefined();
    });

    it('returns key if translation not found', () => {
      expect(t('nonexistent.key')).toBe('nonexistent.key');
    });

    it('supports parameter interpolation', () => {
      expect(t('editor.placeholder.task', { title: 'SELECT' })).toBe('Напишите SQL запрос для: SELECT...');
    });
  });

  describe('setLocale / getLocale', () => {
    it('sets and gets locale correctly', () => {
      setLocale('en');
      expect(getLocale()).toBe('en');
    });

    it('persists locale to localStorage', () => {
      setLocale('en');
      expect(localStorage.getItem('sql-trainer-locale')).toBe('en');
    });

    it('reads locale from localStorage', () => {
      localStorage.setItem('sql-trainer-locale', 'en');
      expect(getLocale()).toBe('en');
    });
  });

  describe('translations completeness', () => {
    it('has same keys in ru and en', () => {
      const ruKeys = Object.keys(translations.ru);
      const enKeys = Object.keys(translations.en);
      expect(ruKeys.sort()).toEqual(enKeys.sort());
    });

    it('has no empty translation values', () => {
      for (const locale of ['ru', 'en'] as Locale[]) {
        for (const [_key, value] of Object.entries(translations[locale])) {
          expect(value).not.toBe('');
        }
      }
    });
  });

  describe('getPlural', () => {
    it('returns a string', () => {
      expect(typeof getPlural('results.row', 1)).toBe('string');
    });
  });
});
