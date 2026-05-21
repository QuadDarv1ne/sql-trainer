import { describe, it, expect } from 'vitest';
import { sanitizeString, sanitizeName, sanitizePhone } from '@/lib/sanitization';

describe('sanitizeString', () => {
  it('strips HTML tags', () => {
    expect(sanitizeString('<script>alert(1)</script>hello')).toBe('alert(1)hello');
    expect(sanitizeString('<b>bold</b>')).toBe('bold');
  });

  it('strips null bytes', () => {
    expect(sanitizeString('hello\0world')).toBe('helloworld');
  });

  it('strips control characters', () => {
    expect(sanitizeString('hello\x01\x02world')).toBe('helloworld');
  });

  it('trims whitespace', () => {
    expect(sanitizeString('  hello  ')).toBe('hello');
  });

  it('preserves normal text', () => {
    expect(sanitizeString('John Doe')).toBe('John Doe');
  });
});

describe('sanitizeName', () => {
  it('validates and returns clean name', () => {
    const result = sanitizeName('  John Doe  ');
    expect(result.error).toBeUndefined();
    expect(result.value).toBe('John Doe');
  });

  it('rejects empty names', () => {
    expect(sanitizeName('')).toEqual({ value: '', error: 'Name must be 1-100 characters' });
    expect(sanitizeName('   ')).toEqual({ value: '', error: 'Name must be 1-100 characters' });
  });

  it('rejects names over 100 characters', () => {
    const longName = 'a'.repeat(101);
    const result = sanitizeName(longName);
    expect(result.error).toBeDefined();
  });

  it('allows unicode letters', () => {
    const result = sanitizeName('Иван Петров');
    expect(result.error).toBeUndefined();
    expect(result.value).toBe('Иван Петров');
  });

  it('allows hyphens and apostrophes', () => {
    const result = sanitizeName("Mary-Jane O'Brien");
    expect(result.error).toBeUndefined();
    expect(result.value).toBe("Mary-Jane O'Brien");
  });

  it('rejects HTML injection', () => {
    const result = sanitizeName('<script>alert(1)</script>');
    expect(result.error).toBeDefined();
  });

  it('rejects special characters', () => {
    const result = sanitizeName('John@Doe!');
    expect(result.error).toBeDefined();
  });
});

describe('sanitizePhone', () => {
  it('validates and returns clean phone', () => {
    const result = sanitizePhone('+7 (999) 123-45-67');
    expect(result.error).toBeUndefined();
    expect(result.value).toBe('+7 (999) 123-45-67');
  });

  it('allows empty phone', () => {
    const result = sanitizePhone('');
    expect(result.value).toBe('');
    expect(result.error).toBeUndefined();
  });

  it('rejects phones over 20 characters', () => {
    const result = sanitizePhone('+123456789012345678901');
    expect(result.error).toBeDefined();
  });

  it('rejects letters in phone', () => {
    const result = sanitizePhone('+1abc');
    expect(result.error).toBeDefined();
  });

  it('allows digits and common separators', () => {
    const result = sanitizePhone('8-999-123-45-67');
    expect(result.error).toBeUndefined();
  });
});
