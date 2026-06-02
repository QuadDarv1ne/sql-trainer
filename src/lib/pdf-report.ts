/**
 * PDF Report Generation Utilities
 * Uses window.print() with styled HTML for PDF generation
 */
import { escapeHtml } from './html-utils';
import { toast } from 'sonner';
import type { Locale } from '@/lib/i18n';

export interface PDFReportOptions {
  title: string;
  subtitle?: string;
  generatedAt?: Date;
  locale?: Locale;
}

const pdfTranslations = {
  ru: {
    name: 'Имя',
    email: 'Email',
    lastActive: 'Последняя активность',
    noActivity: 'Нет активности',
    performanceStats: 'Статистика успеваемости',
    tasksCompleted: 'Заданий выполнено',
    avgAttempts: 'Среднее попыток',
    achievements: 'Достижений',
    levelProgress: 'Прогресс по уровням',
    beginner: 'Начальный',
    intermediate: 'Средний',
    advanced: 'Продвинутый',
    generated: 'Сгенерировано',
    topPerformers: 'Лучшие студенты',
    struggling: 'Испытывают трудности',
    totalStudents: 'Всего студентов',
    active: 'Активные',
    avgCompletion: 'Среднее завершение',
    nameCol: 'Имя',
    tasksCol: 'Заданий',
    avgAttemptsCol: 'Ср. попыток',
  },
  en: {
    name: 'Name',
    email: 'Email',
    lastActive: 'Last Active',
    noActivity: 'No Activity',
    performanceStats: 'Performance Statistics',
    tasksCompleted: 'Tasks Completed',
    avgAttempts: 'Avg Attempts',
    achievements: 'Achievements',
    levelProgress: 'Level Progress',
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
    generated: 'Generated',
    topPerformers: 'Top Performers',
    struggling: 'Struggling',
    totalStudents: 'Total Students',
    active: 'Active',
    avgCompletion: 'Avg Completion',
    nameCol: 'Name',
    tasksCol: 'Tasks',
    avgAttemptsCol: 'Avg Attempts',
  },
  zh: {
    name: '姓名',
    email: '邮箱',
    lastActive: '最后活跃',
    noActivity: '无活跃记录',
    performanceStats: '表现统计',
    tasksCompleted: '已完成任务',
    avgAttempts: '平均尝试次数',
    achievements: '成就',
    levelProgress: '等级进度',
    beginner: '初级',
    intermediate: '中级',
    advanced: '高级',
    generated: '生成于',
    topPerformers: '优秀表现者',
    struggling: '挣扎中',
    totalStudents: '学生总数',
    active: '活跃',
    avgCompletion: '平均完成率',
    nameCol: '姓名',
    tasksCol: '任务',
    avgAttemptsCol: '平均尝试',
  },
};

export function generateStudentReportPDF(
  student: {
    name: string;
    email: string;
    tasks_completed: number;
    avg_attempts: number;
    beginner_completed: number;
    intermediate_completed: number;
    advanced_completed: number;
    achievements_count: number;
    last_active: number | null;
  },
  options: PDFReportOptions
): void {
  const locale = options.locale || 'ru';
  const tr = pdfTranslations[locale];
  const localeCode = locale === 'ru' ? 'ru-RU' : locale === 'zh' ? 'zh-CN' : 'en-US';

  const content = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; }
        h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
        h2 { color: #1e40af; margin-top: 30px; }
        .info { margin: 20px 0; }
        .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
        .label { font-weight: bold; color: #6b7280; }
        .value { color: #111827; }
        .stat-box { display: inline-block; width: 30%; margin: 1%; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; text-align: center; }
        .stat-number { font-size: 32px; font-weight: bold; color: #2563eb; }
        .stat-label { font-size: 12px; color: #6b7280; margin-top: 5px; }
        .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; text-align: center; }
      </style>
    </head>
    <body>
      <h1>${escapeHtml(options.title)}</h1>
      ${options.subtitle ? `<h2>${escapeHtml(options.subtitle)}</h2>` : ''}
      
      <div class="info">
        <div class="info-row"><span class="label">${tr.name}:</span><span class="value">${escapeHtml(student.name)}</span></div>
        <div class="info-row"><span class="label">${tr.email}:</span><span class="value">${escapeHtml(student.email)}</span></div>
        <div class="info-row"><span class="label">${tr.lastActive}:</span><span class="value">${escapeHtml(student.last_active ? new Date(student.last_active).toLocaleDateString(localeCode) : tr.noActivity)}</span></div>
      </div>

      <h2>${tr.performanceStats}</h2>
      <div>
        <div class="stat-box"><div class="stat-number">${student.tasks_completed}</div><div class="stat-label">${tr.tasksCompleted}</div></div>
        <div class="stat-box"><div class="stat-number">${student.avg_attempts}</div><div class="stat-label">${tr.avgAttempts}</div></div>
        <div class="stat-box"><div class="stat-number">${student.achievements_count}</div><div class="stat-label">${tr.achievements}</div></div>
      </div>

      <h2>${tr.levelProgress}</h2>
      <div>
        <div class="info-row"><span class="label">${tr.beginner}:</span><span class="value">${student.beginner_completed}/8</span></div>
        <div class="info-row"><span class="label">${tr.intermediate}:</span><span class="value">${student.intermediate_completed}/23</span></div>
        <div class="info-row"><span class="label">${tr.advanced}:</span><span class="value">${student.advanced_completed}/25</span></div>
      </div>

      <div class="footer">
        ${tr.generated}: ${options.generatedAt ? options.generatedAt.toLocaleString(localeCode) : new Date().toLocaleString(localeCode)}
      </div>
    </body>
    </html>
  `;

  openPrintWindow(content);
}

export function generateClassReportPDF(
  report: {
    total_students: number;
    active_students: number;
    avg_completion_rate: number;
    avg_attempts: number;
    at_risk_count: number;
    excelling_count: number;
    top_performers: Array<{ user_id: string; name: string; tasks_completed: number; avg_attempts: number }>;
    struggling_students: Array<{ user_id: string; name: string; tasks_completed: number; avg_attempts: number }>;
    inactive_students: Array<{ user_id: string; name: string; last_active: number }>;
  },
  options: PDFReportOptions
): void {
  const locale = options.locale || 'ru';
  const tr = pdfTranslations[locale];
  const localeCode = locale === 'ru' ? 'ru-RU' : locale === 'zh' ? 'zh-CN' : 'en-US';

  const topPerformersRows = report.top_performers.map(s => 
    `<tr><td>${escapeHtml(s.name)}</td><td>${s.tasks_completed}</td><td>${s.avg_attempts}</td></tr>`
  ).join('');

  const strugglingRows = report.struggling_students.map(s => 
    `<tr><td>${escapeHtml(s.name)}</td><td>${s.tasks_completed}</td><td>${s.avg_attempts}</td></tr>`
  ).join('');

  const content = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; }
        h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
        h2 { color: #1e40af; margin-top: 30px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #2563eb; color: white; padding: 10px; text-align: left; }
        td { padding: 8px 10px; border-bottom: 1px solid #e5e7eb; }
        .stat-box { display: inline-block; width: 30%; margin: 1%; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; text-align: center; }
        .stat-number { font-size: 32px; font-weight: bold; color: #2563eb; }
        .stat-label { font-size: 12px; color: #6b7280; margin-top: 5px; }
        .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; text-align: center; }
      </style>
    </head>
    <body>
      <h1>${escapeHtml(options.title)}</h1>
      ${options.subtitle ? `<p>${escapeHtml(options.subtitle)}</p>` : ''}
      
      <div>
        <div class="stat-box"><div class="stat-number">${report.total_students}</div><div class="stat-label">${tr.totalStudents}</div></div>
        <div class="stat-box"><div class="stat-number">${report.active_students}</div><div class="stat-label">${tr.active}</div></div>
        <div class="stat-box"><div class="stat-number">${report.avg_completion_rate}%</div><div class="stat-label">${tr.avgCompletion}</div></div>
      </div>

      <h2>${tr.topPerformers}</h2>
      <table><tr><th>${tr.nameCol}</th><th>${tr.tasksCol}</th><th>${tr.avgAttemptsCol}</th></tr>${topPerformersRows}</table>

      <h2>${tr.struggling}</h2>
      <table><tr><th>${tr.nameCol}</th><th>${tr.tasksCol}</th><th>${tr.avgAttemptsCol}</th></tr>${strugglingRows}</table>

      <div class="footer">
        ${tr.generated}: ${options.generatedAt ? options.generatedAt.toLocaleString(localeCode) : new Date().toLocaleString(localeCode)}
      </div>
    </body>
    </html>
  `;

  openPrintWindow(content);
}

export type AnalyticsSection =
  | 'overview'
  | 'deadlineCompliance'
  | 'notifications'
  | 'streaks'
  | 'onboarding'
  | 'reEngagement'
  | 'difficultyCalibration'
  | 'registrations'
  | 'activitySummary'
  | 'hintUsage'
  | 'audit'
  | 'weekdayComparison'
  | 'learningPlan'
  | 'abTest';

export interface AnalyticsPDFData {
  overview?: {
    total_students: number;
    active_students: number;
    avg_completion_rate: number;
    avg_attempts: number;
  };
  deadlineCompliance?: {
    overall_compliance_rate: number;
    total_deadlines: number;
    avg_days_late: number;
    deadlines: Array<{ title: string; due_date: string; targeted: number; on_time: number; late: number; missed: number; compliance_rate: number }>;
  };
  notifications?: {
    total_sent: number;
    overall_success_rate: number;
    pending_queue: number;
    channels: Array<{ channel: string; sent: number; delivered: number; failed: number; success_rate: number }>;
  };
  streaks?: {
    avg_streak: number;
    longest_streak: number;
    top_streaks: Array<{ name: string; streak: number }>;
    distribution: Array<{ bucket: string; count: number }>;
  };
  onboarding?: {
    avg_time_to_first_completion: number;
    drop_off_rate: number;
    stages: Array<{ stage: string; users: number; drop_off_rate: number; avg_hours: number }>;
  };
  reEngagement?: {
    total_re_engaged: number;
    avg_gap_days: number;
    re_engagement_rate: number;
    recent: Array<{ name: string; gap_days: number; return_task: string }>;
  };
  difficultyCalibration?: {
    misclassified_count: number;
    misclassified_pct: number;
    tasks: Array<{ title: string; intended: string; actual_attempts: number; recommended: string }>;
  };
  registrations?: {
    new_this_week: number;
    new_this_month: number;
    growth_rate: number;
    daily: Array<{ date: string; count: number }>;
  };
  activitySummary?: {
    dau: number;
    wau: number;
    mau: number;
    dau_wau_ratio: number;
    wau_mau_ratio: number;
  };
  hintUsage?: {
    total_hints_used: number;
    avg_hints_per_task: number;
    hint_completion_correlation: number;
    top_hint_users: Array<{ name: string; hints_used: number; completion_rate: number }>;
  };
  audit?: {
    total_actions: number;
    recent: Array<{ action: string; user: string; target: string; timestamp: string }>;
  };
  weekdayComparison?: {
    weekday_avg_attempts: number;
    weekend_avg_attempts: number;
    weekday_completion_rate: number;
    weekend_completion_rate: number;
    weekday_active_users: number;
    weekend_active_users: number;
  };
  learningPlan?: {
    student_name: string;
    current_level: string;
    completed_tasks: number;
    remaining_tasks: number;
    next_tasks: Array<{ task: string; difficulty: string; estimated_hours: number }>;
    milestones: Array<{ milestone: string; target_date: string }>;
  };
  abTest?: {
    test_name: string;
    group_a_name: string;
    group_b_name: string;
    metrics: Array<{ metric: string; group_a: number; group_b: number; significant: boolean }>;
  };
}

export function generateAnalyticsPDF(
  data: AnalyticsPDFData,
  sections: AnalyticsSection[],
  options: PDFReportOptions
): void {
  const locale = options.locale || 'ru';
  const tr = { ...pdfTranslations[locale], ...pdfAnalyticsTranslations[locale] };
  const localeCode = locale === 'ru' ? 'ru-RU' : locale === 'zh' ? 'zh-CN' : 'en-US';

  let sectionsHTML = '';

  // Overview Section
  if (sections.includes('overview') && data.overview) {
    const o = data.overview;
    sectionsHTML += `
      <div class="section">
        <h1>${tr.overview}</h1>
        <div>
          <div class="stat-box"><div class="stat-number">${o.total_students}</div><div class="stat-label">${tr.totalStudents}</div></div>
          <div class="stat-box"><div class="stat-number">${o.active_students}</div><div class="stat-label">${tr.active}</div></div>
          <div class="stat-box"><div class="stat-number">${o.avg_completion_rate}%</div><div class="stat-label">${tr.avgCompletion}</div></div>
          <div class="stat-box"><div class="stat-number">${o.avg_attempts}</div><div class="stat-label">${tr.avgAttempts}</div></div>
        </div>
      </div>
    `;
  }

  // Deadline Compliance Section
  if (sections.includes('deadlineCompliance') && data.deadlineCompliance) {
    const d = data.deadlineCompliance;
    const deadlineRows = d.deadlines.map(dl =>
      `<tr><td>${escapeHtml(dl.title)}</td><td>${dl.due_date}</td><td>${dl.targeted}</td><td>${dl.on_time}</td><td>${dl.late}</td><td>${dl.missed}</td><td>${dl.compliance_rate}%</td></tr>`
    ).join('');
    sectionsHTML += `
      <div class="section">
        <h1>${tr.deadlineCompliance}</h1>
        <div>
          <div class="stat-box"><div class="stat-number">${d.overall_compliance_rate}%</div><div class="stat-label">${tr.overallCompliance}</div></div>
          <div class="stat-box"><div class="stat-number">${d.total_deadlines}</div><div class="stat-label">${tr.totalDeadlines}</div></div>
          <div class="stat-box"><div class="stat-number">${d.avg_days_late}</div><div class="stat-label">${tr.avgDaysLate}</div></div>
        </div>
        <table><tr><th>${tr.taskTitle}</th><th>${tr.dueDate}</th><th>${tr.targeted}</th><th>${tr.onTime}</th><th>${tr.late}</th><th>${tr.missed}</th><th>${tr.complianceRate}</th></tr>${deadlineRows}</table>
      </div>
    `;
  }

  // Notifications Section
  if (sections.includes('notifications') && data.notifications) {
    const n = data.notifications;
    const channelRows = n.channels.map(c =>
      `<tr><td>${escapeHtml(c.channel)}</td><td>${c.sent}</td><td>${c.delivered}</td><td>${c.failed}</td><td>${c.success_rate}%</td></tr>`
    ).join('');
    sectionsHTML += `
      <div class="section">
        <h1>${tr.notifications}</h1>
        <div>
          <div class="stat-box"><div class="stat-number">${n.total_sent}</div><div class="stat-label">${tr.totalSent}</div></div>
          <div class="stat-box"><div class="stat-number">${n.overall_success_rate}%</div><div class="stat-label">${tr.successRate}</div></div>
          <div class="stat-box"><div class="stat-number">${n.pending_queue}</div><div class="stat-label">${tr.pendingQueue}</div></div>
        </div>
        <table><tr><th>${tr.channel}</th><th>${tr.sent}</th><th>${tr.delivered}</th><th>${tr.failed}</th><th>${tr.successRate}</th></tr>${channelRows}</table>
      </div>
    `;
  }

  // Streaks Section
  if (sections.includes('streaks') && data.streaks) {
    const s = data.streaks;
    const distRows = s.distribution.map(d =>
      `<tr><td>${escapeHtml(d.bucket)}</td><td>${d.count}</td></tr>`
    ).join('');
    const topRows = s.top_streaks.map((t, i) =>
      `<tr><td>${i + 1}</td><td>${escapeHtml(t.name)}</td><td>${t.streak}</td></tr>`
    ).join('');
    sectionsHTML += `
      <div class="section">
        <h1>${tr.streaks}</h1>
        <div>
          <div class="stat-box"><div class="stat-number">${s.avg_streak}</div><div class="stat-label">${tr.avgStreak}</div></div>
          <div class="stat-box"><div class="stat-number">${s.longest_streak}</div><div class="stat-label">${tr.longestStreak}</div></div>
        </div>
        <h2>${tr.streakDistribution}</h2>
        <table><tr><th>${tr.streakLength}</th><th>${tr.studentCount}</th></tr>${distRows}</table>
        <h2>${tr.topStreaks}</h2>
        <table><tr><th>#</th><th>${tr.name}</th><th>${tr.streakDays}</th></tr>${topRows}</table>
      </div>
    `;
  }

  // Onboarding Section
  if (sections.includes('onboarding') && data.onboarding) {
    const o = data.onboarding;
    const stageRows = o.stages.map(s =>
      `<tr><td>${escapeHtml(s.stage)}</td><td>${s.users}</td><td>${s.drop_off_rate}%</td><td>${s.avg_hours}h</td></tr>`
    ).join('');
    sectionsHTML += `
      <div class="section">
        <h1>${tr.onboarding}</h1>
        <div>
          <div class="stat-box"><div class="stat-number">${o.avg_time_to_first_completion}h</div><div class="stat-label">${tr.avgTimeFirstCompletion}</div></div>
          <div class="stat-box"><div class="stat-number">${o.drop_off_rate}%</div><div class="stat-label">${tr.dropOffRate}</div></div>
        </div>
        <table><tr><th>${tr.stage}</th><th>${tr.users}</th><th>${tr.dropOffRate}</th><th>${tr.avgHours}</th></tr>${stageRows}</table>
      </div>
    `;
  }

  // Re-engagement Section
  if (sections.includes('reEngagement') && data.reEngagement) {
    const r = data.reEngagement;
    const recentRows = r.recent.map(s =>
      `<tr><td>${escapeHtml(s.name)}</td><td>${s.gap_days} ${tr.days}</td><td>${escapeHtml(s.return_task)}</td></tr>`
    ).join('');
    sectionsHTML += `
      <div class="section">
        <h1>${tr.reEngagement}</h1>
        <div>
          <div class="stat-box"><div class="stat-number">${r.total_re_engaged}</div><div class="stat-label">${tr.totalReEngaged}</div></div>
          <div class="stat-box"><div class="stat-number">${r.avg_gap_days} ${tr.days}</div><div class="stat-label">${tr.avgGapDays}</div></div>
          <div class="stat-box"><div class="stat-number">${r.re_engagement_rate}%</div><div class="stat-label">${tr.reEngagementRate}</div></div>
        </div>
        <table><tr><th>${tr.name}</th><th>${tr.gapDuration}</th><th>${tr.returnTask}</th></tr>${recentRows}</table>
      </div>
    `;
  }

  // Difficulty Calibration Section
  if (sections.includes('difficultyCalibration') && data.difficultyCalibration) {
    const d = data.difficultyCalibration;
    const taskRows = d.tasks.map(t =>
      `<tr><td>${escapeHtml(t.title)}</td><td>${t.intended}</td><td>${t.actual_attempts}</td><td>${t.recommended}</td></tr>`
    ).join('');
    sectionsHTML += `
      <div class="section">
        <h1>${tr.difficultyCalibration}</h1>
        <div>
          <div class="stat-box"><div class="stat-number">${d.misclassified_count}</div><div class="stat-label">${tr.misclassifiedTasks}</div></div>
          <div class="stat-box"><div class="stat-number">${d.misclassified_pct}%</div><div class="stat-label">${tr.misclassifiedPct}</div></div>
        </div>
        <table><tr><th>${tr.taskTitle}</th><th>${tr.intendedDifficulty}</th><th>${tr.actualAttempts}</th><th>${tr.recommendedDifficulty}</th></tr>${taskRows}</table>
      </div>
    `;
  }

  // Registrations Section
  if (sections.includes('registrations') && data.registrations) {
    const r = data.registrations;
    const dailyRows = r.daily.slice(-14).map(d =>
      `<tr><td>${escapeHtml(d.date)}</td><td>${d.count}</td></tr>`
    ).join('');
    sectionsHTML += `
      <div class="section">
        <h1>${tr.registrations}</h1>
        <div>
          <div class="stat-box"><div class="stat-number">${r.new_this_week}</div><div class="stat-label">${tr.newThisWeek}</div></div>
          <div class="stat-box"><div class="stat-number">${r.new_this_month}</div><div class="stat-label">${tr.newThisMonth}</div></div>
          <div class="stat-box"><div class="stat-number">${r.growth_rate}%</div><div class="stat-label">${tr.growthRate}</div></div>
        </div>
        <h2>${tr.dailyRegistrations}</h2>
        <table><tr><th>${tr.date}</th><th>${tr.count}</th></tr>${dailyRows}</table>
      </div>
    `;
  }

  // Activity Summary Section
  if (sections.includes('activitySummary') && data.activitySummary) {
    const a = data.activitySummary;
    sectionsHTML += `
      <div class="section">
        <h1>${tr.activitySummary}</h1>
        <div>
          <div class="stat-box"><div class="stat-number">${a.dau}</div><div class="stat-label">${tr.dau}</div></div>
          <div class="stat-box"><div class="stat-number">${a.wau}</div><div class="stat-label">${tr.wau}</div></div>
          <div class="stat-box"><div class="stat-number">${a.mau}</div><div class="stat-label">${tr.mau}</div></div>
          <div class="stat-box"><div class="stat-number">${(a.dau_wau_ratio * 100).toFixed(1)}%</div><div class="stat-label">DAU/WAU</div></div>
          <div class="stat-box"><div class="stat-number">${(a.wau_mau_ratio * 100).toFixed(1)}%</div><div class="stat-label">WAU/MAU</div></div>
        </div>
      </div>
    `;
  }

  // Hint Usage Section
  if (sections.includes('hintUsage') && data.hintUsage) {
    const h = data.hintUsage;
    const userRows = h.top_hint_users.map(u =>
      `<tr><td>${escapeHtml(u.name)}</td><td>${u.hints_used}</td><td>${u.completion_rate}%</td></tr>`
    ).join('');
    sectionsHTML += `
      <div class="section">
        <h1>${tr.hintUsage}</h1>
        <div>
          <div class="stat-box"><div class="stat-number">${h.total_hints_used}</div><div class="stat-label">${tr.totalHintsUsed}</div></div>
          <div class="stat-box"><div class="stat-number">${h.avg_hints_per_task}</div><div class="stat-label">${tr.avgHintsPerTask}</div></div>
          <div class="stat-box"><div class="stat-number">${(h.hint_completion_correlation * 100).toFixed(1)}%</div><div class="stat-label">${tr.hintCompletionCorrelation}</div></div>
        </div>
        <table><tr><th>${tr.name}</th><th>${tr.hintsUsed}</th><th>${tr.completionRate}</th></tr>${userRows}</table>
      </div>
    `;
  }

  // Audit Section
  if (sections.includes('audit') && data.audit) {
    const a = data.audit;
    const logRows = a.recent.slice(0, 50).map(l =>
      `<tr><td>${escapeHtml(l.timestamp)}</td><td>${escapeHtml(l.action)}</td><td>${escapeHtml(l.user)}</td><td>${escapeHtml(l.target)}</td></tr>`
    ).join('');
    sectionsHTML += `
      <div class="section">
        <h1>${tr.auditLog}</h1>
        <div>
          <div class="stat-box"><div class="stat-number">${a.total_actions}</div><div class="stat-label">${tr.totalActions}</div></div>
        </div>
        <table><tr><th>${tr.timestamp}</th><th>${tr.action}</th><th>${tr.user}</th><th>${tr.target}</th></tr>${logRows}</table>
      </div>
    `;
  }

  // Weekday Comparison Section
  if (sections.includes('weekdayComparison') && data.weekdayComparison) {
    const w = data.weekdayComparison;
    sectionsHTML += `
      <div class="section">
        <h1>${tr.weekdayComparison}</h1>
        <div>
          <div class="stat-box"><div class="stat-number">${w.weekday_avg_attempts}</div><div class="stat-label">${tr.weekdayAvgAttempts}</div></div>
          <div class="stat-box"><div class="stat-number">${w.weekend_avg_attempts}</div><div class="stat-label">${tr.weekendAvgAttempts}</div></div>
          <div class="stat-box"><div class="stat-number">${w.weekday_completion_rate}%</div><div class="stat-label">${tr.weekdayCompletionRate}</div></div>
          <div class="stat-box"><div class="stat-number">${w.weekend_completion_rate}%</div><div class="stat-label">${tr.weekendCompletionRate}</div></div>
          <div class="stat-box"><div class="stat-number">${w.weekday_active_users}</div><div class="stat-label">${tr.weekdayActiveUsers}</div></div>
          <div class="stat-box"><div class="stat-number">${w.weekend_active_users}</div><div class="stat-label">${tr.weekendActiveUsers}</div></div>
        </div>
      </div>
    `;
  }

  // Learning Plan Section
  if (sections.includes('learningPlan') && data.learningPlan) {
    const lp = data.learningPlan;
    const taskRows = lp.next_tasks.map(t =>
      `<tr><td>${escapeHtml(t.task)}</td><td>${t.difficulty}</td><td>${t.estimated_hours}h</td></tr>`
    ).join('');
    const milestoneRows = lp.milestones.map(m =>
      `<tr><td>${escapeHtml(m.milestone)}</td><td>${m.target_date}</td></tr>`
    ).join('');
    sectionsHTML += `
      <div class="section">
        <h1>${tr.learningPlan}</h1>
        <div class="info">
          <div class="info-row"><span class="label">${tr.student}:</span><span class="value">${escapeHtml(lp.student_name)}</span></div>
          <div class="info-row"><span class="label">${tr.currentLevel}:</span><span class="value">${escapeHtml(lp.current_level)}</span></div>
          <div class="info-row"><span class="label">${tr.completedTasks}:</span><span class="value">${lp.completed_tasks}</span></div>
          <div class="info-row"><span class="label">${tr.remainingTasks}:</span><span class="value">${lp.remaining_tasks}</span></div>
        </div>
        <h2>${tr.nextTasks}</h2>
        <table><tr><th>${tr.task}</th><th>${tr.difficulty}</th><th>${tr.estimatedHours}</th></tr>${taskRows}</table>
        <h2>${tr.milestones}</h2>
        <table><tr><th>${tr.milestone}</th><th>${tr.targetDate}</th></tr>${milestoneRows}</table>
      </div>
    `;
  }

  // A/B Test Section
  if (sections.includes('abTest') && data.abTest) {
    const ab = data.abTest;
    const metricRows = ab.metrics.map(m =>
      `<tr><td>${escapeHtml(m.metric)}</td><td>${m.group_a}</td><td>${m.group_b}</td><td>${m.significant ? tr.significant : tr.notSignificant}</td></tr>`
    ).join('');
    sectionsHTML += `
      <div class="section">
        <h1>${tr.abTestComparison}</h1>
        <div class="info">
          <div class="info-row"><span class="label">${tr.testName}:</span><span class="value">${escapeHtml(ab.test_name)}</span></div>
          <div class="info-row"><span class="label">${tr.groupA}:</span><span class="value">${escapeHtml(ab.group_a_name)}</span></div>
          <div class="info-row"><span class="label">${tr.groupB}:</span><span class="value">${escapeHtml(ab.group_b_name)}</span></div>
        </div>
        <table><tr><th>${tr.metric}</th><th>${escapeHtml(ab.group_a_name)}</th><th>${escapeHtml(ab.group_b_name)}</th><th>${tr.significance}</th></tr>${metricRows}</table>
      </div>
    `;
  }

  const content = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; }
        h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; page-break-before: always; }
        h1:first-of-type { page-break-before: auto; }
        h2 { color: #1e40af; margin-top: 20px; }
        .section { margin-bottom: 30px; }
        .info { margin: 20px 0; }
        .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
        .label { font-weight: bold; color: #6b7280; }
        .value { color: #111827; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 12px; }
        th { background: #2563eb; color: white; padding: 8px 6px; text-align: left; }
        td { padding: 6px; border-bottom: 1px solid #e5e7eb; }
        tr:nth-child(even) { background: #f9fafb; }
        .stat-box { display: inline-block; width: 22%; margin: 1%; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; text-align: center; vertical-align: top; }
        .stat-number { font-size: 28px; font-weight: bold; color: #2563eb; }
        .stat-label { font-size: 11px; color: #6b7280; margin-top: 5px; }
        .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; text-align: center; }
        @media print {
          .section { page-break-inside: avoid; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
        }
      </style>
    </head>
    <body>
      <h1>${escapeHtml(options.title)}</h1>
      ${options.subtitle ? `<p style="color: #6b7280; font-size: 16px;">${escapeHtml(options.subtitle)}</p>` : ''}
      ${sectionsHTML}
      <div class="footer">
        ${tr.generated}: ${options.generatedAt ? options.generatedAt.toLocaleString(localeCode) : new Date().toLocaleString(localeCode)}
      </div>
    </body>
    </html>
  `;

  openPrintWindow(content);
}

const pdfAnalyticsTranslations = {
  ru: {
    overview: 'Обзор',
    deadlineCompliance: 'Соблюдение дедлайнов',
    notifications: 'Уведомления',
    streaks: 'Серии',
    onboarding: 'Адаптация',
    reEngagement: 'Повторная активность',
    difficultyCalibration: 'Калибровка сложности',
    registrations: 'Регистрации',
    activitySummary: 'Сводка активности',
    hintUsage: 'Использование подсказок',
    auditLog: 'Журнал действий',
    weekdayComparison: 'Будни vs Выходные',
    learningPlan: 'Учебный план',
    abTestComparison: 'A/B Сравнение',
    overallCompliance: 'Общее соблюдение',
    totalDeadlines: 'Всего дедлайнов',
    avgDaysLate: 'Ср. дней просрочки',
    taskTitle: 'Название',
    dueDate: 'Срок',
    targeted: 'Целевые',
    onTime: 'Вовремя',
    late: 'Поздно',
    missed: 'Пропущено',
    complianceRate: 'Соблюдение',
    totalSent: 'Всего отправлено',
    successRate: 'Успешность',
    pendingQueue: 'В очереди',
    channel: 'Канал',
    sent: 'Отправлено',
    delivered: 'Доставлено',
    failed: 'Ошибка',
    avgStreak: 'Средняя серия',
    longestStreak: 'Самая длинная',
    streakDistribution: 'Распределение серий',
    topStreaks: 'Лучшие серии',
    streakLength: 'Длина серии',
    studentCount: 'Студентов',
    streakDays: 'Дней',
    avgTimeFirstCompletion: 'Ср. время до завершения',
    dropOffRate: 'Отсев',
    stage: 'Этап',
    users: 'Студентов',
    avgHours: 'Ср. часов',
    totalReEngaged: 'Возвратилось',
    avgGapDays: 'Ср. перерыв',
    reEngagementRate: 'Возврат',
    days: 'дн.',
    gapDuration: 'Перерыв',
    returnTask: 'Возвратное задание',
    misclassifiedTasks: 'Неверная классификация',
    misclassifiedPct: '% неверных',
    intendedDifficulty: 'План. сложность',
    actualAttempts: 'Факт. попыток',
    recommendedDifficulty: 'Рек. сложность',
    newThisWeek: 'На этой неделе',
    newThisMonth: 'В этом месяце',
    growthRate: 'Рост',
    dailyRegistrations: 'Регистрации по дням',
    date: 'Дата',
    count: 'Кол-во',
    dau: 'ДАУ',
    wau: 'НЕДАУ',
    mau: 'МЕСАУ',
    totalHintsUsed: 'Всего подсказок',
    avgHintsPerTask: 'Ср. подсказок/задание',
    hintCompletionCorrelation: 'Корреляция подсказок',
    hintsUsed: 'Подсказок',
    completionRate: 'Завершение',
    totalActions: 'Всего действий',
    timestamp: 'Время',
    action: 'Действие',
    user: 'Пользователь',
    target: 'Объект',
    weekdayAvgAttempts: 'Будни (попытк)',
    weekendAvgAttempts: 'Выходные (попытк)',
    weekdayCompletionRate: 'Будни (заверш.)',
    weekendCompletionRate: 'Выходные (заверш.)',
    weekdayActiveUsers: 'Будни (активн.)',
    weekendActiveUsers: 'Выходные (активн.)',
    student: 'Студент',
    currentLevel: 'Текущий уровень',
    completedTasks: 'Завершено',
    remainingTasks: 'Осталось',
    nextTasks: 'Следующие задания',
    task: 'Задание',
    difficulty: 'Сложность',
    estimatedHours: 'Ср. часов',
    milestones: 'Вехи',
    milestone: 'Веха',
    targetDate: 'Целевая дата',
    testName: 'Тест',
    groupA: 'Группа А',
    groupB: 'Группа Б',
    metric: 'Метрика',
    significance: 'Значимость',
    significant: 'Значимо',
    notSignificant: 'Не значимо',
  },
  en: {
    overview: 'Overview',
    deadlineCompliance: 'Deadline Compliance',
    notifications: 'Notifications',
    streaks: 'Streaks',
    onboarding: 'Onboarding',
    reEngagement: 'Re-engagement',
    difficultyCalibration: 'Difficulty Calibration',
    registrations: 'Registrations',
    activitySummary: 'Activity Summary',
    hintUsage: 'Hint Usage',
    auditLog: 'Audit Log',
    weekdayComparison: 'Weekday vs Weekend',
    learningPlan: 'Learning Plan',
    abTestComparison: 'A/B Comparison',
    overallCompliance: 'Overall Compliance',
    totalDeadlines: 'Total Deadlines',
    avgDaysLate: 'Avg Days Late',
    taskTitle: 'Title',
    dueDate: 'Due Date',
    targeted: 'Targeted',
    onTime: 'On Time',
    late: 'Late',
    missed: 'Missed',
    complianceRate: 'Compliance',
    totalSent: 'Total Sent',
    successRate: 'Success Rate',
    pendingQueue: 'Pending',
    channel: 'Channel',
    sent: 'Sent',
    delivered: 'Delivered',
    failed: 'Failed',
    avgStreak: 'Avg Streak',
    longestStreak: 'Longest Streak',
    streakDistribution: 'Streak Distribution',
    topStreaks: 'Top Streaks',
    streakLength: 'Streak Length',
    studentCount: 'Students',
    streakDays: 'Days',
    avgTimeFirstCompletion: 'Avg Time to First Completion',
    dropOffRate: 'Drop-off Rate',
    stage: 'Stage',
    users: 'Students',
    avgHours: 'Avg Hours',
    totalReEngaged: 'Re-engaged',
    avgGapDays: 'Avg Gap Days',
    reEngagementRate: 'Re-engagement Rate',
    days: 'days',
    gapDuration: 'Gap Duration',
    returnTask: 'Return Task',
    misclassifiedTasks: 'Misclassified',
    misclassifiedPct: 'Misclassified %',
    intendedDifficulty: 'Intended Difficulty',
    actualAttempts: 'Actual Attempts',
    recommendedDifficulty: 'Recommended Difficulty',
    newThisWeek: 'This Week',
    newThisMonth: 'This Month',
    growthRate: 'Growth Rate',
    dailyRegistrations: 'Daily Registrations',
    date: 'Date',
    count: 'Count',
    dau: 'DAU',
    wau: 'WAU',
    mau: 'MAU',
    totalHintsUsed: 'Total Hints',
    avgHintsPerTask: 'Avg Hints/Task',
    hintCompletionCorrelation: 'Hint Correlation',
    hintsUsed: 'Hints',
    completionRate: 'Completion',
    totalActions: 'Total Actions',
    timestamp: 'Timestamp',
    action: 'Action',
    user: 'User',
    target: 'Target',
    weekdayAvgAttempts: 'Weekday (attempts)',
    weekendAvgAttempts: 'Weekend (attempts)',
    weekdayCompletionRate: 'Weekday (completion)',
    weekendCompletionRate: 'Weekend (completion)',
    weekdayActiveUsers: 'Weekday (active)',
    weekendActiveUsers: 'Weekend (active)',
    student: 'Student',
    currentLevel: 'Current Level',
    completedTasks: 'Completed',
    remainingTasks: 'Remaining',
    nextTasks: 'Next Tasks',
    task: 'Task',
    difficulty: 'Difficulty',
    estimatedHours: 'Est. Hours',
    milestones: 'Milestones',
    milestone: 'Milestone',
    targetDate: 'Target Date',
    testName: 'Test',
    groupA: 'Group A',
    groupB: 'Group B',
    metric: 'Metric',
    significance: 'Significance',
    significant: 'Significant',
    notSignificant: 'Not Significant',
  },
  zh: {
    overview: '概览',
    deadlineCompliance: '截止日期合规',
    notifications: '通知',
    streaks: '连续记录',
    onboarding: '入门',
    reEngagement: '重新参与',
    difficultyCalibration: '难度校准',
    registrations: '注册',
    activitySummary: '活动概览',
    hintUsage: '提示使用',
    auditLog: '审计日志',
    weekdayComparison: '工作日与周末',
    learningPlan: '学习计划',
    abTestComparison: 'A/B 对比',
    overallCompliance: '总体合规',
    totalDeadlines: '总截止日期',
    avgDaysLate: '平均逾期天数',
    taskTitle: '标题',
    dueDate: '截止日期',
    targeted: '定向',
    onTime: '按时',
    late: '迟到',
    missed: '错过',
    complianceRate: '合规率',
    totalSent: '总发送',
    successRate: '成功率',
    pendingQueue: '队列中',
    channel: '渠道',
    sent: '已发送',
    delivered: '已送达',
    failed: '失败',
    avgStreak: '平均连续',
    longestStreak: '最长连续',
    streakDistribution: '连续分布',
    topStreaks: '最佳连续',
    streakLength: '连续长度',
    studentCount: '学生数',
    streakDays: '天',
    avgTimeFirstCompletion: '首次完成平均时间',
    dropOffRate: '流失率',
    stage: '阶段',
    users: '学生',
    avgHours: '平均小时',
    totalReEngaged: '重新参与',
    avgGapDays: '平均间隔天数',
    reEngagementRate: '重新参与率',
    days: '天',
    gapDuration: '间隔时长',
    returnTask: '带回任务',
    misclassifiedTasks: '错分类',
    misclassifiedPct: '错分类 %',
    intendedDifficulty: '预期难度',
    actualAttempts: '实际尝试',
    recommendedDifficulty: '建议难度',
    newThisWeek: '本周',
    newThisMonth: '本月',
    growthRate: '增长率',
    dailyRegistrations: '每日注册',
    date: '日期',
    count: '数量',
    dau: '日活',
    wau: '周活',
    mau: '月活',
    totalHintsUsed: '总提示使用',
    avgHintsPerTask: '每任务平均提示',
    hintCompletionCorrelation: '提示关联',
    hintsUsed: '提示使用',
    completionRate: '完成率',
    totalActions: '总操作',
    timestamp: '时间戳',
    action: '操作',
    user: '用户',
    target: '目标',
    weekdayAvgAttempts: '工作日（尝试）',
    weekendAvgAttempts: '周末（尝试）',
    weekdayCompletionRate: '工作日（完成）',
    weekendCompletionRate: '周末（完成）',
    weekdayActiveUsers: '工作日（活跃）',
    weekendActiveUsers: '周末（活跃）',
    student: '学生',
    currentLevel: '当前等级',
    completedTasks: '已完成',
    remainingTasks: '剩余',
    nextTasks: '下一个任务',
    task: '任务',
    difficulty: '难度',
    estimatedHours: '预估小时',
    milestones: '里程碑',
    milestone: '里程碑',
    targetDate: '目标日期',
    testName: '测试',
    groupA: 'A 组',
    groupB: 'B 组',
    metric: '指标',
    significance: '显著性',
    significant: '显著',
    notSignificant: '不显著',
  },
};

function openPrintWindow(content: string): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    toast.error('Pop-up blocked. Please allow pop-ups for PDF export.');
    return;
  }
  printWindow.document.write(content);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    try {
      if (!printWindow.closed) {
        printWindow.print();
        printWindow.close();
      }
    } catch {
      // Window may have been closed by user
    }
  }, 250);
}
