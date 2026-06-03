import { describe, it, expect } from 'vitest';
import { plural } from '@/lib/utils';

describe('plural', () => {
  describe('Russian plural rules', () => {
    const forms = { one: 'задача', few: 'задачи', many: 'задач' };

    it('should use "one" form for numbers ending in 1 (except 11)', () => {
      expect(plural(1, forms.one, forms.few, forms.many)).toBe('задача');
      expect(plural(21, forms.one, forms.few, forms.many)).toBe('задача');
      expect(plural(31, forms.one, forms.few, forms.many)).toBe('задача');
      expect(plural(101, forms.one, forms.few, forms.many)).toBe('задача');
      expect(plural(121, forms.one, forms.few, forms.many)).toBe('задача');
    });

    it('should use "few" form for numbers ending in 2-4 (except 12-14)', () => {
      expect(plural(2, forms.one, forms.few, forms.many)).toBe('задачи');
      expect(plural(3, forms.one, forms.few, forms.many)).toBe('задачи');
      expect(plural(4, forms.one, forms.few, forms.many)).toBe('задачи');
      expect(plural(22, forms.one, forms.few, forms.many)).toBe('задачи');
      expect(plural(34, forms.one, forms.few, forms.many)).toBe('задачи');
    });

    it('should use "many" form for numbers ending in 5-0', () => {
      expect(plural(5, forms.one, forms.few, forms.many)).toBe('задач');
      expect(plural(10, forms.one, forms.few, forms.many)).toBe('задач');
      expect(plural(20, forms.one, forms.few, forms.many)).toBe('задач');
      expect(plural(25, forms.one, forms.few, forms.many)).toBe('задач');
      expect(plural(100, forms.one, forms.few, forms.many)).toBe('задач');
    });

    it('should use "many" form for numbers 11-14', () => {
      expect(plural(11, forms.one, forms.few, forms.many)).toBe('задач');
      expect(plural(12, forms.one, forms.few, forms.many)).toBe('задач');
      expect(plural(13, forms.one, forms.few, forms.many)).toBe('задач');
      expect(plural(14, forms.one, forms.few, forms.many)).toBe('задач');
    });

    it('should use "many" form for 111-114', () => {
      expect(plural(111, forms.one, forms.few, forms.many)).toBe('задач');
      expect(plural(112, forms.one, forms.few, forms.many)).toBe('задач');
      expect(plural(113, forms.one, forms.few, forms.many)).toBe('задач');
      expect(plural(114, forms.one, forms.few, forms.many)).toBe('задач');
    });
  });

  describe('edge cases', () => {
    const forms = { one: 'балл', few: 'балла', many: 'баллов' };

    it('should handle zero', () => {
      expect(plural(0, forms.one, forms.few, forms.many)).toBe('баллов');
    });

    it('should handle negative numbers by treating them as positive', () => {
      // JS modulo on negative numbers gives negative results,
      // so negative numbers fall through to "many" form
      expect(plural(-1, forms.one, forms.few, forms.many)).toBe('баллов');
      expect(plural(-2, forms.one, forms.few, forms.many)).toBe('баллов');
      expect(plural(-5, forms.one, forms.few, forms.many)).toBe('баллов');
    });

    it('should handle large numbers', () => {
      expect(plural(1001, forms.one, forms.few, forms.many)).toBe('балл');
      expect(plural(1002, forms.one, forms.few, forms.many)).toBe('балла');
      expect(plural(1005, forms.one, forms.few, forms.many)).toBe('баллов');
      expect(plural(1011, forms.one, forms.few, forms.many)).toBe('баллов');
    });
  });
});
