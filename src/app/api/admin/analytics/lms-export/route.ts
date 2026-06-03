import { NextResponse } from 'next/server';
import { getAllUsers, getStudentProgressById, getAchievementStats } from '@/lib/db-users';
import { withAnalyticsAuth } from '@/lib/api-auth';

export const GET = withAnalyticsAuth(({ searchParams }) => {
  const format = searchParams.get('format') || 'csv';
  const includeProgress = searchParams.get('includeProgress') !== 'false';
  const includeAchievements = searchParams.get('includeAchievements') !== 'false';
  const includeAttempts = searchParams.get('includeAttempts') !== 'false';

  const users = getAllUsers();
  const students = users.filter((u) => u.role === 'student');

  if (format === 'json') {
    const jsonData = {
      exportDate: new Date().toISOString(),
      format: 'LMS JSON Export',
      students: students.map((student) => {
        const result: Record<string, unknown> = {
          id: student.id,
          name: student.name,
          email: student.email,
          role: student.role,
          createdAt: new Date(student.created_at).toISOString(),
        };
        if (includeProgress) {
          const progress = getStudentProgressById(student.id);
          result.tasksCompleted = student.tasks_completed;
          result.completionRate = progress?.completion_rate ?? 0;
          result.lastActive = student.last_active ? new Date(student.last_active).toISOString() : null;
        }
        if (includeAchievements) {
          const achievements = getAchievementStats();
          result.totalAchievements = achievements.length;
        }
        if (includeAttempts) {
          result.avgAttempts = student.avg_attempts ?? 0;
        }
        return result;
      }),
    };
    return new NextResponse(JSON.stringify(jsonData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename=lms-export.json',
      },
    });
  }

  if (format === 'xml') {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<imsx_POXEnvelopeResponse xmlns="http://www.imsglobal.org/services/ltiv1p1/xsd/imsoms_v1p0">\n`;
    xml += `  <imsx_POXHeader>\n`;
    xml += `    <imsx_POXResponseHeaderInfo>\n`;
    xml += `      <imsx_version>V1.0</imsx_version>\n`;
    xml += `      <imsx_messageIdentifier>${Date.now()}</imsx_messageIdentifier>\n`;
    xml += `    </imsx_POXResponseHeaderInfo>\n`;
    xml += `  </imsx_POXHeader>\n`;
    xml += `  <imsx_POXBody>\n`;
    xml += `    <replaceResultResponse>\n`;
    xml += `      <imsx_statusInfo>\n`;
    xml += `        <imsx_codeMajor>success</imsx_codeMajor>\n`;
    xml += `        <imsx_severity>status</imsx_severity>\n`;
    xml += `        <imsx_messageRefIdentifier></imsx_messageRefIdentifier>\n`;
    xml += `      </imsx_statusInfo>\n`;
    xml += `    </replaceResultResponse>\n`;
    xml += `  </imsx_POXBody>\n`;
    xml += `  <resultData>\n`;
    for (const student of students) {
      xml += `    <student>\n`;
      xml += `      <id>${escapeXml(student.id)}</id>\n`;
      xml += `      <name>${escapeXml(student.name)}</name>\n`;
      xml += `      <email>${escapeXml(student.email)}</email>\n`;
      if (includeProgress) {
        xml += `      <tasksCompleted>${student.tasks_completed}</tasksCompleted>\n`;
        xml += `      <avgAttempts>${student.avg_attempts ?? 0}</avgAttempts>\n`;
      }
      if (includeAchievements) {
        xml += `      <achievements>${student.achievements_count ?? 0}</achievements>\n`;
      }
      xml += `    </student>\n`;
    }
    xml += `  </resultData>\n`;
    xml += `</imsx_POXEnvelopeResponse>\n`;
    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Content-Disposition': 'attachment; filename=lms-export.xml',
      },
    });
  }

  let csv = '\uFEFF';
  csv += 'ID,Name,Email,Role,Tasks Completed,Avg Attempts,Achievements,Created At';
  if (includeProgress) csv += ',Completion Rate,Last Active';
  csv += '\n';
  for (const student of students) {
    csv += `${student.id},"${sanitizeCsvValue(student.name)}","${sanitizeCsvValue(student.email)}",${student.role},${student.tasks_completed},${student.avg_attempts ?? 0},${student.achievements_count ?? 0},${new Date(student.created_at).toISOString()}`;
    if (includeProgress) {
      const progress = getStudentProgressById(student.id);
      const rate = progress?.completion_rate ?? 0;
      const lastActive = student.last_active ? sanitizeCsvValue(new Date(student.last_active).toISOString()) : 'Never';
      csv += `,${rate},${lastActive}`;
    }
    csv += '\n';
  }
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename=lms-export.csv',
    },
  });
});

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function sanitizeCsvValue(value: string): string {
  // Prevent CSV formula injection: prefix values starting with =, +, -, @ with a single quote
  if (/^[=+\-@]/.test(value)) {
    return `'${value}`;
  }
  return value;
}
