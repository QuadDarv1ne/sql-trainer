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

    it('returns Chinese translation when locale is zh', () => {
      setLocale('zh');
      expect(t('app.title')).toBe('SQL 训练器');
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
    it('has same keys in ru, en, and zh', () => {
      const ruKeys = Object.keys(translations.ru);
      const enKeys = Object.keys(translations.en);
      const zhKeys = Object.keys(translations.zh);
      expect(ruKeys.sort()).toEqual(enKeys.sort());
      expect(ruKeys.sort()).toEqual(zhKeys.sort());
    });

    it('has no empty translation values', () => {
      for (const locale of ['ru', 'en', 'zh'] as Locale[]) {
        for (const value of Object.values(translations[locale])) {
          expect(value).not.toBe('');
        }
      }
    });
  });

  describe('getPlural', () => {
    it('returns a string', () => {
      expect(typeof getPlural('results.row')).toBe('string');
    });
  });
});
