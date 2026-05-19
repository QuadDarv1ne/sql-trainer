/**
 * Notification configuration — SMTP and VAPID settings loaded from environment variables.
 */

export const smtpConfig = {
  host: process.env.SMTP_HOST || '',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  user: process.env.SMTP_USER || '',
  pass: process.env.SMTP_PASS || '',
  from: process.env.SMTP_FROM || 'SQL Trainer <noreply@example.com>',
};

export const vapidConfig = {
  publicKey: process.env.VAPID_PUBLIC_KEY || '',
  privateKey: process.env.VAPID_PRIVATE_KEY || '',
  subject: process.env.VAPID_SUBJECT || '',
};

export function isEmailConfigured(): boolean {
  return !!(smtpConfig.host && smtpConfig.user && smtpConfig.pass);
}

export function isPushConfigured(): boolean {
  return !!(vapidConfig.publicKey && vapidConfig.privateKey);
}

/**
 * Available reminder intervals in milliseconds.
 */
export const REMINDER_INTERVALS = [
  { label: '30 мин', value: 1800000 },
  { label: '1 час', value: 3600000 },
  { label: '3 часа', value: 10800000 },
  { label: '12 часов', value: 43200000 },
  { label: '1 день', value: 86400000 },
  { label: '3 дня', value: 259200000 },
] as const;

/**
 * Available notification channels.
 */
export const NOTIFICATION_CHANNELS = [
  { id: 'in_app', label: 'В приложении' },
  { id: 'push', label: 'Push-уведомления' },
  { id: 'email', label: 'Email' },
] as const;
