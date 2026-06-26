/**
 * Structured logging utility for consistent error handling across the application.
 * Outputs JSON in production for log aggregation; human-readable in development.
 *
 * Features:
 * - Structured JSON output with timestamps, levels, context
 * - Automatic error serialization (stack, name, code)
 * - Child logger with persistent context fields
 * - Request-scoped logging via requestId
 */
/* eslint-disable no-console -- intentional console usage in logger */

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  requestId?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  [key: string]: unknown;
}

const isDev = process.env.NODE_ENV === 'development';

function serializeError(error: unknown): LogEntry['error'] {
  if (error instanceof Error) {
    const serialized: LogEntry['error'] = {
      name: error.name,
      message: error.message,
      stack: isDev ? error.stack : undefined,
    };
    if ('code' in error && typeof (error as Record<string, unknown>).code === 'string') {
      serialized.code = (error as { code: string }).code;
    }
    return serialized;
  }
  return { name: 'Unknown', message: String(error) };
}

function formatEntry(entry: LogEntry): string {
  if (isDev) {
    const prefix = `[${entry.level.toUpperCase()}]`;
    const ctx = entry.context ? `[${entry.context}]` : '';
    const req = entry.requestId ? `[${entry.requestId}]` : '';
    const err = entry.error ? ` ${entry.error.name}: ${entry.error.message}` : '';
    const extra =
      Object.keys(entry).length > 4
        ? ` ${JSON.stringify(
            Object.fromEntries(
              Object.entries(entry).filter(
                ([k]) => !['level', 'message', 'timestamp', 'context', 'requestId', 'error'].includes(k),
              ),
            ),
          )}`
        : '';
    return `${prefix}${ctx}${req} ${entry.message}${err}${extra}`;
  }
  return JSON.stringify(entry);
}

function log(level: LogLevel, message: string, extra?: Record<string, unknown>, error?: unknown): void {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
  };

  if (extra) {
    Object.assign(entry, extra);
  }

  if (error !== undefined) {
    entry.error = serializeError(error);
  }

  const formatted = formatEntry(entry);

  switch (level) {
    case 'error':
      console.error(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    case 'info':
      console.info(formatted);
      break;
    case 'debug':
      console.debug(formatted);
      break;
  }
}

export interface Logger {
  error: (message: string, error?: unknown, extra?: Record<string, unknown>) => void;
  warn: (message: string, extra?: Record<string, unknown>) => void;
  info: (message: string, extra?: Record<string, unknown>) => void;
  debug: (message: string, extra?: Record<string, unknown>) => void;
  child: (context: string, extra?: Record<string, unknown>) => Logger;
}

function createLogger(baseContext?: string, baseExtra?: Record<string, unknown>): Logger {
  return {
    error: (message, error, extra) => {
      log('error', message, { ...baseExtra, ...extra, context: baseContext }, error);
    },
    warn: (message, extra) => {
      log('warn', message, { ...baseExtra, ...extra, context: baseContext });
    },
    info: (message, extra) => {
      log('info', message, { ...baseExtra, ...extra, context: baseContext });
    },
    debug: (message, extra) => {
      log('debug', message, { ...baseExtra, ...extra, context: baseContext });
    },
    child: (context, extra) => {
      return createLogger(context, { ...baseExtra, ...extra });
    },
  };
}

export const logger = createLogger();
