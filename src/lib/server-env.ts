/**
 * Server-side environment validation.
 * Runs once when the Next.js server starts.
 * Skips during build phase since env vars are only needed at runtime.
 */
import { validateEnv } from '@/lib/env';
import { logger } from '@/lib/logger';

const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';

if (!isBuildPhase) {
  const result = validateEnv();

  if (!result.valid) {
    logger.error('Environment validation failed:');
    result.errors.forEach((error) => logger.error(`  - ${error}`));
    logger.error('\nPlease copy .env.example to .env.local and configure required variables.');
    process.exit(1);
  }
}

export {};
