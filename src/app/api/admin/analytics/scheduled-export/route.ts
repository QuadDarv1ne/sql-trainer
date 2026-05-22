import { withAdminAuth, parseDateParams } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db-users';

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

  const reports = db.prepare(`
    SELECT id, user_id, report_type, format, schedule, email_recipients, active, created_at, last_run
    FROM scheduled_reports
    ORDER BY created_at DESC
  `).all() as Array<{
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
    scheduledReports: reports.map(r => ({
      ...r,
      email_recipients: JSON.parse(r.email_recipients),
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

  const body = await request.json();
  const { reportType, format = 'csv', schedule = 'weekly', emailRecipients = [] } = body;

  if (!reportType) {
    return NextResponse.json({ error: 'reportType is required' }, { status: 400 });
  }

  const id = `sr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = Date.now();

  db.prepare(`
    INSERT INTO scheduled_reports (id, user_id, report_type, format, schedule, email_recipients, active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?)
  `).run(
    id,
    session.user.id,
    reportType,
    format,
    schedule,
    JSON.stringify(emailRecipients),
    now,
  );

  return NextResponse.json({ id, message: 'Scheduled report created' }, { status: 201 });
});

export const DELETE = withAdminAuth(async ({ request }) => {
  const db = getDb();
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  db.prepare('DELETE FROM scheduled_reports WHERE id = ?').run(id);
  return NextResponse.json({ message: 'Scheduled report deleted' });
});
