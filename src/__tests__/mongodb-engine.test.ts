import { describe, it, expect } from 'vitest';
import { executeMongoQuery, type MongoSchema } from '@/lib/mongodb-engine';

const sampleSchema: MongoSchema = {
  users: [
    { _id: 1, name: 'Alice', age: 30, city: 'NYC', score: 95 },
    { _id: 2, name: 'Bob', age: 25, city: 'LA', score: 87 },
    { _id: 3, name: 'Charlie', age: 35, city: 'NYC', score: 92 },
    { _id: 4, name: 'Diana', age: 28, city: 'LA', score: 78 },
  ],
  items: [
    { _id: 1, name: 'Widget', tags: ['tool', 'metal'], price: 10 },
    { _id: 2, name: 'Gadget', tags: ['electronic'], price: 25 },
    { _id: 3, name: 'Doohickey', tags: ['tool', 'plastic'], price: 5 },
  ],
};

describe('executeMongoQuery - parsing', () => {
  it('fails gracefully for invalid query string', () => {
    const result = executeMongoQuery('not valid', sampleSchema);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Failed to parse');
  });

  it('fails gracefully for empty query string', () => {
    const result = executeMongoQuery('', sampleSchema);
    expect(result.success).toBe(false);
  });
});

describe('executeMongoQuery - find()', () => {
  it('returns all documents with empty query', () => {
    const result = executeMongoQuery('db.users.find()', sampleSchema);
    expect(result.success).toBe(true);
    expect(result.rows).toHaveLength(4);
    expect(result.columns).toContain('name');
  });

  it('filters documents with query', () => {
    const result = executeMongoQuery('db.users.find({ "city": "NYC" })', sampleSchema);
    expect(result.success).toBe(true);
    expect(result.rows).toHaveLength(2);
    expect(result.rows.map((r) => r.name)).toEqual(['Alice', 'Charlie']);
  });

  it('supports $gt operator', () => {
    const result = executeMongoQuery('db.users.find({ "age": { "$gt": 30 } })', sampleSchema);
    expect(result.success).toBe(true);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].name).toBe('Charlie');
  });

  it('supports $gte operator', () => {
    const result = executeMongoQuery('db.users.find({ "age": { "$gte": 30 } })', sampleSchema);
    expect(result.success).toBe(true);
    expect(result.rows).toHaveLength(2);
  });

  it('supports $lt operator', () => {
    const result = executeMongoQuery('db.users.find({ "age": { "$lt": 28 } })', sampleSchema);
    expect(result.success).toBe(true);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].name).toBe('Bob');
  });

  it('supports $lte operator', () => {
    const result = executeMongoQuery('db.users.find({ "age": { "$lte": 28 } })', sampleSchema);
    expect(result.success).toBe(true);
    expect(result.rows).toHaveLength(2);
  });

  it('supports $ne operator', () => {
    const result = executeMongoQuery('db.users.find({ "city": { "$ne": "LA" } })', sampleSchema);
    expect(result.success).toBe(true);
    expect(result.rows).toHaveLength(2);
  });

  it('supports $in operator', () => {
    const result = executeMongoQuery('db.users.find({ "city": { "$in": ["NYC", "LA"] } })', sampleSchema);
    expect(result.success).toBe(true);
    expect(result.rows).toHaveLength(4);
  });

  it('supports $nin operator', () => {
    const result = executeMongoQuery('db.users.find({ "city": { "$nin": ["NYC"] } })', sampleSchema);
    expect(result.success).toBe(true);
    expect(result.rows).toHaveLength(2);
  });

  it('supports $exists operator', () => {
    const result = executeMongoQuery('db.users.find({ "score": { "$exists": true } })', sampleSchema);
    expect(result.success).toBe(true);
    expect(result.rows).toHaveLength(4);
  });

  it('returns empty rows for nonexistent collection', () => {
    const result = executeMongoQuery('db.nonexistent.find()', sampleSchema);
    expect(result.success).toBe(true);
    expect(result.rows).toHaveLength(0);
  });

  it('returns empty for collection with no data', () => {
    const result = executeMongoQuery('db.users.find({ "name": "Zoe" })', sampleSchema);
    expect(result.success).toBe(true);
    expect(result.rows).toHaveLength(0);
  });
});

describe('executeMongoQuery - aggregate()', () => {
  it('supports $match stage', () => {
    const result = executeMongoQuery('db.users.aggregate([{ "$match": { "city": "NYC" } }])', sampleSchema);
    expect(result.success).toBe(true);
    expect(result.rows).toHaveLength(2);
  });

  it('supports $sort stage', () => {
    const result = executeMongoQuery('db.users.aggregate([{ "$sort": { "age": -1 } }])', sampleSchema);
    expect(result.success).toBe(true);
    expect(result.rows[0].name).toBe('Charlie');
    expect(result.rows[3].name).toBe('Bob');
  });

  it('supports $limit stage', () => {
    const result = executeMongoQuery('db.users.aggregate([{ "$limit": 2 }])', sampleSchema);
    expect(result.success).toBe(true);
    expect(result.rows).toHaveLength(2);
  });

  it('supports $skip stage', () => {
    const result = executeMongoQuery('db.users.aggregate([{ "$skip": 2 }])', sampleSchema);
    expect(result.success).toBe(true);
    expect(result.rows).toHaveLength(2);
  });

  it('supports $count stage', () => {
    const result = executeMongoQuery('db.users.aggregate([{ "$count": "total" }])', sampleSchema);
    expect(result.success).toBe(true);
    expect(result.rows[0].total).toBe(4);
  });

  it('supports $group with $sum', () => {
    const result = executeMongoQuery(
      'db.users.aggregate([{ "$group": { "_id": "$city", "totalScore": { "$sum": "$score" } } }])',
      sampleSchema,
    );
    expect(result.success).toBe(true);
    expect(result.rows).toHaveLength(2);
  });

  it('supports $group with $avg', () => {
    const result = executeMongoQuery(
      'db.users.aggregate([{ "$group": { "_id": "$city", "avgAge": { "$avg": "$age" } } }])',
      sampleSchema,
    );
    expect(result.success).toBe(true);
    expect(result.rows).toHaveLength(2);
  });

  it('supports $group with $count (accumulator)', () => {
    const result = executeMongoQuery(
      'db.users.aggregate([{ "$group": { "_id": "$city", "count": { "$count": {} } } }])',
      sampleSchema,
    );
    expect(result.success).toBe(true);
    expect(result.rows).toHaveLength(2);
    const nyc = result.rows.find((r) => r._id === 'NYC');
    expect(nyc?.count).toBe(2);
  });

  it('supports $project stage', () => {
    const result = executeMongoQuery('db.users.aggregate([{ "$project": { "name": 1, "age": 1 } }])', sampleSchema);
    expect(result.success).toBe(true);
    expect(Object.keys(result.rows[0])).toEqual(['name', 'age']);
  });

  it('supports $unwind stage', () => {
    const result = executeMongoQuery('db.items.aggregate([{ "$unwind": "$tags" }])', sampleSchema);
    expect(result.success).toBe(true);
    expect(result.rows.length).toBeGreaterThan(3);
  });

  it('supports $lookup stage', () => {
    const schemaWithRelation: MongoSchema = {
      orders: [
        { _id: 1, user_id: 1, product: 'A' },
        { _id: 2, user_id: 2, product: 'B' },
      ],
      users: [
        { _id: 1, name: 'Alice' },
        { _id: 2, name: 'Bob' },
      ],
    };
    const result = executeMongoQuery(
      'db.orders.aggregate([{ "$lookup": { "from": "users", "localField": "user_id", "foreignField": "_id", "as": "user" } }])',
      schemaWithRelation,
    );
    expect(result.success).toBe(true);
    expect((result.rows[0].user as Record<string, unknown>[])[0].name).toBe('Alice');
  });

  it('supports combined match and sort', () => {
    const result = executeMongoQuery(
      'db.users.aggregate([{ "$match": { "city": "LA" } }, { "$sort": { "age": -1 } }])',
      sampleSchema,
    );
    expect(result.success).toBe(true);
    expect(result.rows[0].name).toBe('Diana'); // age 28 > age 25
  });

  it('supports $group with $min and $max', () => {
    const result = executeMongoQuery(
      'db.users.aggregate([{ "$group": { "_id": "$city", "minAge": { "$min": "$age" }, "maxAge": { "$max": "$age" } } }])',
      sampleSchema,
    );
    expect(result.success).toBe(true);
    const la = result.rows.find((r) => r._id === 'LA');
    expect(la?.minAge).toBe(25);
    expect(la?.maxAge).toBe(28);
  });
});

describe('executeMongoQuery - edge cases', () => {
  it('handles undefined schema gracefully', () => {
    const result = executeMongoQuery('db.test.find()', {});
    expect(result.success).toBe(true);
    expect(result.rows).toHaveLength(0);
  });

  it('handles deeply nested query filter', () => {
    const schema: MongoSchema = {
      data: [{ id: 1, meta: { status: 'active', priority: 5 } }],
    };
    const result = executeMongoQuery('db.data.find({ "meta.status": "active" })', schema);
    expect(result.success).toBe(true);
    expect(result.rows).toHaveLength(1);
  });

  it('supports $regex operator', () => {
    const result = executeMongoQuery('db.users.find({ "name": { "$regex": "^A" } })', sampleSchema);
    expect(result.success).toBe(true);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].name).toBe('Alice');
  });

  it('handles $regex with invalid pattern gracefully', () => {
    const result = executeMongoQuery('db.users.find({ "name": { "$regex": "[invalid" } })', sampleSchema);
    expect(result.success).toBe(true);
    expect(result.rows).toHaveLength(0);
  });

  it('handles complex nested comparison operators', () => {
    const result = executeMongoQuery('db.users.find({ "age": { "$gte": 28, "$lte": 35 } })', sampleSchema);
    expect(result.success).toBe(true);
    expect(result.rows).toHaveLength(3); // Alice(30), Charlie(35), Diana(28)
  });

  it('includes execution time in result', () => {
    const result = executeMongoQuery('db.users.find()', sampleSchema);
    expect(result.success).toBe(true);
    expect(result.executionTime).toBeGreaterThanOrEqual(0);
  });

  it('returns columns based on result fields', () => {
    const result = executeMongoQuery('db.users.find({ "name": "Alice" })', sampleSchema);
    expect(result.columns).toContain('name');
    expect(result.columns).toContain('age');
  });

  it('supports $size operator for array fields', () => {
    const result = executeMongoQuery('db.items.find({ "tags": { "$size": 2 } })', sampleSchema);
    expect(result.success).toBe(true);
    expect(result.rows).toHaveLength(2);
  });

  it('returns error for malformed aggregate JSON', () => {
    const result = executeMongoQuery('db.users.aggregate([{ $malformed }])', sampleSchema);
    expect(result.success).toBe(false);
  });

  it('$exists: false returns only docs without the field', () => {
    const result = executeMongoQuery('db.users.find({ "nonexistent": { "$exists": false } })', sampleSchema);
    expect(result.success).toBe(true);
    expect(result.rows).toHaveLength(4);
  });
});
