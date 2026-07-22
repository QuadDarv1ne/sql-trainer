import { describe, it, expect } from 'vitest';
import { openApiSpec } from '@/lib/openapi';

describe('openapi spec', () => {
  it('should be a valid OpenAPI 3.0.3 document', () => {
    expect(openApiSpec.openapi).toBe('3.0.3');
  });

  it('should have required info fields', () => {
    expect(openApiSpec.info).toBeDefined();
    expect(openApiSpec.info.title).toBe('SQL Trainer API');
    expect(openApiSpec.info.version).toBe('0.3.0');
    expect(typeof openApiSpec.info.description).toBe('string');
  });

  it('should have at least one server', () => {
    expect(openApiSpec.servers).toBeDefined();
    expect(openApiSpec.servers!.length).toBeGreaterThanOrEqual(1);
  });

  it('should document the /sql endpoint', () => {
    expect(openApiSpec.paths!['/sql']).toBeDefined();
    expect(openApiSpec.paths!['/sql'].post).toBeDefined();
  });

  it('should document the /sql/verify endpoint', () => {
    expect(openApiSpec.paths!['/sql/verify']).toBeDefined();
    expect(openApiSpec.paths!['/sql/verify'].post).toBeDefined();
  });

  it('should document the /user/progress endpoint', () => {
    expect(openApiSpec.paths!['/user/progress']).toBeDefined();
  });

  it('should have tags on SQL endpoints', () => {
    const sqlPost = openApiSpec.paths!['/sql'].post!;
    expect(sqlPost.tags).toContain('SQL');
  });

  it('should have responses on all documented endpoints', () => {
    for (const [, methods] of Object.entries(openApiSpec.paths!)) {
      for (const [method, spec] of Object.entries(methods)) {
        if (method === 'parameters') continue;
        const op = spec as { responses?: Record<string, unknown> };
        expect(op.responses).toBeDefined();
        expect(Object.keys(op.responses!).length).toBeGreaterThan(0);
      }
    }
  });

  it('should have components section', () => {
    expect(openApiSpec.components).toBeDefined();
  });

  it('should have components/schemas', () => {
    expect(openApiSpec.components!.schemas).toBeDefined();
    expect(Object.keys(openApiSpec.components!.schemas!).length).toBeGreaterThan(0);
  });
});
