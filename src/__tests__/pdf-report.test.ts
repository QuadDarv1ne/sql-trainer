import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock window.open and sonner toast before importing the module
const { mockOpen, mockToast } = vi.hoisted(() => ({
  mockOpen: vi.fn(() => ({
    document: {
      write: vi.fn(),
      close: vi.fn(),
    },
    focus: vi.fn(),
    closed: false,
    print: vi.fn(),
    close: vi.fn(),
  })),
  mockToast: { error: vi.fn() },
}));

vi.mock('sonner', () => ({ toast: mockToast }));

// Mock html-utils escapeHtml to return input as-is for testing
vi.mock('@/lib/html-utils', () => ({
  escapeHtml: (str: string) => str,
}));

// Mock window.open
Object.defineProperty(globalThis, 'window', {
  value: {
    open: mockOpen,
  },
  writable: true,
});

import {
  generateStudentReportPDF,
  generateClassReportPDF,
  generateAnalyticsPDF,
} from '@/lib/pdf-report';

describe('pdf-report', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('generateStudentReportPDF', () => {
    const student = {
      name: 'John Doe',
      email: 'john@example.com',
      tasks_completed: 10,
      avg_attempts: 2.5,
      beginner_completed: 5,
      intermediate_completed: 3,
      advanced_completed: 2,
      achievements_count: 8,
      last_active: Date.now(),
    };

    it('should open a print window', () => {
      generateStudentReportPDF(student, { title: 'Student Report' });
      expect(mockOpen).toHaveBeenCalledWith('', '_blank');
    });

    it('should use default Russian locale', () => {
      generateStudentReportPDF(student, { title: 'Отчёт' });
      const printWindow = mockOpen.mock.results[0].value;
      expect(printWindow.document.write).toHaveBeenCalled();
      const html = printWindow.document.write.mock.calls[0][0];
      expect(html).toContain('Имя');
      expect(html).toContain('Email');
    });

    it('should use English locale when specified', () => {
      generateStudentReportPDF(student, { title: 'Report', locale: 'en' });
      const printWindow = mockOpen.mock.results[0].value;
      const html = printWindow.document.write.mock.calls[0][0];
      expect(html).toContain('Name');
      expect(html).toContain('Performance Statistics');
    });

    it('should use Chinese locale when specified', () => {
      generateStudentReportPDF(student, { title: '报告', locale: 'zh' });
      const printWindow = mockOpen.mock.results[0].value;
      const html = printWindow.document.write.mock.calls[0][0];
      expect(html).toContain('姓名');
      expect(html).toContain('表现统计');
    });

    it('should include student name and email in report', () => {
      generateStudentReportPDF(student, { title: 'Report', locale: 'en' });
      const html = mockOpen.mock.results[0].value.document.write.mock.calls[0][0];
      expect(html).toContain('John Doe');
      expect(html).toContain('john@example.com');
    });

    it('should include subtitle when provided', () => {
      generateStudentReportPDF(student, { title: 'Report', subtitle: 'Q3 2026', locale: 'en' });
      const html = mockOpen.mock.results[0].value.document.write.mock.calls[0][0];
      expect(html).toContain('Q3 2026');
    });

    it('should handle null last_active', () => {
      const noActivity = { ...student, last_active: null };
      generateStudentReportPDF(noActivity, { title: 'Report', locale: 'en' });
      const html = mockOpen.mock.results[0].value.document.write.mock.calls[0][0];
      expect(html).toContain('No Activity');
    });
  });

  describe('generateClassReportPDF', () => {
    const report = {
      total_students: 25,
      active_students: 20,
      avg_completion_rate: 75,
      avg_attempts: 3.2,
      at_risk_count: 3,
      excelling_count: 5,
      top_performers: [
        { user_id: 'u1', name: 'Alice', tasks_completed: 15, avg_attempts: 1.5 },
      ],
      struggling_students: [
        { user_id: 'u2', name: 'Bob', tasks_completed: 2, avg_attempts: 5.0 },
      ],
      inactive_students: [
        { user_id: 'u3', name: 'Charlie', last_active: Date.now() - 86400000 * 7 },
      ],
    };

    it('should open a print window', () => {
      generateClassReportPDF(report, { title: 'Class Report' });
      expect(mockOpen).toHaveBeenCalledWith('', '_blank');
    });

    it('should include top performers table', () => {
      generateClassReportPDF(report, { title: 'Report', locale: 'en' });
      const html = mockOpen.mock.results[0].value.document.write.mock.calls[0][0];
      expect(html).toContain('Alice');
      expect(html).toContain('Top Performers');
    });

    it('should include struggling students table', () => {
      generateClassReportPDF(report, { title: 'Report', locale: 'en' });
      const html = mockOpen.mock.results[0].value.document.write.mock.calls[0][0];
      expect(html).toContain('Bob');
      expect(html).toContain('Struggling');
    });
  });

  describe('generateAnalyticsPDF', () => {
    it('should generate overview section', () => {
      const data = {
        overview: {
          total_students: 100,
          active_students: 80,
          avg_completion_rate: 65,
          avg_attempts: 2.8,
        },
      };
      generateAnalyticsPDF(data, ['overview'], { title: 'Analytics', locale: 'en' });
      const html = mockOpen.mock.results[0].value.document.write.mock.calls[0][0];
      expect(html).toContain('100');
      expect(html).toContain('80');
      expect(html).toContain('Overview');
    });

    it('should handle multiple sections', () => {
      const data = {
        overview: { total_students: 50, active_students: 40, avg_completion_rate: 80, avg_attempts: 2.0 },
        registrations: { new_this_week: 5, new_this_month: 20, growth_rate: 10, daily: [] },
      };
      generateAnalyticsPDF(data, ['overview', 'registrations'], { title: 'Report', locale: 'en' });
      const html = mockOpen.mock.results[0].value.document.write.mock.calls[0][0];
      expect(html).toContain('Overview');
      expect(html).toContain('Registrations');
    });

    it('should skip sections with no data', () => {
      const data = { overview: { total_students: 10, active_students: 8, avg_completion_rate: 50, avg_attempts: 3.0 } };
      generateAnalyticsPDF(data, ['streaks'], { title: 'Report', locale: 'en' });
      const html = mockOpen.mock.results[0].value.document.write.mock.calls[0][0];
      expect(html).not.toContain('Streaks');
    });

    it('should show popup blocked toast when window.open returns null', () => {
      mockOpen.mockReturnValueOnce(null as any);
      generateAnalyticsPDF({ overview: { total_students: 1, active_students: 1, avg_completion_rate: 100, avg_attempts: 1 } }, ['overview'], { title: 'Test' });
      expect(mockToast.error).toHaveBeenCalled();
    });
  });
});
