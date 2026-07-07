import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/i18n', () => ({
  getLocale: vi.fn(() => 'en'),
}));

import { formatDateDisplay, formatDateDisplayWithYear } from '@/lib/date-utils';
import { getLocale } from '@/lib/i18n';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('date-utils', () => {
  describe('formatDateDisplay', () => {
    it('formats timestamp with en-US locale', () => {
      vi.mocked(getLocale).mockReturnValue('en');
      const ts = new Date('2026-06-15T14:30:00Z').getTime();
      const result = formatDateDisplay(ts);
      expect(result).toContain('Jun');
      expect(result).toContain('15');
    });

    it('formats timestamp with ru-RU locale', () => {
      vi.mocked(getLocale).mockReturnValue('ru');
      const ts = new Date('2026-06-15T14:30:00Z').getTime();
      const result = formatDateDisplay(ts);
      expect(result).toContain('15');
    });

    it('includes hour and minute', () => {
      vi.mocked(getLocale).mockReturnValue('en');
      const ts = new Date('2026-06-15T14:30:00Z').getTime();
      const result = formatDateDisplay(ts);
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });

    it('returns a string', () => {
      vi.mocked(getLocale).mockReturnValue('en');
      expect(typeof formatDateDisplay(Date.now())).toBe('string');
    });
  });

  describe('formatDateDisplayWithYear', () => {
    it('formats timestamp with year included', () => {
      vi.mocked(getLocale).mockReturnValue('en');
      const ts = new Date('2026-06-15T14:30:00Z').getTime();
      const result = formatDateDisplayWithYear(ts);
      expect(result).toContain('2026');
      expect(result).toContain('Jun');
    });

    it('formats with ru-RU locale', () => {
      vi.mocked(getLocale).mockReturnValue('ru');
      const ts = new Date('2026-12-25T10:00:00Z').getTime();
      const result = formatDateDisplayWithYear(ts);
      expect(result).toContain('2026');
    });

    it('includes hour and minute', () => {
      vi.mocked(getLocale).mockReturnValue('en');
      const ts = new Date('2026-06-15T14:30:00Z').getTime();
      const result = formatDateDisplayWithYear(ts);
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });

    it('returns a string', () => {
      vi.mocked(getLocale).mockReturnValue('en');
      expect(typeof formatDateDisplayWithYear(Date.now())).toBe('string');
    });
  });
});
