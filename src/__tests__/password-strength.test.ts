import { describe, it, expect } from 'vitest';
import { evaluatePasswordStrength } from '@/lib/password-strength';

describe('evaluatePasswordStrength', () => {
  it('returns zero score for empty password', () => {
    const result = evaluatePasswordStrength('');
    expect(result.score).toBe(0);
    expect(result.level).toBe('weak');
    expect(result.checks.minLength).toBe(false);
    expect(result.checks.uppercase).toBe(false);
    expect(result.checks.lowercase).toBe(false);
    expect(result.checks.digit).toBe(false);
    expect(result.checks.special).toBe(false);
  });

  it('returns weak for short lowercase-only password', () => {
    const result = evaluatePasswordStrength('abc');
    expect(result.score).toBe(20);
    expect(result.level).toBe('weak');
    expect(result.checks.minLength).toBe(false);
    expect(result.checks.lowercase).toBe(true);
  });

  it('returns fair with 3/5 checks (no minLength, no special)', () => {
    const result = evaluatePasswordStrength('Abcdef1');
    expect(result.score).toBe(60);
    expect(result.level).toBe('fair');
    expect(result.checks.minLength).toBe(false);
    expect(result.checks.uppercase).toBe(true);
    expect(result.checks.lowercase).toBe(true);
    expect(result.checks.digit).toBe(true);
    expect(result.checks.special).toBe(false);
  });

  it('returns strong for all 5 checks met', () => {
    const result = evaluatePasswordStrength('Abcdef1!');
    expect(result.score).toBe(100);
    expect(result.level).toBe('strong');
    expect(result.checks.minLength).toBe(true);
    expect(result.checks.uppercase).toBe(true);
    expect(result.checks.lowercase).toBe(true);
    expect(result.checks.digit).toBe(true);
    expect(result.checks.special).toBe(true);
  });

  it('classifies 80% (4/5) as strong', () => {
    const result = evaluatePasswordStrength('Abcdefg1');
    expect(result.score).toBe(80);
    expect(result.level).toBe('strong');
  });

  it('handles password with only special characters', () => {
    const result = evaluatePasswordStrength('!@#$%^&*');
    expect(result.checks.special).toBe(true);
    expect(result.checks.lowercase).toBe(false);
    expect(result.checks.uppercase).toBe(false);
    expect(result.checks.digit).toBe(false);
    expect(result.checks.minLength).toBe(true);
  });

  it('classifies below 60% as weak', () => {
    const result = evaluatePasswordStrength('Abcde');
    expect(result.score).toBe(40);
    expect(result.level).toBe('weak');
  });

  it('returns 20% for single lowercase letter', () => {
    const result = evaluatePasswordStrength('a');
    expect(result.score).toBe(20);
    expect(result.level).toBe('weak');
  });
});
