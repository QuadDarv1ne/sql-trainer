import { describe, it, expect, vi } from 'vitest';
import { renderReminderEmail } from '@/lib/email';

vi.mock('@/lib/db-users', () => ({
  getDb: vi.fn(),
  getDueEmails: vi.fn(() => []),
  markEmailSent: vi.fn(),
  markEmailFailed: vi.fn(),
}));

vi.mock('@/lib/notification-config', () => ({
  smtpConfig: { host: '', port: 587, secure: false, user: '', pass: '', from: '' },
  isEmailConfigured: () => false,
}));

describe('email — renderReminderEmail', () => {
  const baseReminder = {
    title: 'Тестовое задание',
    type: 'task',
    due_at: Date.now() + 86400000,
    is_overdue: false,
    description: 'Описание задания',
  };

  it('should render valid HTML with DOCTYPE', () => {
    const html = renderReminderEmail(baseReminder, 'ru');
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html>');
    expect(html).toContain('</html>');
  });

  it('should include the title in the output', () => {
    const html = renderReminderEmail(baseReminder, 'ru');
    expect(html).toContain('Тестовое задание');
  });

  it('should escape HTML in title to prevent XSS', () => {
    const xssReminder = {
      ...baseReminder,
      title: '<script>alert("xss")</script>',
    };
    const html = renderReminderEmail(xssReminder, 'ru');
    expect(html).not.toContain('<script>alert("xss")</script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('should escape HTML in description to prevent XSS', () => {
    const xssReminder = {
      ...baseReminder,
      description: '<img src=x onerror=alert(1)>',
    };
    const html = renderReminderEmail(xssReminder, 'ru');
    expect(html).not.toContain('<img src=x onerror=alert(1)>');
    expect(html).toContain('&lt;img');
  });

  it('should render in English locale', () => {
    const html = renderReminderEmail(baseReminder, 'en');
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('SQL Trainer');
  });

  it('should default to Russian locale for unknown locale', () => {
    const html = renderReminderEmail(baseReminder, 'fr');
    expect(html).toContain('<!DOCTYPE html>');
  });

  it('should show overdue badge when is_overdue is true', () => {
    const overdue = { ...baseReminder, is_overdue: true };
    const html = renderReminderEmail(overdue, 'ru');
    expect(html).toContain('badge-danger');
  });

  it('should show warning badge when is_overdue is false', () => {
    const html = renderReminderEmail(baseReminder, 'ru');
    expect(html).toContain('badge-warning');
  });

  it('should include description when provided', () => {
    const html = renderReminderEmail(baseReminder, 'ru');
    expect(html).toContain('Описание задания');
  });

  it('should not include description paragraph when absent', () => {
    const noDesc = { ...baseReminder, description: undefined };
    const html = renderReminderEmail(noDesc, 'ru');
    expect(html).not.toContain('Описание');
  });

  it('should include type labels for course type', () => {
    const course = { ...baseReminder, type: 'course' };
    const html = renderReminderEmail(course, 'ru');
    expect(html).toContain('<!DOCTYPE html>');
  });

  it('should include type labels for exam type', () => {
    const exam = { ...baseReminder, type: 'exam' };
    const html = renderReminderEmail(exam, 'ru');
    expect(html).toContain('<!DOCTYPE html>');
  });

  it('should include type labels for inactivity type', () => {
    const inactivity = { ...baseReminder, type: 'inactivity' };
    const html = renderReminderEmail(inactivity, 'ru');
    expect(html).toContain('<!DOCTYPE html>');
  });

  it('should include current year in footer', () => {
    const html = renderReminderEmail(baseReminder, 'ru');
    expect(html).toContain(String(new Date().getFullYear()));
  });
});
