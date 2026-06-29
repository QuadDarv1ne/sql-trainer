import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { t, setLocale, getLocale, translations, type Locale } from '@/lib/i18n';

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

    it('uses default value when key missing and default provided', () => {
      setLocale('en');
      expect(t('nonexistent.key', { default: 'Fallback text' })).toBe('Fallback text');
    });

    it('prefers default over ru fallback', () => {
      setLocale('en');
      // default should take priority over translations.ru[key]
      expect(t('whatever.missing', { default: 'My Default' })).toBe('My Default');
    });

    it('returns key name when missing everywhere and no default', () => {
      setLocale('en');
      expect(t('completely.missing.key')).toBe('completely.missing.key');
    });

    it('supports parameter interpolation', () => {
      expect(t('editor.placeholder.task', { title: 'SELECT' })).toBe('Напишите SQL запрос для: SELECT...');
    });

    it('interpolates parameters with default value', () => {
      setLocale('en');
      expect(t('greeting.missing', { name: 'Alice', default: 'Hello, {name}!' })).toBe('Hello, Alice!');
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

  // getPlural was removed as unused (was a stub returning singular)
});
