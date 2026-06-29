/**
 * Password strength evaluator — pure logic without UI concerns.
 * Used by auth forms and profile page to avoid duplication.
 */

export interface PasswordStrength {
  score: number;
  level: 'weak' | 'fair' | 'strong';
  checks: {
    minLength: boolean;
    uppercase: boolean;
    lowercase: boolean;
    digit: boolean;
    special: boolean;
  };
}

export function evaluatePasswordStrength(password: string): PasswordStrength {
  const checks = {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    digit: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const metCount = Object.values(checks).filter(Boolean).length;
  const score = Math.round((metCount / 5) * 100);

  let level: PasswordStrength['level'] = 'weak';
  if (score >= 80) level = 'strong';
  else if (score >= 60) level = 'fair';

  return { score, level, checks };
}
