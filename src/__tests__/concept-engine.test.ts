import { describe, it, expect } from 'vitest';
import { detectConcepts, getPracticedConcepts, recommendByConcept, CONCEPT_LABELS } from '@/lib/concept-engine';
import type { SQLConcept } from '@/lib/concept-engine';
import type { TrainingTask } from '@/lib/tasks/types';

function makeTask(overrides: Partial<TrainingTask> = {}): TrainingTask {
  return {
    id: 'task-1',
    title: 'Test Task',
    description: 'Test',
    difficulty: 'beginner',
    dbType: 'sqlite',
    schema: 'CREATE TABLE users (id INTEGER, name TEXT, age INTEGER)',
    taskText: 'Select all users',
    hint: 'Use SELECT',
    sampleSolution: 'SELECT * FROM users WHERE age > 18',
    verificationQuery: 'SELECT * FROM users WHERE age > 18',
    ...overrides,
  };
}

describe('detectConcepts', () => {
  it('should return empty set for empty SQL', () => {
    const result = detectConcepts('');
    expect(result.size).toBe(0);
  });

  it('should detect select_basic concept', () => {
    const result = detectConcepts('SELECT * FROM users');
    expect(result.has('select_basic')).toBe(true);
  });

  it('should detect where_filter concept', () => {
    const result = detectConcepts('SELECT * FROM users WHERE age > 18');
    expect(result.has('select_basic')).toBe(true);
    expect(result.has('where_filter')).toBe(true);
  });

  it('should detect order_by concept', () => {
    const result = detectConcepts('SELECT * FROM users ORDER BY name ASC');
    expect(result.has('order_by')).toBe(true);
  });

  it('should detect group_by and aggregate concepts', () => {
    const result = detectConcepts('SELECT dept, COUNT(*) FROM employees GROUP BY dept');
    expect(result.has('group_by')).toBe(true);
    expect(result.has('aggregate_functions')).toBe(true);
  });

  it('should detect having concept', () => {
    const result = detectConcepts('SELECT dept, COUNT(*) FROM emp GROUP BY dept HAVING COUNT(*) > 5');
    expect(result.has('having')).toBe(true);
  });

  it('should detect inner_join concept', () => {
    const result = detectConcepts('SELECT * FROM orders INNER JOIN customers ON orders.cid = customers.id');
    expect(result.has('inner_join')).toBe(true);
  });

  it('should detect left_join concept', () => {
    const result = detectConcepts('SELECT * FROM orders LEFT JOIN customers ON orders.cid = customers.id');
    expect(result.has('left_join')).toBe(true);
  });

  it('should detect subquery_where concept', () => {
    const result = detectConcepts('SELECT * FROM users WHERE id IN (SELECT user_id FROM orders)');
    expect(result.has('subquery_where')).toBe(true);
  });

  it('should detect CTE concept', () => {
    const result = detectConcepts(
      'WITH ranked AS (SELECT *, ROW_NUMBER() OVER() AS rn FROM users) SELECT * FROM ranked',
    );
    expect(result.has('cte')).toBe(true);
  });

  it('should detect window_function concept', () => {
    const result = detectConcepts('SELECT name, salary, RANK() OVER (ORDER BY salary DESC) FROM employees');
    expect(result.has('window_function')).toBe(true);
  });

  it('should detect case_when concept', () => {
    const result = detectConcepts('SELECT CASE WHEN age < 18 THEN "minor" ELSE "adult" END FROM users');
    expect(result.has('case_when')).toBe(true);
  });

  it('should detect coalesce concept', () => {
    const result = detectConcepts('SELECT COALESCE(nickname, name) FROM users');
    expect(result.has('coalesce')).toBe(true);
  });

  it('should detect distinct concept', () => {
    const result = detectConcepts('SELECT DISTINCT city FROM users');
    expect(result.has('distinct')).toBe(true);
  });

  it('should detect union concept', () => {
    const result = detectConcepts('SELECT name FROM users UNION ALL SELECT name FROM admins');
    expect(result.has('union')).toBe(true);
  });

  it('should detect date_functions concept', () => {
    const result = detectConcepts("SELECT * FROM orders WHERE date(created_at) = '2024-01-01'");
    expect(result.has('date_functions')).toBe(true);
  });

  it('should detect string_functions concept', () => {
    const result = detectConcepts('SELECT UPPER(name), CONCAT(first, last) FROM users');
    expect(result.has('string_functions')).toBe(true);
  });

  it('should detect limit_top concept', () => {
    const result = detectConcepts('SELECT * FROM users LIMIT 10');
    expect(result.has('limit_top')).toBe(true);
  });

  it('should detect exists concept', () => {
    const result = detectConcepts(
      'SELECT * FROM users WHERE EXISTS (SELECT 1 FROM orders WHERE orders.uid = users.id)',
    );
    expect(result.has('exists')).toBe(true);
  });

  it('should detect insert concept', () => {
    const result = detectConcepts('INSERT INTO users (name, age) VALUES ("John", 30)');
    expect(result.has('insert')).toBe(true);
  });

  it('should detect update concept', () => {
    const result = detectConcepts('UPDATE users SET name = "Jane" WHERE id = 1');
    expect(result.has('update')).toBe(true);
  });

  it('should detect delete concept', () => {
    const result = detectConcepts('DELETE FROM users WHERE id = 1');
    expect(result.has('delete')).toBe(true);
  });

  it('should detect constraints concept', () => {
    const result = detectConcepts('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE)');
    expect(result.has('constraints')).toBe(true);
  });

  it('should be case insensitive', () => {
    const result = detectConcepts('select * from users where name = "test"');
    expect(result.has('select_basic')).toBe(true);
    expect(result.has('where_filter')).toBe(true);
  });

  it('should detect multiple concepts from complex query', () => {
    const sql = `
      SELECT DISTINCT u.name, COUNT(o.id) as order_count
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE u.age > 18
      GROUP BY u.name
      HAVING COUNT(o.id) > 3
      ORDER BY order_count DESC
      LIMIT 5
    `;
    const result = detectConcepts(sql);
    expect(result.has('select_basic')).toBe(true);
    expect(result.has('distinct')).toBe(true);
    expect(result.has('left_join')).toBe(true);
    expect(result.has('where_filter')).toBe(true);
    expect(result.has('group_by')).toBe(true);
    expect(result.has('aggregate_functions')).toBe(true);
    expect(result.has('having')).toBe(true);
    expect(result.has('order_by')).toBe(true);
    expect(result.has('limit_top')).toBe(true);
  });
});

describe('getPracticedConcepts', () => {
  it('should return empty set for no completed tasks', () => {
    const tasks = [makeTask({ id: 'task-1', sampleSolution: 'SELECT * FROM users' })];
    const result = getPracticedConcepts([], tasks);
    expect(result.size).toBe(0);
  });

  it('should return concepts from completed tasks', () => {
    const tasks = [makeTask({ id: 'task-1', sampleSolution: 'SELECT * FROM users WHERE age > 18' })];
    const result = getPracticedConcepts(['task-1'], tasks);
    expect(result.has('select_basic')).toBe(true);
    expect(result.has('where_filter')).toBe(true);
  });

  it('should aggregate concepts from multiple completed tasks', () => {
    const tasks = [
      makeTask({ id: 'task-1', sampleSolution: 'SELECT * FROM users' }),
      makeTask({ id: 'task-2', sampleSolution: 'SELECT * FROM orders ORDER BY date' }),
    ];
    const result = getPracticedConcepts(['task-1', 'task-2'], tasks);
    expect(result.has('select_basic')).toBe(true);
    expect(result.has('order_by')).toBe(true);
  });

  it('should skip tasks not in completed list', () => {
    const tasks = [
      makeTask({ id: 'task-1', sampleSolution: 'SELECT * FROM users' }),
      makeTask({ id: 'task-2', sampleSolution: 'SELECT * FROM orders' }),
    ];
    const result = getPracticedConcepts(['task-1'], tasks);
    expect(result.has('select_basic')).toBe(true);
    // task-2 not included
  });
});

describe('recommendByConcept', () => {
  it('should recommend a task with an unpracticed concept', () => {
    const tasks = [
      makeTask({
        id: 'task-1',
        sampleSolution: 'SELECT * FROM users WHERE age > 18',
        difficulty: 'beginner',
      }),
      makeTask({
        id: 'task-2',
        sampleSolution: 'SELECT * FROM users ORDER BY name',
        difficulty: 'beginner',
      }),
    ];

    const result = recommendByConcept(['task-1'], tasks, 'beginner');
    expect(result).not.toBeNull();
    if (result) {
      expect(result.task.id).toBe('task-2');
      expect(result.missingConcept).toBeDefined();
    }
  });

  it('should respect difficulty filter', () => {
    const tasks = [
      makeTask({
        id: 'task-1',
        sampleSolution: 'SELECT * FROM users',
        difficulty: 'beginner',
      }),
      makeTask({
        id: 'task-2',
        sampleSolution: 'SELECT * FROM users ORDER BY name',
        difficulty: 'advanced',
      }),
    ];

    const result = recommendByConcept(['task-1'], tasks, 'advanced');
    expect(result).not.toBeNull();
    if (result) {
      expect(result.task.id).toBe('task-2');
    }
  });

  it('should return null when all concepts are practiced', () => {
    const tasks = [
      makeTask({
        id: 'task-1',
        sampleSolution: 'SELECT * FROM users',
        difficulty: 'beginner',
      }),
    ];

    const result = recommendByConcept(['task-1'], tasks, 'beginner');
    expect(result).toBeNull();
  });

  it('should return null when no tasks match criteria', () => {
    const tasks = [
      makeTask({
        id: 'task-1',
        sampleSolution: 'SELECT * FROM users',
        difficulty: 'beginner',
      }),
    ];

    const result = recommendByConcept(['task-1'], tasks, 'intermediate');
    expect(result).toBeNull();
  });

  it('should fall back to any difficulty when no candidate at target difficulty', () => {
    const tasks = [
      makeTask({
        id: 'task-1',
        sampleSolution: 'SELECT * FROM users',
        difficulty: 'beginner',
      }),
      makeTask({
        id: 'task-2',
        sampleSolution: 'SELECT * FROM users WHERE age > 18',
        difficulty: 'intermediate',
      }),
    ];

    // Completed task-1 at beginner, target intermediate but only task-2 has the missing concept
    const result = recommendByConcept(['task-1'], tasks, null);
    expect(result).not.toBeNull();
    if (result) {
      expect(result.task.id).toBe('task-2');
    }
  });
});

describe('CONCEPT_LABELS', () => {
  it('should have labels for all concepts', () => {
    const concepts: SQLConcept[] = [
      'select_basic',
      'where_filter',
      'order_by',
      'group_by',
      'aggregate_functions',
      'having',
      'inner_join',
      'left_join',
      'self_join',
      'subquery_where',
      'subquery_select',
      'cte',
      'window_function',
      'row_number',
      'case_when',
      'coalesce',
      'distinct',
      'union',
      'date_functions',
      'string_functions',
      'limit_top',
      'exists',
      'insert',
      'update',
      'delete',
      'constraints',
    ];

    for (const concept of concepts) {
      expect(CONCEPT_LABELS[concept]).toBeDefined();
      expect(typeof CONCEPT_LABELS[concept]).toBe('string');
    }
  });
});
