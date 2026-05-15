/**
 * Simple logging utility for consistent error handling across the application.
 * Uses console methods but provides a centralized point for future enhancements
 * (e.g., structured logging, error tracking services).
 */

export const logger = {
  error: (message: string, error?: unknown) => {
    console.error(`[ERROR] ${message}`, error ?? '');
  },
  warn: (message: string, ...args: unknown[]) => {
    console.warn(`[WARN] ${message}`, ...args);
  },
  info: (message: string, ...args: unknown[]) => {
    console.info(`[INFO] ${message}`, ...args);
  },
};
