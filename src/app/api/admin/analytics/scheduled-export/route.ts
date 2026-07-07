import { withAdminAuth } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db-users';
import { logger } from '@/lib/logger';
import { parseAndValidate } from '@/lib/validation';
import { z } from 'zod';

const scheduledExportSchema = z.object({
  reportType: z.string().min(1, 'reportType is required'),
  format: z.enum(['csv', 'json']).default('csv'),
  schedule: z.enum(['daily', 'weekly', 'monthly']).default('weekly'),
  emailRecipients: z.array(z.string().email()).default([]),
});

export const GET = withAdminAuth(async () => {
  const db = getDb();

  // Ensure scheduled_reports table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS scheduled_reports (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      report_type TEXT NOT NULL,
      format TEXT NOT NULL DEFAULT 'csv',
      schedule TEXT NOT NULL DEFAULT 'weekly',
      email_recipients TEXT NOT NULL DEFAULT '[]',
      active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      last_run INTEGER
    );
  `);

  const reports = db
    .prepare(
      `
    SELECT id, user_id, report_type, format, schedule, email_recipients, active, created_at, last_run
    FROM scheduled_reports
    ORDER BY created_at DESC
  `,
    )
    .all() as Array<{
    id: string;
    user_id: string;
    report_type: string;
    format: string;
    schedule: string;
    email_recipients: string;
    active: number;
    created_at: number;
    last_run: number | null;
  }>;

  return NextResponse.json({
    scheduledReports: reports.map((r) => ({
      ...r,
      email_recipients: (() => {
        try {
          return JSON.parse(r.email_recipients);
        } catch (e) {
          logger.error('Failed to parse email_recipients JSON:', e);
          return [];
        }
      })(),
    })),
  });
});

export const POST = withAdminAuth(async ({ session, request }) => {
  const db = getDb();

  // Ensure table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS scheduled_reports (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      report_type TEXT NOT NULL,
      format TEXT NOT NULL DEFAULT 'csv',
      schedule TEXT NOT NULL DEFAULT 'weekly',
      email_recipients TEXT NOT NULL DEFAULT '[]',
      active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      last_run INTEGER
    );
  `);

  const parsed = await parseAndValidate(request, scheduledExportSchema);
  if ('response' in parsed) return parsed.response;

  const { reportType, format, schedule, emailRecipients } = parsed.data;

  const id = `sr_${Date.now()}_${crypto.randomUUID()}`;
  const now = Date.now();

  db.prepare(
    `
    INSERT INTO scheduled_reports (id, user_id, report_type, format, schedule, email_recipients, active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?)
  `,
  ).run(id, session.user.id, reportType, format, schedule, JSON.stringify(emailRecipients), now);

  return NextResponse.json({ success: true, id, message: 'Scheduled report created' }, { status: 201 });
});

export const DELETE = withAdminAuth(async ({ request }) => {
  const db = getDb();
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id || !id.startsWith('sr_')) {
    return NextResponse.json({ success: false, error: 'Invalid report id' }, { status: 400 });
  }

  const result = db.prepare('DELETE FROM scheduled_reports WHERE id = ?').run(id);
  if (result.changes === 0) {
    return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: 'Scheduled report deleted' });
});
