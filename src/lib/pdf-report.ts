/**
 * PDF Report Generation Utilities
 * Uses window.print() with styled HTML for PDF generation
 */

export interface PDFReportOptions {
  title: string;
  subtitle?: string;
  generatedAt?: Date;
  locale?: 'ru' | 'en';
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
  const localeCode = locale === 'ru' ? 'ru-RU' : 'en-US';

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
      <h1>${options.title}</h1>
      ${options.subtitle ? `<h2>${options.subtitle}</h2>` : ''}
      
      <div class="info">
        <div class="info-row"><span class="label">${tr.name}:</span><span class="value">${student.name}</span></div>
        <div class="info-row"><span class="label">${tr.email}:</span><span class="value">${student.email}</span></div>
        <div class="info-row"><span class="label">${tr.lastActive}:</span><span class="value">${student.last_active ? new Date(student.last_active).toLocaleDateString(localeCode) : tr.noActivity}</span></div>
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
        <div class="info-row"><span class="label">${tr.intermediate}:</span><span class="value">${student.intermediate_completed}/15</span></div>
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
    top_performers: Array<{ name: string; tasks_completed: number; avg_attempts: number }>;
    struggling_students: Array<{ name: string; tasks_completed: number; avg_attempts: number }>;
    inactive_students: Array<{ name: string; last_active: number }>;
  },
  options: PDFReportOptions
): void {
  const locale = options.locale || 'ru';
  const tr = pdfTranslations[locale];
  const localeCode = locale === 'ru' ? 'ru-RU' : 'en-US';

  const topPerformersRows = report.top_performers.map(s => 
    `<tr><td>${s.name}</td><td>${s.tasks_completed}</td><td>${s.avg_attempts}</td></tr>`
  ).join('');

  const strugglingRows = report.struggling_students.map(s => 
    `<tr><td>${s.name}</td><td>${s.tasks_completed}</td><td>${s.avg_attempts}</td></tr>`
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
      <h1>${options.title}</h1>
      ${options.subtitle ? `<p>${options.subtitle}</p>` : ''}
      
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

function openPrintWindow(content: string): void {
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }
}
