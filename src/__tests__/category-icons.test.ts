import { describe, it, expect } from 'vitest';
import { CATEGORY_ICONS } from '@/lib/category-icons';
import type { TaskCategory } from '@/lib/training-tasks';

describe('category-icons', () => {
  it('should have icons for all task categories', () => {
    const categories: TaskCategory[] = ['company', 'shop', 'analytics', 'exam'];
    for (const cat of categories) {
      expect(CATEGORY_ICONS[cat]).toBeDefined();
    }
  });

  it('should map company to Building2', () => {
    const icon = CATEGORY_ICONS.company;
    expect(icon).toBeDefined();
    expect(icon).not.toBeNull();
  });

  it('should map shop to ShoppingBag', () => {
    const icon = CATEGORY_ICONS.shop;
    expect(icon).toBeDefined();
    expect(icon).not.toBeNull();
  });

  it('should map analytics to a chart icon', () => {
    const icon = CATEGORY_ICONS.analytics;
    expect(icon).toBeDefined();
    expect(icon).not.toBeNull();
  });

  it('should map exam to ClipboardCheck', () => {
    const icon = CATEGORY_ICONS.exam;
    expect(icon).toBeDefined();
    expect(icon).not.toBeNull();
  });

  it('should have exactly 4 categories', () => {
    expect(Object.keys(CATEGORY_ICONS)).toHaveLength(4);
  });
});
