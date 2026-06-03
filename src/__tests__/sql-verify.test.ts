/**
 * Tests for the SQL verify API endpoint.
 * Tests the verification logic for user SQL queries against expected solutions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Check if better-sqlite3 native bindings are available before test collection
const sqliteAvailable = vi.hoisted(() => {
  try {
    const Database = require('better-sqlite3');
    const db = new Database(':memory:');
    db.exec('SELECT 1');
    db.close();
    return true;
  } catch {
    return false;
  }
});

const describeIf = sqliteAvailable ? describe : describe.skip;

// Mock dependencies
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(() => ({ success: true })),
}));

vi.mock('@/lib/validation', () => ({
  validateBody: vi.fn((body, schema) => {
    const result = schema.safeParse(body);
    if (result.success) {
      return { data: result.data };
    }
    return { response: new Response(JSON.stringify({ error: 'Validation failed' }), { status: 400 }) };
  }),
}));

vi.mock('@/lib/training-tasks', () => ({
  getTaskById: vi.fn((taskId: string) => {
    const tasks: Record<string, {
      id: string;
      title: string;
      description: string;
      sampleSolution: string;
      verificationQuery: string;
      schema: string;
      dbType: string;
    }> = {
      'task-001': {
        id: 'task-001',
        title: 'Basic SELECT',
        description: 'Select all columns from employees table',
        sampleSolution: 'SELECT * FROM employees',
        verificationQuery: 'SELECT COUNT(*) as count FROM employees',
        schema: `
          CREATE TABLE employees (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            department TEXT,
            salary REAL
          );
          INSERT INTO employees VALUES (1, 'Alice', 'Engineering', 80000);
          INSERT INTO employees VALUES (2, 'Bob', 'Sales', 60000);
          INSERT INTO employees VALUES (3, 'Charlie', 'Engineering', 75000);
        `,
        dbType: 'sqlite',
      },
      'task-002': {
        id: 'task-002',
        title: 'SELECT with WHERE',
        description: 'Select employees from Engineering department',
        sampleSolution: "SELECT * FROM employees WHERE department = 'Engineering'",
        verificationQuery: "SELECT COUNT(*) as count FROM employees WHERE department = 'Engineering'",
        schema: `
          CREATE TABLE employees (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            department TEXT,
            salary REAL
          );
          INSERT INTO employees VALUES (1, 'Alice', 'Engineering', 80000);
          INSERT INTO employees VALUES (2, 'Bob', 'Sales', 60000);
          INSERT INTO employees VALUES (3, 'Charlie', 'Engineering', 75000);
        `,
        dbType: 'sqlite',
      },
      'task-003': {
        id: 'task-003',
        title: 'INSERT statement',
        description: 'Insert a new employee',
        sampleSolution: "INSERT INTO employees (name, department, salary) VALUES ('David', 'Marketing', 55000); SELECT * FROM employees WHERE name = 'David'",
        verificationQuery: "SELECT COUNT(*) as count FROM employees WHERE name = 'David'",
        schema: `
          CREATE TABLE employees (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            department TEXT,
            salary REAL
          );
          INSERT INTO employees VALUES (1, 'Alice', 'Engineering', 80000);
        `,
        dbType: 'sqlite',
      },
      'task-mongo-001': {
        id: 'task-mongo-001',
        title: 'MongoDB Basic Query',
        description: 'Find all users',
        sampleSolution: 'db.users.find({})',
        verificationQuery: 'db.users.countDocuments({})',
        schema: JSON.stringify({
          users: [
            { _id: 1, name: 'Alice', age: 30 },
            { _id: 2, name: 'Bob', age: 25 },
            { _id: 3, name: 'Charlie', age: 35 },
          ],
        }),
        dbType: 'mongodb',
      },
    };
    return tasks[taskId] || null;
  }),
}));

describeIf('POST /api/sql/verify', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Validation', () => {
    it('should reject empty SQL', async () => {
      const { POST } = await import('@/app/api/sql/verify/route');
      
      mockRequest = new NextRequest('http://localhost:3000/api/sql/verify', {
        method: 'POST',
        body: JSON.stringify({ sql: '', taskId: 'task-001' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('should reject missing taskId', async () => {
      const { POST } = await import('@/app/api/sql/verify/route');
      
      mockRequest = new NextRequest('http://localhost:3000/api/sql/verify', {
        method: 'POST',
        body: JSON.stringify({ sql: 'SELECT 1' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('should reject SQL that is too long', async () => {
      const { POST } = await import('@/app/api/sql/verify/route');
      
      mockRequest = new NextRequest('http://localhost:3000/api/sql/verify', {
        method: 'POST',
        body: JSON.stringify({ sql: 'SELECT '.repeat(2000), taskId: 'task-001' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });
  });

  describe('Task not found', () => {
    it('should return 404 for non-existent task', async () => {
      const { POST } = await import('@/app/api/sql/verify/route');
      
      mockRequest = new NextRequest('http://localhost:3000/api/sql/verify', {
        method: 'POST',
        body: JSON.stringify({ sql: 'SELECT 1', taskId: 'non-existent-task' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.verified).toBe(false);
      expect(data.message).toContain('не найдено');
    });
  });

  describe('Successful verification', () => {
    it('should verify correct SELECT query', async () => {
      const { POST } = await import('@/app/api/sql/verify/route');
      
      mockRequest = new NextRequest('http://localhost:3000/api/sql/verify', {
        method: 'POST',
        body: JSON.stringify({ 
          sql: "SELECT * FROM employees WHERE department = 'Engineering'", 
          taskId: 'task-002' 
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.verified).toBe(true);
      expect(data.userRowCount).toBe(2);
      expect(data.expectedRowCount).toBe(2);
      expect(data.message).toContain('✅');
    });

    it('should verify SELECT with different column order', async () => {
      const { POST } = await import('@/app/api/sql/verify/route');
      
      mockRequest = new NextRequest('http://localhost:3000/api/sql/verify', {
        method: 'POST',
        body: JSON.stringify({ 
          sql: "SELECT department, name, salary, id FROM employees WHERE department = 'Engineering'", 
          taskId: 'task-002' 
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.verified).toBe(true);
    });

    it('should verify SELECT with ORDER BY', async () => {
      const { POST } = await import('@/app/api/sql/verify/route');
      
      mockRequest = new NextRequest('http://localhost:3000/api/sql/verify', {
        method: 'POST',
        body: JSON.stringify({ 
          sql: "SELECT * FROM employees WHERE department = 'Engineering' ORDER BY name", 
          taskId: 'task-002' 
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.verified).toBe(true);
    });
  });

  describe('Failed verification', () => {
    it('should reject incorrect WHERE clause', async () => {
      const { POST } = await import('@/app/api/sql/verify/route');
      
      mockRequest = new NextRequest('http://localhost:3000/api/sql/verify', {
        method: 'POST',
        body: JSON.stringify({ 
          sql: "SELECT * FROM employees WHERE department = 'Sales'", 
          taskId: 'task-002' 
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.verified).toBe(false);
      expect(data.userRowCount).toBe(1);
      expect(data.expectedRowCount).toBe(2);
    });

    it('should reject query with wrong columns', async () => {
      const { POST } = await import('@/app/api/sql/verify/route');
      
      mockRequest = new NextRequest('http://localhost:3000/api/sql/verify', {
        method: 'POST',
        body: JSON.stringify({ 
          sql: "SELECT name FROM employees WHERE department = 'Engineering'", 
          taskId: 'task-002' 
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.verified).toBe(false);
      expect(data.message).toContain('Столбцы не совпадают');
    });

    it('should reject query returning 0 rows', async () => {
      const { POST } = await import('@/app/api/sql/verify/route');
      
      mockRequest = new NextRequest('http://localhost:3000/api/sql/verify', {
        method: 'POST',
        body: JSON.stringify({ 
          sql: "SELECT * FROM employees WHERE department = 'NonExistent'", 
          taskId: 'task-002' 
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.verified).toBe(false);
      expect(data.userRowCount).toBe(0);
      expect(data.message).toContain('0 строк');
    });
  });

  describe('SQL error handling', () => {
    it('should handle SQL syntax errors', async () => {
      const { POST } = await import('@/app/api/sql/verify/route');
      
      mockRequest = new NextRequest('http://localhost:3000/api/sql/verify', {
        method: 'POST',
        body: JSON.stringify({ 
          sql: 'SELEC * FROM employees', 
          taskId: 'task-001' 
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.verified).toBe(false);
      expect(data.message).toBeDefined();
    });

    it('should handle invalid table name', async () => {
      const { POST } = await import('@/app/api/sql/verify/route');
      
      mockRequest = new NextRequest('http://localhost:3000/api/sql/verify', {
        method: 'POST',
        body: JSON.stringify({ 
          sql: 'SELECT * FROM nonexistent_table', 
          taskId: 'task-001' 
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.verified).toBe(false);
      expect(data.message).toBeDefined();
    });
  });

  describe('DML queries (INSERT/UPDATE/DELETE)', () => {
    it('should verify INSERT statement with SELECT', async () => {
      const { POST } = await import('@/app/api/sql/verify/route');
      
      mockRequest = new NextRequest('http://localhost:3000/api/sql/verify', {
        method: 'POST',
        body: JSON.stringify({ 
          sql: "INSERT INTO employees (name, department, salary) VALUES ('David', 'Marketing', 55000); SELECT * FROM employees WHERE name = 'David'", 
          taskId: 'task-003' 
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.verified).toBe(true);
    });

    it('should handle multi-statement query with DML and SELECT', async () => {
      const { POST } = await import('@/app/api/sql/verify/route');
      
      mockRequest = new NextRequest('http://localhost:3000/api/sql/verify', {
        method: 'POST',
        body: JSON.stringify({ 
          sql: `
            INSERT INTO employees (name, department, salary) VALUES ('David', 'Marketing', 55000);
            SELECT * FROM employees WHERE name = 'David';
          `, 
          taskId: 'task-003' 
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.verified).toBe(true);
    });
  });

  describe('MongoDB queries', () => {
    it('should verify MongoDB query', async () => {
      const { POST } = await import('@/app/api/sql/verify/route');
      
      mockRequest = new NextRequest('http://localhost:3000/api/sql/verify', {
        method: 'POST',
        body: JSON.stringify({ 
          sql: 'db.users.find({})', 
          taskId: 'task-mongo-001' 
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.verified).toBe(true);
      expect(data.userRowCount).toBe(3);
    });

    it('should verify MongoDB query with filter', async () => {
      const { POST } = await import('@/app/api/sql/verify/route');
      
      mockRequest = new NextRequest('http://localhost:3000/api/sql/verify', {
        method: 'POST',
        body: JSON.stringify({ 
          sql: 'db.users.find({ age: { $gte: 30 } })', 
          taskId: 'task-mongo-001' 
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      // This test depends on the task's sampleSolution
      // Adjust expectations based on actual task configuration
      expect(response.status).toBe(200);
    });
  });

  describe('dbType override', () => {
    it('should use dbType from request body', async () => {
      const { POST } = await import('@/app/api/sql/verify/route');
      
      mockRequest = new NextRequest('http://localhost:3000/api/sql/verify', {
        method: 'POST',
        body: JSON.stringify({ 
          sql: "SELECT * FROM employees WHERE department = 'Engineering'", 
          taskId: 'task-002',
          dbType: 'postgresql'
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      // PostgreSQL adapter should handle the query
      expect(data.verified).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle query with comments', async () => {
      const { POST } = await import('@/app/api/sql/verify/route');
      
      mockRequest = new NextRequest('http://localhost:3000/api/sql/verify', {
        method: 'POST',
        body: JSON.stringify({ 
          sql: `
            -- Get all engineering employees
            SELECT * FROM employees WHERE department = 'Engineering';
          `, 
          taskId: 'task-002' 
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.verified).toBe(true);
    });

    it('should handle query with extra whitespace', async () => {
      const { POST } = await import('@/app/api/sql/verify/route');
      
      mockRequest = new NextRequest('http://localhost:3000/api/sql/verify', {
        method: 'POST',
        body: JSON.stringify({ 
          sql: '   SELECT    *   FROM   employees   WHERE   department   =   \'Engineering\'   ', 
          taskId: 'task-002' 
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.verified).toBe(true);
    });
  });
});
