/**
 * Calculates user level and progress from total XP.
 * Each level N requires N * 100 XP to reach from level N-1.
 * Maximum level is 20.
 */
export function calculateLevel(totalXP: number): { level: number; progress: number; xpToNext: number } {
  const xp = Math.max(0, totalXP);
  let level = 1;
  let xpNeeded = 100;
  let cumulativeXP = 0;

  while (xp >= cumulativeXP + xpNeeded && level < 20) {
    cumulativeXP += xpNeeded;
    level++;
    xpNeeded = level * 100;
  }

  if (level >= 20) {
    return { level: 20, progress: 100, xpToNext: 0 };
  }

  const remainingXP = xp - cumulativeXP;
  const progress = Math.round((remainingXP / xpNeeded) * 100);
  const xpToNext = xpNeeded - remainingXP;

  return { level, progress, xpToNext };
}
