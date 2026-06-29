import { describe, it, expect } from 'vitest';
import { generateProgressiveHints, getNextHintLevel, calculateHintPenalty } from '@/lib/progressive-hints';
import type { ProgressiveHint } from '@/lib/progressive-hints';

describe('generateProgressiveHints', () => {
  const predefinedHints: ProgressiveHint[] = [
    { level: 1, text: 'Predefined level 1 hint', xpPenalty: 0 },
    { level: 2, text: 'Predefined level 2 hint', xpPenalty: 5 },
    { level: 3, text: 'Predefined level 3 hint', xpPenalty: 15 },
  ];

  it('should return predefined hints when provided', () => {
    const result = generateProgressiveHints('task-1', 'old hint text', 'Task description', predefinedHints);
    expect(result).toEqual(predefinedHints);
  });

  it('should return predefined hints even when empty array is not provided', () => {
    const result = generateProgressiveHints('task-1', 'old hint text', 'Task description');
    expect(result).toHaveLength(3);
    expect(result[0].level).toBe(1);
    expect(result[1].level).toBe(2);
    expect(result[2].level).toBe(3);
  });

  it('should generate default hints from task description', () => {
    const taskText = 'Find all users with age greater than 25.';
    const result = generateProgressiveHints('task-2', 'Use SELECT and WHERE', taskText);
    expect(result[0].level).toBe(1);
    expect(result[0].xpPenalty).toBe(0);
    expect(result[0].text).toContain('find');
  });

  it('should generate level 2 hint from old hint with SQL keywords', () => {
    const oldHint = 'Use JOIN to combine tables and WHERE to filter';
    const result = generateProgressiveHints('task-3', oldHint, 'Some task');
    expect(result[1].level).toBe(2);
    expect(result[1].xpPenalty).toBe(5);
  });

  it('should pass through old hint as level 3', () => {
    const oldHint = 'SELECT * FROM users WHERE age > 25';
    const result = generateProgressiveHints('task-4', oldHint, 'Some task');
    expect(result[2].level).toBe(3);
    expect(result[2].text).toBe(oldHint);
    expect(result[2].xpPenalty).toBe(15);
  });

  it('should generate fallback when task has no recognizable keywords', () => {
    const result = generateProgressiveHints('task-5', 'Some hint', '');
    expect(result[0].level).toBe(1);
    expect(result[0].text).toContain('Read the task carefully');
    expect(result[0].xpPenalty).toBe(0);
  });

  it('should generate fallback level 2 when hint has no SQL keywords', () => {
    const result = generateProgressiveHints('task-6', 'Just a hint', 'Task description');
    expect(result[1].text).toContain('Identify');
  });
});

describe('getNextHintLevel', () => {
  it('should return 1 when no hint is revealed yet', () => {
    expect(getNextHintLevel(null)).toBe(1);
  });

  it('should return 2 when level 1 is revealed', () => {
    expect(getNextHintLevel(1)).toBe(2);
  });

  it('should return 3 when level 2 is revealed', () => {
    expect(getNextHintLevel(2)).toBe(3);
  });

  it('should return null when level 3 is revealed (no more hints)', () => {
    expect(getNextHintLevel(3)).toBeNull();
  });

  it('should return null for invalid values', () => {
    expect(getNextHintLevel(0)).toBeNull();
    expect(getNextHintLevel(4)).toBeNull();
    expect(getNextHintLevel(-1)).toBeNull();
  });
});

describe('calculateHintPenalty', () => {
  const hints: ProgressiveHint[] = [
    { level: 1, text: 'Hint 1', xpPenalty: 0 },
    { level: 2, text: 'Hint 2', xpPenalty: 5 },
    { level: 3, text: 'Hint 3', xpPenalty: 15 },
  ];

  it('should return 0 penalty for no revealed hints', () => {
    expect(calculateHintPenalty(hints, 0)).toBe(0);
  });

  it('should return 0 penalty for level 1 only (free hint)', () => {
    expect(calculateHintPenalty(hints, 1)).toBe(0);
  });

  it('should return 5 penalty for levels 1 and 2', () => {
    expect(calculateHintPenalty(hints, 2)).toBe(5);
  });

  it('should return 20 penalty for all 3 levels', () => {
    expect(calculateHintPenalty(hints, 3)).toBe(20);
  });

  it('should handle empty hints array', () => {
    expect(calculateHintPenalty([], 3)).toBe(0);
  });

  it('should handle revealed level greater than hints available', () => {
    expect(calculateHintPenalty(hints, 5)).toBe(20);
  });
});
