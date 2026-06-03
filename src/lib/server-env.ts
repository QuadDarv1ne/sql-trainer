/* eslint-disable no-console -- intentional for startup validation */
/**
 * Server-side environment validation.
 * Runs once when the Next.js server starts.
 * Skips during build phase since env vars are only needed at runtime.
 */
import { validateEnv } from '@/lib/env';

const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';

if (!isBuildPhase) {
  const result = validateEnv();

  if (!result.valid) {
    console.error('Environment validation failed:');
    result.errors.forEach((error) => console.error(`  - ${error}`));
    console.error('\nPlease copy .env.example to .env.local and configure required variables.');
    process.exit(1);
  }
}

export {};
