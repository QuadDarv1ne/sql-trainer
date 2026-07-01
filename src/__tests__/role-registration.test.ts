/**
 * Tests for role-based registration.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { UserRole } from '../lib/db-users';
import { ROLE_LABELS, ROLE_COLORS } from '../lib/rbac';

// Mock the database and rate limit
const createdUsers: Array<{ email: string; name: string; role: UserRole }> = [];

vi.mock('../lib/db-users', () => ({
  createUser: vi.fn(
    async (email: string, name: string, _password: string, _phone: string | undefined, role: UserRole) => {
      if (createdUsers.some((u) => u.email === email)) return null;
      const user = { id: 'test-id', email, name, phone: null, role };
      createdUsers.push({ email, name, role });
      return user;
    },
  ),
}));

vi.mock('../lib/rate-limit', () => ({
  rateLimit: () => ({ success: true }),
  getClientIdentifier: () => 'test-client',
  RATE_LIMIT_WINDOWS: { oneMinute: 60_000, tenMinutes: 600_000, fifteenMinutes: 900_000, oneHour: 3_600_000 },
}));

vi.mock('../lib/csrf', () => ({
  validateCsrfTokenEdge: () => true,
  csrfErrorResponse: () => new Response(JSON.stringify({ success: false, error: 'CSRF validation failed' }), { status: 403 }),
}));

vi.mock('../lib/logger', () => ({
  logger: { error: vi.fn() },
}));

async function register(name: string, email: string, password: string, role?: UserRole) {
  const body = { name, email, password, role };
  const req = new Request('http://localhost/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  // Import the route handler (which will use mocked db-users)
  const { POST } = await import('../app/api/auth/register/route');
  return POST(req as any);
}

describe('Role-based registration', () => {
  beforeEach(() => {
    createdUsers.length = 0;
    vi.resetModules();
  });

  it('registers as student by default', async () => {
    const response = await register('John', 'john@example.com', 'password123');
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.user.role).toBe('student');
  });

  it('registers as student when explicitly requested', async () => {
    const response = await register('Jane', 'jane@example.com', 'password123', 'student');
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.user.role).toBe('student');
  });

  it('registers as teacher when requested', async () => {
    const response = await register('Teacher', 'teacher@example.com', 'password123', 'teacher');
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.user.role).toBe('teacher');
  });

  it('rejects duplicate email', async () => {
    await register('First', 'dup@example.com', 'password123');
    const response = await register('Second', 'dup@example.com', 'password456');
    expect(response.status).toBe(409);
    const data = await response.json();
    expect(data.success).toBe(false);
  });
});

describe('ROLE_LABELS', () => {
  it('has labels for all roles', () => {
    expect(ROLE_LABELS.student).toBeDefined();
    expect(ROLE_LABELS.teacher).toBeDefined();
    expect(ROLE_LABELS.admin).toBeDefined();
  });

  it('labels are non-empty strings', () => {
    for (const role of ['student', 'teacher', 'admin'] as const) {
      expect(typeof ROLE_LABELS[role]).toBe('string');
      expect(ROLE_LABELS[role].length).toBeGreaterThan(0);
    }
  });
});

describe('ROLE_COLORS', () => {
  it('has colors for all roles', () => {
    expect(ROLE_COLORS.student).toBeDefined();
    expect(ROLE_COLORS.teacher).toBeDefined();
    expect(ROLE_COLORS.admin).toBeDefined();
  });

  it('colors include bg and text classes', () => {
    for (const role of ['student', 'teacher', 'admin'] as const) {
      expect(ROLE_COLORS[role]).toContain('bg-');
      expect(ROLE_COLORS[role]).toContain('text-');
    }
  });
});
