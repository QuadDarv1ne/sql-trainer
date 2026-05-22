/**
 * Email sending infrastructure using nodemailer.
 * Lazy initialization to avoid edge runtime issues.
 */
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { smtpConfig, isEmailConfigured } from './notification-config';
import { tWithLocale, type Locale } from './i18n';
import { getDb, queueEmail, getDueEmails, markEmailSent, markEmailFailed } from './db-users';

let _transporter: Transporter | null = null;

export function getTransporter(): Transporter | null {
  if (!isEmailConfigured()) return null;
  if (_transporter) return _transporter;

  _transporter = nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
    auth: {
      user: smtpConfig.user,
      pass: smtpConfig.pass,
    },
  });

  return _transporter;
}

export async function sendEmail(to: string, subject: string, html: string): Promise<{ success: boolean; error?: string }> {
  const transporter = getTransporter();
  if (!transporter) {
    return { success: false, error: 'Email not configured' };
  }

  try {
    await transporter.sendMail({
      from: smtpConfig.from,
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export function renderReminderEmail(reminder: {
  title: string;
  type: string;
  due_at: number;
  is_overdue: boolean;
  description?: string;
}, locale: string = 'ru'): string {
  // Use tWithLocale to avoid mutating global state (race condition in concurrent server environments)
  const safeLocale = (locale === 'en' ? 'en' : 'ru') as Locale;

  const typeLabels: Record<string, string> = {
    course: tWithLocale(safeLocale, 'reminder.course'),
    exam: tWithLocale(safeLocale, 'reminder.exam'),
    task: tWithLocale(safeLocale, 'reminder.task'),
    inactivity: tWithLocale(safeLocale, 'reminder.inactivity'),
  };

  const dueDate = new Date(reminder.due_at).toLocaleString(safeLocale === 'ru' ? 'ru-RU' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const statusText = reminder.is_overdue
    ? tWithLocale(safeLocale, 'reminder.overdue')
    : tWithLocale(safeLocale, 'reminder.dueSoon');

  const escapedTitle = escapeHtml(reminder.title);
  const escapedDescription = reminder.description ? escapeHtml(reminder.description) : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px; border-radius: 12px 12px 0 0; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { background: #f8f9fa; padding: 24px; border-radius: 0 0 12px 12px; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
        .badge-warning { background: #fef3c7; color: #92400e; }
        .badge-danger { background: #fee2e2; color: #991b1b; }
        .deadline-title { font-size: 20px; font-weight: 600; margin: 16px 0 8px; }
        .deadline-meta { color: #6b7280; font-size: 14px; margin-bottom: 16px; }
        .cta { display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; margin-top: 16px; }
        .footer { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 24px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>SQL Trainer</h1>
      </div>
      <div class="content">
        <span class="badge ${reminder.is_overdue ? 'badge-danger' : 'badge-warning'}">${statusText}</span>
        <div class="deadline-title">${escapedTitle}</div>
        <div class="deadline-meta">
          ${typeLabels[reminder.type] || reminder.type} &middot; ${dueDate}
        </div>
        ${escapedDescription ? `<p>${escapedDescription}</p>` : ''}
        <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}" class="cta">${tWithLocale(safeLocale, 'email.reminder.viewDeadline')}</a>
      </div>
      <div class="footer">
        SQL Trainer &middot; ${new Date().getFullYear()}
      </div>
    </body>
    </html>
  `;

  return html;
}

export function getUserEmail(userId: string): string | null {
  const db = getDb();
  const user = db.prepare('SELECT email FROM users WHERE id = ?').get(userId) as { email: string } | undefined;
  return user?.email || null;
}

export async function processEmailQueue(): Promise<{ sent: number; failed: number }> {
  const emails = getDueEmails();
  if (emails.length === 0) return { sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;

  for (const email of emails) {
    const result = await sendEmail(getUserEmail(email.user_id) || '', email.subject, email.body_html);
    if (result.success) {
      markEmailSent(email.id);
      sent++;
    } else {
      markEmailFailed(email.id, result.error || 'Unknown error');
      failed++;
    }
  }

  return { sent, failed };
}
