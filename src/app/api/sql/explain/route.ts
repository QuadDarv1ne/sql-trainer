import { NextRequest, NextResponse } from 'next/server';
import { explainQuery } from '@/lib/sql-engine';
import { getTaskById } from '@/lib/training-tasks';
import { validateBody } from '@/lib/validation';
import { rateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { sqlExplainSchema } from '@/lib/sql-schema';

const VALID_DB_TYPES = ['sqlite', 'postgresql', 'mongodb'] as const;

/**
 * Analyze EXPLAIN plan and return performance suggestions.
 */
function analyzePlan(plan: string, sql: string): string[] {
  const suggestions: string[] = [];
  const planLower = plan.toLowerCase();
  const sqlUpper = sql.toUpperCase();

  // Full table scan detection
  if (planLower.includes('scan') && !planLower.includes('index')) {
    suggestions.push('Full table scan detected. Consider adding an index to speed up the query.');
  }

  // JOIN without index
  if (planLower.includes('join') && planLower.includes('scan')) {
    suggestions.push('JOIN without index may be slow. Add indexes on join columns.');
  }

  // DISTINCT or GROUP BY might be slow
  if (sqlUpper.includes('DISTINCT') || sqlUpper.includes('GROUP BY')) {
    if (planLower.includes('scan')) {
      suggestions.push('DISTINCT/GROUP BY with full scan may be slow. Consider indexes.');
    }
  }

  // ORDER BY without index
  if (sqlUpper.includes('ORDER BY') && !planLower.includes('index')) {
    suggestions.push('ORDER BY may use filesort. An index on sorted columns will speed it up.');
  }

  // Subquery detected
  if (sqlUpper.includes('SELECT') && sqlUpper.indexOf('SELECT') !== sqlUpper.lastIndexOf('SELECT')) {
    suggestions.push('Subquery detected. Consider using JOIN for potential performance improvement.');
  }

  // LIKE with leading wildcard
  if (sqlUpper.match(/LIKE\s+['"]%/)) {
    suggestions.push('LIKE with leading wildcard % does not use indexes. Try full-text search instead.');
  }

  return suggestions;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 15 explain requests per minute per client
    const clientId = getClientIdentifier(request);
    const limitResult = await rateLimit(`explain:${clientId}`, { max: 15, windowMs: 60_000 });
    if (!limitResult.success) {
      return NextResponse.json({ success: false, error: 'Too many requests. Please wait' }, { status: 429 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON in request body' }, { status: 400 });
    }
    const parsed = validateBody(body, sqlExplainSchema);
    if ('response' in parsed) return parsed.response;

    const { sql, dbType, taskId } = parsed.data;

    const task = getTaskById(taskId);
    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    const effectiveDbType = VALID_DB_TYPES.includes(dbType as (typeof VALID_DB_TYPES)[number]) ? dbType : 'sqlite';
    const result = explainQuery(sql, task.schema, effectiveDbType);

    if (result.success && result.plan) {
      const suggestions = analyzePlan(result.plan, sql);
      return NextResponse.json({ ...result, suggestions });
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    logger.error('SQL explain error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
