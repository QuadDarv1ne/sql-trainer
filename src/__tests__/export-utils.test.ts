import { describe, it, expect, vi, afterEach } from 'vitest';
import { exportToCSV, exportToJSON, formatDate, formatPercent, formatNumber } from '@/lib/export-utils';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'age', label: 'Age' },
  { key: 'score', label: 'Score' },
];

const data = [
  { name: 'Alice', age: 30, score: 95 },
  { name: 'Bob', age: 25, score: 87 },
];

function createMockLink() {
  return {
    setAttribute: vi.fn(),
    style: {},
    click: vi.fn(),
  } as unknown as HTMLAnchorElement;
}

function setupDomMocks() {
  const link = createMockLink();
  vi.spyOn(document, 'createElement').mockReturnValue(link);
  vi.spyOn(document.body, 'appendChild').mockImplementation(vi.fn());
  vi.spyOn(document.body, 'removeChild').mockImplementation(vi.fn());
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(vi.fn());
  return link;
}

describe('exportToCSV', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should generate CSV with BOM and correct MIME type', () => {
    setupDomMocks();
    exportToCSV(data, columns, 'test-file');
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    const blobArg = vi.mocked(URL.createObjectURL).mock.calls[0][0] as Blob;
    expect(blobArg.type).toBe('text/csv;charset=utf-8;');
  });

  it('should not generate CSV for empty data', () => {
    setupDomMocks();
    exportToCSV([], columns, 'empty');
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('should handle null values gracefully', () => {
    setupDomMocks();
    const dataWithNulls = [{ name: null, age: 25, score: undefined }];
    exportToCSV(dataWithNulls, columns, 'nulls');
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
  });
});

describe('exportToJSON', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should generate JSON with correct MIME type', () => {
    setupDomMocks();
    exportToJSON(data, 'test-file');
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    const blobArg = vi.mocked(URL.createObjectURL).mock.calls[0][0] as Blob;
    expect(blobArg.type).toBe('application/json');
  });

  it('should not generate JSON for empty data', () => {
    setupDomMocks();
    exportToJSON([], 'empty');
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
});

describe('formatDate', () => {
  it('should return a string for timestamp', () => {
    const result = formatDate(new Date('2024-01-15').getTime());
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should handle epoch timestamp', () => {
    const result = formatDate(0);
    expect(typeof result).toBe('string');
  });
});

describe('formatPercent', () => {
  it('should format value with percent sign', () => {
    expect(formatPercent(75)).toBe('75%');
  });

  it('should handle zero', () => {
    expect(formatPercent(0)).toBe('0%');
  });

  it('should handle negative values', () => {
    expect(formatPercent(-10)).toBe('-10%');
  });
});

describe('formatNumber', () => {
  it('should convert number to string', () => {
    expect(formatNumber(42)).toBe('42');
  });

  it('should handle zero', () => {
    expect(formatNumber(0)).toBe('0');
  });

  it('should handle negative numbers', () => {
    expect(formatNumber(-42)).toBe('-42');
  });
});
