import { describe, it, expect } from 'vitest';
import { deepSanitize } from '@/lib/api-sanitize';

describe('deepSanitize', () => {
  it('sanitizes HTML tags from strings', () => {
    const input = { name: '<script>alert("xss")</script>Hello' };
    const result = deepSanitize(input);
    expect(result.name).toBe('alert("xss")Hello');
  });

  it('sanitizes null bytes', () => {
    const input = { text: 'hello\x00world' };
    const result = deepSanitize(input);
    expect(result.text).toBe('helloworld');
  });

  it('sanitizes control characters', () => {
    const input = { text: 'hello\x01\x02\x03world' };
    const result = deepSanitize(input);
    expect(result.text).toBe('helloworld');
  });

  it('preserves numbers', () => {
    const input = { count: 42, price: 9.99 };
    const result = deepSanitize(input);
    expect(result.count).toBe(42);
    expect(result.price).toBe(9.99);
  });

  it('preserves booleans', () => {
    const input = { active: true, deleted: false };
    const result = deepSanitize(input);
    expect(result.active).toBe(true);
    expect(result.deleted).toBe(false);
  });

  it('preserves null and undefined', () => {
    const input = { a: null, b: undefined };
    const result = deepSanitize(input);
    expect(result.a).toBeNull();
    expect(result.b).toBeUndefined();
  });

  it('sanitizes nested objects recursively', () => {
    const input = {
      user: {
        name: '<b>Admin</b>',
        address: {
          city: '<img src=x onerror=alert(1)>New York',
        },
      },
    };
    const result = deepSanitize(input);
    expect(result.user.name).toBe('Admin');
    expect(result.user.address.city).toBe('New York');
  });

  it('sanitizes arrays', () => {
    const input = ['<script>xss</script>', 'safe', '<b>bold</b>'];
    const result = deepSanitize(input);
    expect(result).toEqual(['xss', 'safe', 'bold']);
  });

  it('truncates overly long strings', () => {
    const longString = 'a'.repeat(15000);
    const input = { text: longString };
    const result = deepSanitize(input);
    expect(result.text.length).toBe(10000);
  });

  it('handles empty input', () => {
    expect(deepSanitize(null)).toBeNull();
    expect(deepSanitize(undefined)).toBeUndefined();
    expect(deepSanitize('')).toBe('');
    expect(deepSanitize(0)).toBe(0);
  });

  it('handles mixed arrays with objects', () => {
    const input = [{ name: '<b>test</b>', value: 42 }, 'plain string', null, [1, 2, 3]];
    const result = deepSanitize(input);
    expect(result[0]).toEqual({ name: 'test', value: 42 });
    expect(result[1]).toBe('plain string');
    expect(result[2]).toBeNull();
    expect(result[3]).toEqual([1, 2, 3]);
  });

  it('sanitizes object keys', () => {
    const input = { '<script>bad</script>key': 'value' } as Record<string, unknown>;
    const result = deepSanitize(input);
    const keys = Object.keys(result);
    expect(keys[0]).not.toContain('<script>');
  });
});
