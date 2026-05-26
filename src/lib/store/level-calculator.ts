/**
 * Calculates user level and progress from total XP.
 * Each level N requires N * 100 XP to reach from level N-1.
 * Maximum level is 20.
 */
export function calculateLevel(totalXP: number): { level: number; progress: number; xpToNext: number } {
  let level = 1;
  let xpNeeded = 100;
  let cumulativeXP = 0;

  while (totalXP >= cumulativeXP + xpNeeded && level < 20) {
    cumulativeXP += xpNeeded;
    level++;
    xpNeeded = level * 100;
  }

  const remainingXP = totalXP - cumulativeXP;
  const progress = Math.round((remainingXP / xpNeeded) * 100);
  const xpToNext = xpNeeded - remainingXP;

  return { level, progress, xpToNext };
}
