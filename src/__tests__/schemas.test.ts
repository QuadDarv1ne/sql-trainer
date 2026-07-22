import { describe, it, expect } from 'vitest';
import {
  EMPLOYEES_SCHEMA,
  SHOP_SCHEMA,
  ANALYTICS_SCHEMA,
  CLICKHOUSE_EVENTS_SCHEMA,
  EMPTY_ORDERS_SCHEMA,
  INDEX_DEMO_SCHEMA,
} from '@/lib/tasks/schemas';

describe('tasks/schemas', () => {
  const schemas = [
    { name: 'EMPLOYEES_SCHEMA', schema: EMPLOYEES_SCHEMA },
    { name: 'SHOP_SCHEMA', schema: SHOP_SCHEMA },
    { name: 'ANALYTICS_SCHEMA', schema: ANALYTICS_SCHEMA },
    { name: 'CLICKHOUSE_EVENTS_SCHEMA', schema: CLICKHOUSE_EVENTS_SCHEMA },
    { name: 'EMPTY_ORDERS_SCHEMA', schema: EMPTY_ORDERS_SCHEMA },
    { name: 'INDEX_DEMO_SCHEMA', schema: INDEX_DEMO_SCHEMA },
  ];

  it('should export all 6 schema constants', () => {
    expect(schemas.length).toBe(6);
    for (const { schema } of schemas) {
      expect(typeof schema).toBe('string');
      expect(schema.length).toBeGreaterThan(0);
    }
  });

  it.each(schemas)('$name should contain CREATE TABLE', ({ schema }) => {
    expect(schema).toMatch(/CREATE TABLE/i);
  });

  it('EMPLOYEES_SCHEMA should have departments, employees, projects, assignments tables', () => {
    expect(EMPLOYEES_SCHEMA).toContain('CREATE TABLE departments');
    expect(EMPLOYEES_SCHEMA).toContain('CREATE TABLE employees');
    expect(EMPLOYEES_SCHEMA).toContain('CREATE TABLE projects');
    expect(EMPLOYEES_SCHEMA).toContain('CREATE TABLE assignments');
  });

  it('EMPLOYEES_SCHEMA should have INSERT data for all tables', () => {
    expect(EMPLOYEES_SCHEMA).toContain('INSERT INTO departments');
    expect(EMPLOYEES_SCHEMA).toContain('INSERT INTO employees');
    expect(EMPLOYEES_SCHEMA).toContain('INSERT INTO projects');
    expect(EMPLOYEES_SCHEMA).toContain('INSERT INTO assignments');
  });

  it('SHOP_SCHEMA should have categories, customers, products, orders, order_items, reviews', () => {
    expect(SHOP_SCHEMA).toContain('CREATE TABLE categories');
    expect(SHOP_SCHEMA).toContain('CREATE TABLE customers');
    expect(SHOP_SCHEMA).toContain('CREATE TABLE products');
    expect(SHOP_SCHEMA).toContain('CREATE TABLE orders');
    expect(SHOP_SCHEMA).toContain('CREATE TABLE order_items');
    expect(SHOP_SCHEMA).toContain('CREATE TABLE reviews');
  });

  it('ANALYTICS_SCHEMA should have ClickHouse-specific syntax', () => {
    expect(ANALYTICS_SCHEMA).toContain('ENGINE');
    expect(ANALYTICS_SCHEMA).toContain('CREATE TABLE events');
    expect(ANALYTICS_SCHEMA).toContain('CREATE TABLE users');
    expect(ANALYTICS_SCHEMA).toContain('CREATE TABLE purchases');
  });

  it('CLICKHOUSE_EVENTS_SCHEMA should have single events table', () => {
    expect(CLICKHOUSE_EVENTS_SCHEMA).toContain('CREATE TABLE events');
    expect(CLICKHOUSE_EVENTS_SCHEMA).toContain('ENGINE = Memory');
  });

  it('EMPTY_ORDERS_SCHEMA should have products and orders tables', () => {
    expect(EMPTY_ORDERS_SCHEMA).toContain('CREATE TABLE products');
    expect(EMPTY_ORDERS_SCHEMA).toContain('CREATE TABLE orders');
  });

  it('INDEX_DEMO_SCHEMA should have books table', () => {
    expect(INDEX_DEMO_SCHEMA).toContain('CREATE TABLE books');
    expect(INDEX_DEMO_SCHEMA).toContain('INSERT INTO books');
  });

  it('schemas should not contain suspicious content', () => {
    for (const { schema } of schemas) {
      expect(schema).not.toContain('<script');
      expect(schema).not.toContain('javascript:');
    }
  });
});
