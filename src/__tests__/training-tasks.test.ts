import { describe, it, expect } from 'vitest';
import {
  TRAINING_TASKS,
  getTaskById,
  getTasksByDifficulty,
} from '@/lib/training-tasks';

describe('training-tasks', () => {
  describe('TRAINING_TASKS', () => {
    it('has tasks', () => {
      expect(TRAINING_TASKS.length).toBeGreaterThan(0);
    });

    it('each task has required fields', () => {
      for (const task of TRAINING_TASKS) {
        expect(task).toHaveProperty('id');
        expect(task).toHaveProperty('title');
        expect(task).toHaveProperty('description');
        expect(task).toHaveProperty('difficulty');
        expect(task).toHaveProperty('schema');
        expect(task).toHaveProperty('sampleSolution');
        expect(task.id).toBeTruthy();
        expect(task.title).toBeTruthy();
        expect(task.description).toBeTruthy();
        expect(['beginner', 'intermediate', 'advanced']).toContain(task.difficulty);
      }
    });

    it('all task IDs are unique', () => {
      const ids = TRAINING_TASKS.map((t) => t.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });
  });

  describe('getTaskById', () => {
    it('returns task by id', () => {
      const firstTask = TRAINING_TASKS[0];
      const task = getTaskById(firstTask.id);
      expect(task).toBeDefined();
      expect(task?.id).toBe(firstTask.id);
    });

    it('returns undefined for nonexistent id', () => {
      const task = getTaskById('nonexistent-task-id');
      expect(task).toBeUndefined();
    });
  });

  describe('getTasksByDifficulty', () => {
    it('returns only tasks of specified difficulty', () => {
      const beginner = getTasksByDifficulty('beginner');
      expect(beginner.every((t) => t.difficulty === 'beginner')).toBe(true);
    });

    it('returns non-empty arrays for each difficulty', () => {
      expect(getTasksByDifficulty('beginner').length).toBeGreaterThan(0);
      expect(getTasksByDifficulty('intermediate').length).toBeGreaterThan(0);
      expect(getTasksByDifficulty('advanced').length).toBeGreaterThan(0);
    });
  });
});
