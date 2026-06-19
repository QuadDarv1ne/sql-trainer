/**
 * MongoDB Query Engine.
 * Executes MongoDB queries (find, aggregate) using in-memory data for training.
 * Supports real MongoDB connection when available.
 */

export interface MongoResult {
  success: boolean;
  columns: string[];
  rows: Record<string, unknown>[];
  error?: string;
  executionTime?: number;
}

export interface MongoSchema {
  [collectionName: string]: Record<string, unknown>[];
}

/**
 * Parse a MongoDB query string into a JSON object.
 * Supports find() and aggregate() syntax.
 */
function parseMongoQuery(
  queryStr: string,
): { type: 'find' | 'aggregate'; collection: string; options?: unknown } | null {
  try {
    // Try parsing as JSON first (for aggregate pipelines)
    const parsed = JSON.parse(queryStr);
    if (Array.isArray(parsed)) {
      return { type: 'aggregate', collection: '', options: parsed };
    }
    return { type: 'find', collection: '', options: { query: parsed } };
  } catch {
    // Try parsing as MongoDB shell syntax
    // Pattern: db.collection.find({...}) or db.collection.aggregate([{...}])
    const findMatch = queryStr.match(/db\.(\w+)\.find\((.*)\)/);
    if (findMatch) {
      const [, collection, queryPart] = findMatch;
      try {
        const query = queryPart ? JSON.parse(queryPart) : {};
        return { type: 'find', collection, options: { query } };
      } catch {
        return null;
      }
    }

    const aggMatch = queryStr.match(/db\.(\w+)\.aggregate\((\[.*\])\)/);
    if (aggMatch) {
      const [, collection, pipelinePart] = aggMatch;
      try {
        const pipeline = JSON.parse(pipelinePart);
        return { type: 'aggregate', collection, options: pipeline };
      } catch {
        return null;
      }
    }

    return null;
  }
}

/**
 * Compare two values for sorting — numeric when both are numbers,
 * string otherwise. Null/undefined sort after other values.
 */
function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b));
}

/**
 * Execute a find() query on in-memory data.
 */
function executeFind(
  collection: string,
  schema: MongoSchema,
  options: Record<string, unknown>,
): Record<string, unknown>[] {
  const data = schema[collection] || [];
  if (!data.length) return [];

  const { query = {}, projection = {}, sort = {}, limit, skip } = options as Record<string, unknown>;

  let results = [...data];

  // Apply query filter
  results = results.filter((doc) => matchesQuery(doc, query as Record<string, unknown>));

  // Apply skip
  if (typeof skip === 'number') {
    results = results.slice(skip);
  }

  // Apply sort
  if (sort && typeof sort === 'object') {
    const sortEntries = Object.entries(sort);
    results.sort((a, b) => {
      for (const [field, direction] of sortEntries) {
        const aVal = getNestedValue(a, field);
        const bVal = getNestedValue(b, field);
        const dir = (direction as number) >= 0 ? 1 : -1;
        const cmp = compareValues(aVal, bVal);
        if (cmp !== 0) return cmp * dir;
      }
      return 0;
    });
  }

  // Apply limit
  if (typeof limit === 'number') {
    results = results.slice(0, limit);
  }

  // Apply projection
  if (projection && Object.keys(projection).length > 0) {
    results = results.map((doc) => applyProjection(doc, projection as Record<string, number>));
  }

  return results;
}

/**
 * Execute an aggregate() pipeline on in-memory data.
 */
function executeAggregate(
  collection: string,
  schema: MongoSchema,
  pipeline: Record<string, unknown>[],
): Record<string, unknown>[] {
  let results = [...(schema[collection] || [])];

  for (const stage of pipeline) {
    if (stage.$match) {
      results = results.filter((doc) => matchesQuery(doc, stage.$match as Record<string, unknown>));
    } else if (stage.$group) {
      results = aggregateGroup(results, stage.$group as Record<string, unknown>);
    } else if (stage.$sort) {
      const sortEntries = Object.entries(stage.$sort);
      results.sort((a, b) => {
        for (const [field, direction] of sortEntries) {
          const aVal = getNestedValue(a, field);
          const bVal = getNestedValue(b, field);
          const dir = (direction as number) >= 0 ? 1 : -1;
          const cmp = compareValues(aVal, bVal);
          if (cmp !== 0) return cmp * dir;
        }
        return 0;
      });
    } else if (stage.$limit) {
      results = results.slice(0, stage.$limit as number);
    } else if (stage.$skip) {
      results = results.slice(stage.$skip as number);
    } else if (stage.$project) {
      results = results.map((doc) => applyProjection(doc, stage.$project as Record<string, number>));
    } else if (stage.$unwind) {
      const field = typeof stage.$unwind === 'string' ? stage.$unwind.slice(1) : String(stage.$unwind);
      results = results.flatMap((doc) => {
        const arr = getNestedValue(doc, field) as unknown[];
        if (!Array.isArray(arr)) return [doc];
        return arr.map((item) => ({ ...doc, [field]: item }));
      });
    } else if (stage.$lookup) {
      const lookup = stage.$lookup as Record<string, string>;
      const foreignCollection = schema[lookup.from] || [];
      results = results.map((doc) => {
        const localVal = getNestedValue(doc, lookup.localField);
        const matches = foreignCollection.filter((fDoc) => fDoc[lookup.foreignField] === localVal);
        return { ...doc, [lookup.as]: matches };
      });
    } else if (stage.$count) {
      results = [{ [stage.$count as string]: results.length }];
    }
  }

  return results;
}

/**
 * Check if a document matches a MongoDB query filter.
 */
function matchesQuery(doc: Record<string, unknown>, query: Record<string, unknown>): boolean {
  for (const [key, value] of Object.entries(query)) {
    const docValue = getNestedValue(doc, key);

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const conditions = value as Record<string, unknown>;
      for (const [op, expected] of Object.entries(conditions)) {
        if (!matchesOperator(docValue, op, expected)) return false;
      }
    } else if (Array.isArray(value)) {
      if (!Array.isArray(docValue) || !arraysEqual(docValue, value)) return false;
    } else {
      if (docValue !== value) return false;
    }
  }
  return true;
}

/**
 * Match MongoDB operators ($gt, $lt, $in, etc.).
 */
function matchesOperator(docValue: unknown, op: string, expected: unknown): boolean {
  switch (op) {
    case '$eq':
      return docValue === expected;
    case '$ne':
      return docValue !== expected;
    case '$gt':
      return (docValue as number) > (expected as number);
    case '$gte':
      return (docValue as number) >= (expected as number);
    case '$lt':
      return (docValue as number) < (expected as number);
    case '$lte':
      return (docValue as number) <= (expected as number);
    case '$in':
      return (expected as unknown[]).includes(docValue);
    case '$nin':
      return !(expected as unknown[]).includes(docValue);
    case '$exists':
      return expected ? docValue !== undefined : docValue === undefined;
    case '$regex': {
      if (typeof docValue !== 'string') return false;
      try {
        const pattern = typeof expected === 'string' ? expected : expected instanceof RegExp ? expected.source : '';
        if (pattern.length > 1000) return false; // Prevent ReDoS with overly complex patterns
        const regex = expected instanceof RegExp ? expected : new RegExp(pattern);
        return regex.test(docValue);
      } catch {
        return false; // Invalid regex — treat as no match
      }
    }
    case '$size':
      return Array.isArray(docValue) && docValue.length === expected;
    default:
      return docValue === expected;
  }
}

/**
 * Execute $group aggregation stage.
 */
function aggregateGroup(docs: Record<string, unknown>[], group: Record<string, unknown>): Record<string, unknown>[] {
  const _id = group._id;
  const groups = new Map<string, Record<string, unknown>[]>();

  for (const doc of docs) {
    const key = typeof _id === 'string' ? String(getNestedValue(doc, _id.slice(1)) ?? 'null') : JSON.stringify(_id);
    if (!groups.has(key)) groups.set(key, []);
    const group = groups.get(key);
    if (group) group.push(doc);
  }

  const results: Record<string, unknown>[] = [];
  for (const [, groupDocs] of groups) {
    const result: Record<string, unknown> = {};
    if (typeof _id === 'string') {
      result._id = getNestedValue(groupDocs[0], _id.slice(1));
    } else if (typeof _id === 'object') {
      for (const [k, v] of Object.entries(_id as Record<string, string>)) {
        result[k] = getNestedValue(groupDocs[0], v.slice(1));
      }
    }

    for (const [field, expr] of Object.entries(group)) {
      if (field === '_id') continue;
      const exprStr = typeof expr === 'object' ? JSON.stringify(expr) : '';
      if (exprStr.startsWith('{"$sum"')) {
        const fieldRef = (expr as Record<string, string>)['$sum'].slice(1);
        result[field] = groupDocs.reduce((sum, d) => sum + ((getNestedValue(d, fieldRef) as number) || 0), 0);
      } else if (exprStr.startsWith('{"$avg"')) {
        const fieldRef = (expr as Record<string, string>)['$avg'].slice(1);
        result[field] =
          groupDocs.reduce((sum, d) => sum + ((getNestedValue(d, fieldRef) as number) || 0), 0) / groupDocs.length;
      } else if (exprStr.startsWith('{"$count"') || exprStr.startsWith('{}')) {
        result[field] = groupDocs.length;
      } else if (exprStr.startsWith('{"$max"')) {
        const fieldRef = (expr as Record<string, string>)['$max'].slice(1);
        result[field] = Math.max(...groupDocs.map((d) => getNestedValue(d, fieldRef) as number));
      } else if (exprStr.startsWith('{"$min"')) {
        const fieldRef = (expr as Record<string, string>)['$min'].slice(1);
        result[field] = Math.min(...groupDocs.map((d) => getNestedValue(d, fieldRef) as number));
      }
    }
    results.push(result);
  }

  return results;
}

/**
 * Get nested value from document using dot notation.
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === 'object') {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return current;
}

/**
 * Apply projection to document.
 */
function applyProjection(doc: Record<string, unknown>, projection: Record<string, number>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [field, include] of Object.entries(projection)) {
    if (Number(include) === 1) {
      result[field] = getNestedValue(doc, field);
    }
  }
  return Object.keys(result).length > 0 ? result : doc;
}

/**
 * Compare two arrays for equality.
 */
function arraysEqual(a: unknown[], b: unknown[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((val, i) => val === b[i]);
}

/**
 * Execute a MongoDB query with schema (in-memory mode).
 */
export function executeMongoQuery(queryStr: string, schema: MongoSchema): MongoResult {
  const startTime = Date.now();

  try {
    const parsed = parseMongoQuery(queryStr);
    if (!parsed) {
      return {
        success: false,
        columns: [],
        rows: [],
        error: 'Failed to parse MongoDB query. Use db.collection.find() or db.collection.aggregate()',
      };
    }

    let rows: Record<string, unknown>[];

    if (parsed.type === 'find') {
      const options = (parsed.options as Record<string, unknown>) || {};
      rows = executeFind(parsed.collection, schema, options);
    } else {
      rows = executeAggregate(parsed.collection, schema, parsed.options as Record<string, unknown>[]);
    }

    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
    const executionTime = Date.now() - startTime;

    return {
      success: true,
      columns,
      rows: rows.slice(0, 1000),
      executionTime,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown MongoDB error';
    return {
      success: false,
      columns: [],
      rows: [],
      error: `MongoDB error: ${message}`,
    };
  }
}

/**
 * Execute a MongoDB query with real MongoDB connection.
 */
export async function executeMongoQueryReal(
  queryStr: string,
  connectionString: string,
  databaseName: string,
): Promise<MongoResult> {
  const startTime = Date.now();

  let client: import('mongodb').MongoClient | undefined;
  try {
    const { MongoClient } = await import('mongodb');
    client = new MongoClient(connectionString, { serverSelectionTimeoutMS: 3000 });
    await client.connect();

    const parsed = parseMongoQuery(queryStr);
    if (!parsed) {
      return {
        success: false,
        columns: [],
        rows: [],
        error: 'Failed to parse MongoDB query',
      };
    }

    const db = client.db(databaseName);
    let rows: Record<string, unknown>[];

    if (parsed.type === 'find') {
      const options = (parsed.options as Record<string, unknown>) || {};
      const { query = {}, projection = {}, sort = {}, limit, skip } = options;
      const cursor = db.collection(parsed.collection).find(query as Record<string, unknown>, {
        projection: projection as Record<string, number>,
        skip: skip as number,
        limit: limit as number,
      });
      if (sort) cursor.sort(sort as Record<string, 1 | -1>);
      rows = await cursor.toArray();
    } else {
      const cursor = db.collection(parsed.collection).aggregate(parsed.options as Record<string, unknown>[]);
      rows = await cursor.toArray();
    }

    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
    const executionTime = Date.now() - startTime;

    return {
      success: true,
      columns,
      rows: rows.slice(0, 1000),
      executionTime,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown MongoDB error';
    return {
      success: false,
      columns: [],
      rows: [],
      error: `MongoDB error: ${message}`,
    };
  } finally {
    await client?.close();
  }
}
