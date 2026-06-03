import { describe, it, expect } from 'vitest';
import { escapeHtml } from '@/lib/html-utils';

describe('escapeHtml', () => {
  it('should escape ampersand', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  it('should escape less than', () => {
    expect(escapeHtml('a < b')).toBe('a &lt; b');
  });

  it('should escape greater than', () => {
    expect(escapeHtml('a > b')).toBe('a &gt; b');
  });

  it('should escape double quote', () => {
    expect(escapeHtml('a "b"')).toBe('a &quot;b&quot;');
  });

  it('should escape single quote', () => {
    expect(escapeHtml("a 'b'")).toBe('a &#x27;b&#x27;');
  });

  it('should escape multiple special characters', () => {
    const input = '<script>alert("XSS")</script>';
    const escaped = escapeHtml(input);
    expect(escaped).not.toContain('<');
    expect(escaped).not.toContain('>');
    expect(escaped).not.toContain('"');
    expect(escaped).toContain('&lt;');
    expect(escaped).toContain('&gt;');
    expect(escaped).toContain('&quot;');
  });

  it('should handle empty string', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('should not modify safe text', () => {
    const safe = 'Hello, World! 123';
    expect(escapeHtml(safe)).toBe(safe);
  });

  it('should escape HTML entities in XSS vector', () => {
    const xss = '<img src=x onerror="alert(1)">';
    const escaped = escapeHtml(xss);
    expect(escaped).toBe('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
  });
});
