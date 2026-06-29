import { describe, it, expect } from 'vitest';
import { toTitleCase } from '../lib/string-utils';

describe('toTitleCase', () => {
  it('converts kebab-case to Title Case', () => {
    expect(toTitleCase('select-basic')).toBe('Select Basic');
  });

  it('converts snake_case to Title Case', () => {
    expect(toTitleCase('where_clause')).toBe('Where Clause');
  });

  it('handles UPPERCASE words correctly', () => {
    expect(toTitleCase('SELECT_basic')).toBe('Select Basic');
    expect(toTitleCase('JOIN_left_outer')).toBe('Join Left Outer');
  });

  it('handles mixed separators', () => {
    expect(toTitleCase('select-basic_queries')).toBe('Select Basic Queries');
  });

  it('handles single word', () => {
    expect(toTitleCase('hello')).toBe('Hello');
    expect(toTitleCase('HELLO')).toBe('Hello');
  });

  it('handles multiple hyphens', () => {
    expect(toTitleCase('select-basic-queries')).toBe('Select Basic Queries');
  });
});
