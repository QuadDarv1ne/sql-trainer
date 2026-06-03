/**
 * Environment variable validation.
 * Ensures required variables are present and valid at startup.
 */

interface EnvValidation {
  name: string;
  required: boolean;
  validate?: (value: string) => string | null;
}

const validations: EnvValidation[] = [
  {
    name: 'AUTH_SECRET',
    required: true,
    validate: (value) => {
      if (value.length < 32) {
        return 'AUTH_SECRET must be at least 32 characters long';
      }
      return null;
    },
  },
  {
    name: 'NEXTAUTH_URL',
    required: true,
    validate: (value) => {
      try {
        new URL(value);
        return null;
      } catch {
        return 'NEXTAUTH_URL must be a valid URL';
      }
    },
  },
  {
    name: 'DATABASE_PATH',
    required: false,
  },
  {
    name: 'SMTP_HOST',
    required: false,
  },
  {
    name: 'SMTP_PORT',
    required: false,
    validate: (value) => {
      const port = Number(value);
      if (isNaN(port) || port < 1 || port > 65535) {
        return 'SMTP_PORT must be a valid port number (1-65535)';
      }
      return null;
    },
  },
  {
    name: 'SMTP_SECURE',
    required: false,
  },
  {
    name: 'SMTP_USER',
    required: false,
  },
  {
    name: 'SMTP_PASS',
    required: false,
  },
  {
    name: 'SMTP_FROM',
    required: false,
  },
  {
    name: 'VAPID_PUBLIC_KEY',
    required: false,
  },
  {
    name: 'VAPID_PRIVATE_KEY',
    required: false,
  },
  {
    name: 'VAPID_SUBJECT',
    required: false,
  },
];

export function validateEnv(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const rule of validations) {
    const value = process.env[rule.name];

    if (rule.required && !value) {
      errors.push(`Missing required environment variable: ${rule.name}`);
      continue;
    }

    if (value && rule.validate) {
      const error = rule.validate(value);
      if (error) {
        errors.push(`${rule.name}: ${error}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
