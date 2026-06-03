import { describe, it, expect } from 'vitest';
import { calculateLevel } from '@/lib/store/level-calculator';

describe('calculateLevel', () => {
  it('should return level 1 with 0 progress for 0 XP', () => {
    const result = calculateLevel(0);
    expect(result.level).toBe(1);
    expect(result.progress).toBe(0);
    expect(result.xpToNext).toBe(100);
  });

  it('should return level 1 with 50% progress for 50 XP', () => {
    const result = calculateLevel(50);
    expect(result.level).toBe(1);
    expect(result.progress).toBe(50);
    expect(result.xpToNext).toBe(50);
  });

  it('should return level 2 with 0% progress for exactly 100 XP', () => {
    const result = calculateLevel(100);
    expect(result.level).toBe(2);
    expect(result.progress).toBe(0);
    expect(result.xpToNext).toBe(200);
  });

  it('should return level 2 with 25% progress for 150 XP', () => {
    const result = calculateLevel(150);
    expect(result.level).toBe(2);
    expect(result.progress).toBe(25);
    expect(result.xpToNext).toBe(150);
  });

  it('should return level 3 for 300 XP (100 + 200)', () => {
    const result = calculateLevel(300);
    expect(result.level).toBe(3);
    expect(result.progress).toBe(0);
    expect(result.xpToNext).toBe(300);
  });

  it('should cap at level 20', () => {
    const maxLevel = 20;
    let totalXpNeeded = 0;
    for (let i = 1; i < maxLevel; i++) {
      totalXpNeeded += i * 100;
    }

    const atCap = calculateLevel(totalXpNeeded);
    expect(atCap.level).toBe(20);
    expect(atCap.progress).toBe(100);
    expect(atCap.xpToNext).toBe(0);

    const aboveCap = calculateLevel(totalXpNeeded + 10000);
    expect(aboveCap.level).toBe(20);
    expect(aboveCap.progress).toBe(100);
    expect(aboveCap.xpToNext).toBe(0);
  });

  it('should calculate cumulative XP correctly for level 5', () => {
    // Level 1→2: 100, 2→3: 200, 3→4: 300, 4→5: 400 = 1000 total
    const result = calculateLevel(1000);
    expect(result.level).toBe(5);
    expect(result.progress).toBe(0);
    expect(result.xpToNext).toBe(500);
  });

  it('should handle negative XP gracefully', () => {
    const result = calculateLevel(-10);
    expect(result.level).toBe(1);
    expect(result.progress).toBe(0);
  });

  it('should calculate progress for fractional mid-level values', () => {
    const result = calculateLevel(175);
    expect(result.level).toBe(2);
    expect(result.progress).toBe(38);
    expect(result.xpToNext).toBe(125);
  });

  it('should ensure progress never exceeds 100', () => {
    const result = calculateLevel(101);
    expect(result.level).toBe(2);
    expect(result.progress).toBeLessThanOrEqual(100);
  });

  it('should maintain monotonic level progression', () => {
    let prevLevel = 0;
    for (const xp of [0, 50, 100, 150, 300, 500, 800, 1200, 2000, 5000, 20000]) {
      const result = calculateLevel(xp);
      expect(result.level).toBeGreaterThanOrEqual(prevLevel);
      prevLevel = result.level;
    }
  });
});
