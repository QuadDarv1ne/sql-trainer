import { describe, it, expect } from 'vitest';

interface SkillGap {
  category: string;
  tasks_total: number;
  tasks_completed: number;
  completion_pct: number;
  avg_attempts: number;
  struggle_tasks: { task_id: string; title: string; attempts: number }[];
  strength_level: 'weak' | 'developing' | 'proficient' | 'strong' | 'mastered';
}

function determineStrengthLevel(completionPct: number, avgAttempts: number): SkillGap['strength_level'] {
  if (completionPct >= 90 && avgAttempts <= 1.5) return 'mastered';
  if (completionPct >= 75) return 'strong';
  if (completionPct >= 50) return 'proficient';
  if (completionPct >= 25) return 'developing';
  return 'weak';
}

function computeSkillGaps(
  tasks: Array<{ id: string; title: string; category: string }>,
  completedTasks: Array<{ task_id: string; attempts: number }>,
): SkillGap[] {
  const completedMap = new Map(completedTasks.map((t) => [t.task_id, t.attempts]));
  const categoryMap = new Map<
    string,
    {
      total: number;
      completed: number;
      totalAttempts: number;
      struggleTasks: { task_id: string; title: string; attempts: number }[];
    }
  >();

  for (const task of tasks) {
    const cat = task.category || 'general';
    let entry = categoryMap.get(cat);
    if (!entry) {
      entry = { total: 0, completed: 0, totalAttempts: 0, struggleTasks: [] };
      categoryMap.set(cat, entry);
    }
    entry.total++;
    const attemptInfo = completedMap.get(task.id);
    if (attemptInfo !== undefined) {
      entry.completed++;
      entry.totalAttempts += attemptInfo;
      if (attemptInfo > 3) {
        entry.struggleTasks.push({ task_id: task.id, title: task.title, attempts: attemptInfo });
      }
    }
  }

  const result: SkillGap[] = [];
  for (const [category, data] of categoryMap) {
    const completionPct = Math.round((data.completed / data.total) * 100);
    const avgAttempts = data.completed > 0 ? Math.round((data.totalAttempts / data.completed) * 10) / 10 : 0;

    result.push({
      category,
      tasks_total: data.total,
      tasks_completed: data.completed,
      completion_pct: completionPct,
      avg_attempts: avgAttempts,
      struggle_tasks: data.struggleTasks,
      strength_level: determineStrengthLevel(completionPct, avgAttempts),
    });
  }

  return result.sort((a, b) => a.completion_pct - b.completion_pct);
}

describe('Skill Gap Analysis', () => {
  const sampleTasks = [
    { id: 't1', title: 'SELECT basics', category: 'SQL Basics' },
    { id: 't2', title: 'WHERE clause', category: 'SQL Basics' },
    { id: 't3', title: 'ORDER BY', category: 'Filtering' },
    { id: 't4', title: 'GROUP BY', category: 'Aggregation' },
    { id: 't5', title: 'HAVING', category: 'Aggregation' },
    { id: 't6', title: 'INNER JOIN', category: 'Joins' },
    { id: 't7', title: 'LEFT JOIN', category: 'Joins' },
  ];

  describe('determineStrengthLevel', () => {
    it('mastered: >=90% with low attempts', () => {
      expect(determineStrengthLevel(95, 1)).toBe('mastered');
      expect(determineStrengthLevel(90, 1.5)).toBe('mastered');
    });

    it('strong: >=75%', () => {
      expect(determineStrengthLevel(80, 2)).toBe('strong');
      expect(determineStrengthLevel(75, 5)).toBe('strong');
    });

    it('proficient: >=50%', () => {
      expect(determineStrengthLevel(60, 1)).toBe('proficient');
    });

    it('developing: >=25%', () => {
      expect(determineStrengthLevel(30, 1)).toBe('developing');
    });

    it('weak: <25%', () => {
      expect(determineStrengthLevel(10, 0)).toBe('weak');
      expect(determineStrengthLevel(0, 0)).toBe('weak');
    });
  });

  describe('computeSkillGaps', () => {
    it('returns all categories even with no completions', () => {
      const result = computeSkillGaps(sampleTasks, []);
      expect(result.length).toBe(4); // SQL Basics, Filtering, Aggregation, Joins
      for (const gap of result) {
        expect(gap.tasks_completed).toBe(0);
        expect(gap.completion_pct).toBe(0);
        expect(gap.strength_level).toBe('weak');
      }
    });

    it('correctly calculates partial completion', () => {
      const completed = [
        { task_id: 't1', attempts: 1 },
        { task_id: 't2', attempts: 2 },
      ];
      const result = computeSkillGaps(sampleTasks, completed);
      const sqlBasics = result.find((g) => g.category === 'SQL Basics');
      expect(sqlBasics).toBeDefined();
      if (!sqlBasics) throw new Error('Expected SQL Basics category to exist');
      expect(sqlBasics.tasks_completed).toBe(2);
      expect(sqlBasics.completion_pct).toBe(100);
      expect(sqlBasics.avg_attempts).toBe(1.5);
      expect(sqlBasics.strength_level).toBe('mastered');
    });

    it('correctly identifies struggle tasks', () => {
      const completed = [
        { task_id: 't1', attempts: 1 },
        { task_id: 't2', attempts: 5 }, // struggle
        { task_id: 't3', attempts: 4 }, // struggle
      ];
      const result = computeSkillGaps(sampleTasks, completed);
      const sqlBasics = result.find((g) => g.category === 'SQL Basics');
      expect(sqlBasics).toBeDefined();
      if (!sqlBasics) throw new Error('Expected SQL Basics category to exist');
      expect(sqlBasics.struggle_tasks.length).toBe(1);
      expect(sqlBasics.struggle_tasks[0].task_id).toBe('t2');

      const filtering = result.find((g) => g.category === 'Filtering');
      expect(filtering).toBeDefined();
      if (!filtering) throw new Error('Expected Filtering category to exist');
      expect(filtering.struggle_tasks.length).toBe(1);
      expect(filtering.struggle_tasks[0].task_id).toBe('t3');
    });

    it('sorted by completion_pct ascending (weakest first)', () => {
      const completed = [
        { task_id: 't1', attempts: 1 },
        { task_id: 't2', attempts: 1 },
        { task_id: 't6', attempts: 1 },
      ];
      const result = computeSkillGaps(sampleTasks, completed);
      for (let i = 1; i < result.length; i++) {
        expect(result[i].completion_pct).toBeGreaterThanOrEqual(result[i - 1].completion_pct);
      }
    });

    it('handles tasks without category (uses "general")', () => {
      const tasks = [{ id: 't0', title: 'No category', category: '' }];
      const result = computeSkillGaps(tasks, []);
      expect(result.length).toBe(1);
      expect(result[0].category).toBe('general');
    });
  });
});
