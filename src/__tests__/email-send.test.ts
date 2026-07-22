import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db-users', () => ({
  getDb: vi.fn(),
  getDueEmails: vi.fn(() => []),
  markEmailSent: vi.fn(),
  markEmailFailed: vi.fn(),
}));

vi.mock('@/lib/notification-config', () => ({
  smtpConfig: { host: 'smtp.test.com', port: 587, secure: false, user: 'user', pass: 'pass', from: 'test@test.com' },
  isEmailConfigured: vi.fn(() => true),
}));

const mockSendMail = vi.fn().mockResolvedValue({ messageId: 'test-id' });

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: mockSendMail,
    })),
  },
}));

describe('email — sendEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendMail.mockResolvedValue({ messageId: 'test-id' });
  });

  it('should return success when email is sent', async () => {
    const { sendEmail } = await import('@/lib/email');
    const result = await sendEmail('recipient@test.com', 'Test Subject', '<p>Hello</p>');
    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should call nodemailer sendMail with correct params', async () => {
    const { sendEmail } = await import('@/lib/email');
    await sendEmail('to@test.com', 'Subject', '<p>body</p>');
    expect(mockSendMail).toHaveBeenCalledWith({
      from: 'test@test.com',
      to: 'to@test.com',
      subject: 'Subject',
      html: '<p>body</p>',
    });
  });

  it('should return error when sendMail throws', async () => {
    mockSendMail.mockRejectedValueOnce(new Error('SMTP connection refused'));
    const { sendEmail } = await import('@/lib/email');
    const result = await sendEmail('to@test.com', 'Subject', '<p>body</p>');
    expect(result.success).toBe(false);
    expect(result.error).toBe('SMTP connection refused');
  });

  it('should handle non-Error thrown values', async () => {
    mockSendMail.mockRejectedValueOnce('string error');
    const { sendEmail } = await import('@/lib/email');
    const result = await sendEmail('to@test.com', 'Subject', '<p>body</p>');
    expect(result.success).toBe(false);
    expect(result.error).toBe('string error');
  });
});

describe('email — processEmailQueue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendMail.mockResolvedValue({ messageId: 'test-id' });
  });

  it('should return zero counts when queue is empty', async () => {
    const { processEmailQueue } = await import('@/lib/email');
    const result = await processEmailQueue();
    expect(result.sent).toBe(0);
    expect(result.failed).toBe(0);
  });

  it('should process emails and mark as sent', async () => {
    const { getDueEmails, markEmailSent, getDb } = await import('@/lib/db-users');
    vi.mocked(getDueEmails).mockReturnValue([
      {
        id: 'email-1',
        user_id: 'user-1',
        subject: 'Test',
        body_html: '<p>Test</p>',
        scheduled_at: Date.now(),
        status: 'pending',
        attempts: 0,
        max_attempts: 3,
        error: null,
        created_at: Date.now(),
      },
    ]);

    const mockDb = {
      prepare: vi.fn(() => ({
        get: vi.fn(() => ({ email: 'test@test.com' })),
      })),
    };
    vi.mocked(getDb).mockReturnValue(mockDb as any);

    const { processEmailQueue } = await import('@/lib/email');
    const result = await processEmailQueue();

    expect(result.sent).toBe(1);
    expect(result.failed).toBe(0);
    expect(markEmailSent).toHaveBeenCalledWith('email-1');
  });

  it('should skip emails for users without email', async () => {
    const { getDueEmails, getDb } = await import('@/lib/db-users');
    vi.mocked(getDueEmails).mockReturnValue([
      {
        id: 'email-2',
        user_id: 'user-no-email',
        subject: 'Test',
        body_html: '<p>Test</p>',
        scheduled_at: Date.now(),
        status: 'pending',
        attempts: 0,
        max_attempts: 3,
        error: null,
        created_at: Date.now(),
      },
    ]);

    const mockDb = {
      prepare: vi.fn(() => ({
        get: vi.fn(() => undefined),
      })),
    };
    vi.mocked(getDb).mockReturnValue(mockDb as any);

    const { processEmailQueue } = await import('@/lib/email');
    const result = await processEmailQueue();

    expect(result.sent).toBe(0);
    expect(result.failed).toBe(0);
  });

  it('should mark failed emails on send error', async () => {
    mockSendMail.mockRejectedValueOnce(new Error('Connection timeout'));

    const { getDueEmails, markEmailFailed, getDb } = await import('@/lib/db-users');
    vi.mocked(getDueEmails).mockReturnValue([
      {
        id: 'email-fail',
        user_id: 'user-2',
        subject: 'Fail',
        body_html: '<p>Fail</p>',
        scheduled_at: Date.now(),
        status: 'pending',
        attempts: 0,
        max_attempts: 3,
        error: null,
        created_at: Date.now(),
      },
    ]);

    const mockDb = {
      prepare: vi.fn(() => ({
        get: vi.fn(() => ({ email: 'fail@test.com' })),
      })),
    };
    vi.mocked(getDb).mockReturnValue(mockDb as any);

    const { processEmailQueue } = await import('@/lib/email');
    const result = await processEmailQueue();

    expect(result.sent).toBe(0);
    expect(result.failed).toBe(1);
    expect(markEmailFailed).toHaveBeenCalledWith('email-fail', 'Connection timeout');
  });
});
