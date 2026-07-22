import { describe, it, expect } from 'vitest';
import { ACHIEVEMENTS } from '@/lib/db/schema';

describe('db/schema — ACHIEVEMENTS constant', () => {
  it('should export an array of achievements', () => {
    expect(Array.isArray(ACHIEVEMENTS)).toBe(true);
    expect(ACHIEVEMENTS.length).toBeGreaterThan(0);
  });

  it('should have required fields on every achievement', () => {
    for (const a of ACHIEVEMENTS) {
      expect(typeof a.id).toBe('string');
      expect(a.id.length).toBeGreaterThan(0);
      expect(typeof a.title).toBe('string');
      expect(typeof a.description).toBe('string');
      expect(typeof a.icon).toBe('string');
      expect(typeof a.conditionType).toBe('string');
      expect(typeof a.conditionValue).toBe('number');
    }
  });

  it('should have unique IDs', () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('should include first-query achievement', () => {
    const firstQuery = ACHIEVEMENTS.find((a) => a.id === 'first-query');
    expect(firstQuery).toBeDefined();
    expect(firstQuery!.conditionType).toBe('tasks_completed');
    expect(firstQuery!.conditionValue).toBe(1);
  });

  it('should include streak-5 achievement', () => {
    const streak5 = ACHIEVEMENTS.find((a) => a.id === 'streak-5');
    expect(streak5).toBeDefined();
    expect(streak5!.conditionType).toBe('streak_perfect');
  });
});
