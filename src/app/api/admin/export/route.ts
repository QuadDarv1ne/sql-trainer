import { requireAdmin } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import {
  getDBStats,
  getAllUsers,
  getLeaderboard,
  getBannedUsers,
  getDeletedUsers,
  getAuditTrail,
  getAllDeadlines,
  getSystemHealth,
} from '@/lib/db-users';

function toCSV(columns: string[], rows: Record<string, unknown>[]): string {
  const header = columns.join(',');
  const body = rows.map(row =>
    columns.map(c => {
      const val = row[c];
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(',')
  ).join('\n');
  return header + '\n' + body;
}

function csvResponse(data: string, filename: string): Response {
  return new Response(data.startsWith('\uFEFF') ? data : '\uFEFF' + data, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

export async function GET(request: Request): Promise<Response> {
  const authResult = await requireAdmin();
  if (!authResult.session) {
    return authResult.error ?? NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }

  const url = new URL(request.url);
  const section = url.searchParams.get('section') || 'users';
  const ts = Date.now();

  try {
    switch (section) {
      case 'users': {
        const users = getAllUsers();
        const columns = ['id', 'name', 'email', 'phone', 'role', 'created_at', 'last_active', 'tasks_completed', 'avg_attempts', 'achievements_count', 'banned_at', 'ban_reason'];
        const data = users.map(u => ({
          ...u,
          created_at: u.created_at ? new Date(u.created_at).toISOString() : '',
          last_active: u.last_active ? new Date(u.last_active).toISOString() : '',
          banned_at: u.banned_at ? new Date(u.banned_at).toISOString() : '',
        }));
        return csvResponse(toCSV(columns, data), `users_export_${ts}.csv`);
      }
      case 'leaderboard': {
        const leaderboard = getLeaderboard(100, 0);
        const columns = ['user_id', 'name', 'tasks_completed', 'total_attempts'];
        return csvResponse(toCSV(columns, leaderboard as unknown as Record<string, unknown>[]), `leaderboard_${ts}.csv`);
      }
      case 'banned': {
        const banned = getBannedUsers();
        const columns = ['id', 'name', 'email', 'role', 'banned_at', 'ban_reason', 'banned_by_name', 'created_at'];
        const data = banned.map(u => ({
          ...u,
          banned_at: u.banned_at ? new Date(u.banned_at).toISOString() : '',
          created_at: u.created_at ? new Date(u.created_at).toISOString() : '',
        }));
        return csvResponse(toCSV(columns, data), `banned_users_${ts}.csv`);
      }
      case 'deleted': {
        const deleted = getDeletedUsers();
        const columns = ['id', 'name', 'email', 'role', 'deleted_at', 'created_at'];
        const data = deleted.map(u => ({
          ...u,
          deleted_at: u.deleted_at ? new Date(u.deleted_at).toISOString() : '',
          created_at: u.created_at ? new Date(u.created_at).toISOString() : '',
        }));
        return csvResponse(toCSV(columns, data), `deleted_users_${ts}.csv`);
      }
      case 'deadlines': {
        const deadlines = getAllDeadlines();
        const columns = ['id', 'creator_id', 'type', 'title', 'description', 'target_type', 'target_id', 'group_id', 'task_id', 'due_at', 'created_at', 'updated_at'];
        const data = deadlines.map(d => ({
          ...d,
          due_at: d.due_at ? new Date(d.due_at).toISOString() : '',
          created_at: d.created_at ? new Date(d.created_at).toISOString() : '',
          updated_at: d.updated_at ? new Date(d.updated_at).toISOString() : '',
        }));
        return csvResponse(toCSV(columns, data), `deadlines_${ts}.csv`);
      }
      case 'audit': {
        const audit = getAuditTrail(500, 0);
        const columns = ['id', 'actor_id', 'actor_name', 'action', 'target_type', 'target_id', 'details', 'created_at'];
        const data = audit.map(a => ({
          ...a,
          created_at: a.created_at ? new Date(a.created_at).toISOString() : '',
        }));
        return csvResponse(toCSV(columns, data), `audit_trail_${ts}.csv`);
      }
      case 'stats': {
        const stats = getDBStats();
        const health = getSystemHealth();
        return NextResponse.json({
          ...stats,
          dbSizeMB: (stats.dbSizeBytes / (1024 * 1024)).toFixed(2),
          db_wal_size_bytes: health.db_wal_size_bytes,
          db_connection_status: health.db_connection_status,
          active_today: health.active_today,
          active_this_week: health.active_this_week,
          completions_today: health.completions_today,
          completions_this_week: health.completions_this_week,
          exportedAt: ts,
        });
      }
      case 'health': {
        const health = getSystemHealth();
        const stats = getDBStats();
        return NextResponse.json({
          ...health,
          dbStats: stats,
          exportedAt: ts,
        });
      }
      default:
        return NextResponse.json({ error: 'Invalid section' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Export failed', details: String(error) }, { status: 500 });
  }
}
