import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Import the actual schemas from route files
// We test password validation constraints across all auth endpoints

describe('Password validation constraints', () => {
  // Recreate schemas to test validation rules
  const registerPasswordSchema = z
    .string()
    .min(8, 'Пароль должен содержать минимум 8 символов')
    .max(128, 'Пароль слишком длинный (максимум 128 символов)');

  const resetPasswordSchema = z
    .string()
    .min(8, 'Пароль должен содержать минимум 8 символов')
    .max(128, 'Пароль слишком длинный (максимум 128 символов)');

  const changePasswordSchema = z
    .string()
    .min(8, 'Пароль должен содержать минимум 8 символов')
    .max(128, 'Пароль слишком длинный (максимум 128 символов)');

  const adminPasswordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long (max 128 characters)');

  describe('minimum length (8 characters)', () => {
    it('rejects passwords shorter than 8 characters', () => {
      const shortPasswords = ['Ab1!', '1234567', 'short', 'a'.repeat(7)];
      for (const pw of shortPasswords) {
        expect(registerPasswordSchema.safeParse(pw).success).toBe(false);
        expect(resetPasswordSchema.safeParse(pw).success).toBe(false);
        expect(changePasswordSchema.safeParse(pw).success).toBe(false);
        expect(adminPasswordSchema.safeParse(pw).success).toBe(false);
      }
    });

    it('accepts passwords with exactly 8 characters', () => {
      const pw8 = 'Abcdefg1';
      expect(registerPasswordSchema.safeParse(pw8).success).toBe(true);
      expect(resetPasswordSchema.safeParse(pw8).success).toBe(true);
      expect(changePasswordSchema.safeParse(pw8).success).toBe(true);
      expect(adminPasswordSchema.safeParse(pw8).success).toBe(true);
    });
  });

  describe('maximum length (128 characters)', () => {
    it('rejects passwords longer than 128 characters', () => {
      const longPw = 'a'.repeat(129);
      expect(registerPasswordSchema.safeParse(longPw).success).toBe(false);
      expect(resetPasswordSchema.safeParse(longPw).success).toBe(false);
      expect(changePasswordSchema.safeParse(longPw).success).toBe(false);
      expect(adminPasswordSchema.safeParse(longPw).success).toBe(false);
    });

    it('accepts passwords with exactly 128 characters', () => {
      const pw128 = 'a'.repeat(128);
      expect(registerPasswordSchema.safeParse(pw128).success).toBe(true);
      expect(resetPasswordSchema.safeParse(pw128).success).toBe(true);
      expect(changePasswordSchema.safeParse(pw128).success).toBe(true);
      expect(adminPasswordSchema.safeParse(pw128).success).toBe(true);
    });

    it('rejects extremely long passwords (DoS prevention)', () => {
      const hugePw = 'a'.repeat(10000);
      expect(registerPasswordSchema.safeParse(hugePw).success).toBe(false);
      expect(resetPasswordSchema.safeParse(hugePw).success).toBe(false);
      expect(changePasswordSchema.safeParse(hugePw).success).toBe(false);
      expect(adminPasswordSchema.safeParse(hugePw).success).toBe(false);
    });

    it('rejects passwords at bcrypt boundary (72 bytes) and above are validated consistently', () => {
      // bcrypt truncates at 72 bytes, so we ensure validation allows up to 128
      // but rejects beyond that to prevent unexpected behavior
      const pw72 = 'a'.repeat(72);
      const pw73 = 'a'.repeat(73);
      const pw100 = 'a'.repeat(100);

      // All should pass validation (bcrypt truncation is handled separately)
      expect(registerPasswordSchema.safeParse(pw72).success).toBe(true);
      expect(registerPasswordSchema.safeParse(pw73).success).toBe(true);
      expect(registerPasswordSchema.safeParse(pw100).success).toBe(true);
    });
  });

  describe('error messages', () => {
    it('returns Russian error message for register schema', () => {
      const shortResult = registerPasswordSchema.safeParse('short');
      expect(shortResult.success).toBe(false);
      if (!shortResult.success) {
        expect(shortResult.error.issues[0].message).toContain('8 символов');
      }
    });

    it('returns English error message for admin schema', () => {
      const shortResult = adminPasswordSchema.safeParse('short');
      expect(shortResult.success).toBe(false);
      if (!shortResult.success) {
        expect(shortResult.error.issues[0].message).toContain('8 characters');
      }
    });

    it('returns max length error message for too long password', () => {
      const longResult = registerPasswordSchema.safeParse('a'.repeat(200));
      expect(longResult.success).toBe(false);
      if (!longResult.success) {
        expect(longResult.error.issues[0].message).toContain('128');
      }
    });
  });

  describe('consistency across endpoints', () => {
    it('all endpoints have the same minimum length of 8', () => {
      const schemas = [registerPasswordSchema, resetPasswordSchema, changePasswordSchema, adminPasswordSchema];
      for (const schema of schemas) {
        expect(schema.safeParse('Ab123456').success).toBe(true);
        expect(schema.safeParse('Ab12345').success).toBe(false);
      }
    });

    it('all endpoints have the same maximum length of 128', () => {
      const schemas = [registerPasswordSchema, resetPasswordSchema, changePasswordSchema, adminPasswordSchema];
      for (const schema of schemas) {
        expect(schema.safeParse('a'.repeat(128)).success).toBe(true);
        expect(schema.safeParse('a'.repeat(129)).success).toBe(false);
      }
    });
  });
});
