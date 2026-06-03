/**
 * Tests for validation utilities.
 * Tests validateBody, parseAndValidate, and withValidation functions.
 */

import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { validateBody, parseAndValidate, withValidation } from '@/lib/validation';

describe('Validation Utilities', () => {
  const testSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    age: z.number().int().positive('Age must be positive'),
    email: z.string().email('Invalid email').optional(),
  });

  describe('validateBody', () => {
    it('should return parsed data for valid input', () => {
      const body = { name: 'John', age: 30 };
      const result = validateBody(body, testSchema);

      expect('data' in result).toBe(true);
      if ('data' in result) {
        expect(result.data).toEqual({ name: 'John', age: 30 });
      }
    });

    it('should return error response for invalid input', () => {
      const body = { name: '', age: 30 };
      const result = validateBody(body, testSchema);

      expect('response' in result).toBe(true);
      if ('response' in result) {
        expect(result.response.status).toBe(400);
      }
    });

    it('should return error for missing required field', () => {
      const body = { age: 30 };
      const result = validateBody(body, testSchema);

      expect('response' in result).toBe(true);
      if ('response' in result) {
        expect(result.response.status).toBe(400);
      }
    });

    it('should return error for wrong type', () => {
      const body = { name: 'John', age: 'thirty' as any };
      const result = validateBody(body, testSchema);

      expect('response' in result).toBe(true);
    });

    it('should accept optional fields', () => {
      const body = { name: 'John', age: 30, email: 'john@example.com' };
      const result = validateBody(body, testSchema);

      expect('data' in result).toBe(true);
      if ('data' in result) {
        expect(result.data.email).toBe('john@example.com');
      }
    });

    it('should handle empty optional fields', () => {
      const body = { name: 'John', age: 30, email: undefined };
      const result = validateBody(body, testSchema);

      expect('data' in result).toBe(true);
    });

    it('should return first error message when multiple fields are invalid', () => {
      const body = { name: '', age: -5 };
      const result = validateBody(body, testSchema);

      expect('response' in result).toBe(true);
      if ('response' in result) {
        expect(result.response.status).toBe(400);
      }
    });
  });

  describe('parseAndValidate', () => {
    it('should parse and validate valid JSON', async () => {
      const mockRequest = {
        json: async () => ({ name: 'Jane', age: 25 }),
      } as unknown as Request;

      const result = await parseAndValidate(mockRequest, testSchema);

      expect('data' in result).toBe(true);
      if ('data' in result) {
        expect(result.data).toEqual({ name: 'Jane', age: 25 });
      }
    });

    it('should return error for invalid JSON', async () => {
      const mockRequest = {
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as unknown as Request;

      const result = await parseAndValidate(mockRequest, testSchema);

      expect('response' in result).toBe(true);
      if ('response' in result) {
        expect(result.response.status).toBe(400);
      }
    });

    it('should return error for validation failure', async () => {
      const mockRequest = {
        json: async () => ({ name: '', age: 25 }),
      } as unknown as Request;

      const result = await parseAndValidate(mockRequest, testSchema);

      expect('response' in result).toBe(true);
    });

    it('should handle complex nested schemas', async () => {
      const complexSchema = z.object({
        user: z.object({
          name: z.string(),
          settings: z.object({
            theme: z.enum(['light', 'dark']),
            notifications: z.boolean(),
          }),
        }),
      });

      const mockRequest = {
        json: async () => ({
          user: {
            name: 'John',
            settings: {
              theme: 'dark' as const,
              notifications: true,
            },
          },
        }),
      } as unknown as Request;

      const result = await parseAndValidate(mockRequest, complexSchema);

      expect('data' in result).toBe(true);
      if ('data' in result) {
        expect(result.data.user.name).toBe('John');
        expect(result.data.user.settings.theme).toBe('dark');
      }
    });

    it('should handle arrays in schema', async () => {
      const arraySchema = z.object({
        tags: z.array(z.string()).min(1, 'At least one tag required'),
      });

      const mockRequest = {
        json: async () => ({ tags: ['sql', 'database'] }),
      } as unknown as Request;

      const result = await parseAndValidate(mockRequest, arraySchema);

      expect('data' in result).toBe(true);
      if ('data' in result) {
        expect(result.data.tags).toEqual(['sql', 'database']);
      }
    });

    it('should reject empty array when min length is required', async () => {
      const arraySchema = z.object({
        tags: z.array(z.string()).min(1, 'At least one tag required'),
      });

      const mockRequest = {
        json: async () => ({ tags: [] }),
      } as unknown as Request;

      const result = await parseAndValidate(mockRequest, arraySchema);

      expect('response' in result).toBe(true);
    });
  });

  describe('withValidation', () => {
    it('should call handler with valid data', async () => {
      const mockHandler = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      );

      const wrappedHandler = withValidation(testSchema, mockHandler);

      const mockRequest = {
        json: async () => ({ name: 'Bob', age: 35 }),
      } as unknown as Request;

      await wrappedHandler(mockRequest);

      expect(mockHandler).toHaveBeenCalledTimes(1);
      expect(mockHandler).toHaveBeenCalledWith(
        mockRequest,
        { name: 'Bob', age: 35 }
      );
    });

    it('should return error response for invalid data', async () => {
      const mockHandler = vi.fn();

      const wrappedHandler = withValidation(testSchema, mockHandler);

      const mockRequest = {
        json: async () => ({ name: '', age: 35 }),
      } as unknown as Request;

      const response = await wrappedHandler(mockRequest);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(response.status).toBe(400);
    });

    it('should handle handler errors', async () => {
      const mockHandler = vi.fn().mockRejectedValue(new Error('Handler error'));

      const wrappedHandler = withValidation(testSchema, mockHandler);

      const mockRequest = {
        json: async () => ({ name: 'Bob', age: 35 }),
      } as unknown as Request;

      await expect(wrappedHandler(mockRequest)).rejects.toThrow('Handler error');
    });

    it('should preserve request object for handler', async () => {
      const mockHandler = vi.fn().mockImplementation(async (req, data) => {
        expect(req).toBeDefined();
        return new Response(JSON.stringify({ data }), { status: 200 });
      });

      const wrappedHandler = withValidation(testSchema, mockHandler);

      const mockRequest = {
        json: async () => ({ name: 'Bob', age: 35 }),
        headers: new Headers(),
        method: 'POST',
        url: 'http://test.com/api',
      } as unknown as Request;

      await wrappedHandler(mockRequest);

      expect(mockHandler).toHaveBeenCalled();
    });
  });

  describe('Schema edge cases', () => {
    it('should handle string transformations', () => {
      const transformSchema = z.object({
        name: z.string().transform((val) => val.trim()),
      });

      const body = { name: '  John  ' };
      const result = validateBody(body, transformSchema);

      expect('data' in result).toBe(true);
      if ('data' in result) {
        expect(result.data.name).toBe('John');
      }
    });

    it('should handle default values', () => {
      const defaultSchema = z.object({
        name: z.string(),
        active: z.boolean().default(true),
      });

      const body = { name: 'Test' };
      const result = validateBody(body, defaultSchema);

      expect('data' in result).toBe(true);
      if ('data' in result) {
        expect(result.data.active).toBe(true);
      }
    });

    it('should handle union types', () => {
      const unionSchema = z.object({
        value: z.union([z.string(), z.number()]),
      });

      const body1 = { value: 'text' };
      const result1 = validateBody(body1, unionSchema);
      expect('data' in result1).toBe(true);

      const body2 = { value: 42 };
      const result2 = validateBody(body2, unionSchema);
      expect('data' in result2).toBe(true);
    });

    it('should handle nullable fields', () => {
      const nullableSchema = z.object({
        name: z.string(),
        nickname: z.string().nullable(),
      });

      const body = { name: 'John', nickname: null };
      const result = validateBody(body, nullableSchema);

      expect('data' in result).toBe(true);
      if ('data' in result) {
        expect(result.data.nickname).toBe(null);
      }
    });
  });
});
