/**
 * Lightweight i18n system for SQL Trainer.
 * Supports Russian (default) and English translations.
 */

export type Locale = 'ru' | 'en';

export const translations: Record<Locale, Record<string, string>> = {
  ru: {
    // Header
    'app.title': 'SQL Тренажёр',
    'app.subtitle': 'Интерактивная платформа для изучения SQL',

    // Progress
    'progress.label': 'Прогресс',
    'progress.complete': 'Все задания выполнены!',
    'progress.percent': '% завершено',

    // Difficulties
    'difficulty.beginner': 'Начальный',
    'difficulty.intermediate': 'Средний',
    'difficulty.advanced': 'Продвинутый',

    // Actions
    'action.start': 'Начать обучение',
    'action.freeMode': 'Свободный режим',
    'action.practice': 'Режим практики',
    'action.execute': 'Выполнить',
    'action.clear': 'Очистить',
    'action.resetDb': 'Сбросить БД',
    'action.export': 'Экспорт / Импорт',
    'action.profile': 'Профиль',

    // Results
    'results.row': 'строка',
    'results.rows': 'строки',
    'results.rowsMany': 'строк',
    'results.column': 'столбец',
    'results.columns': 'столбца',
    'results.columnsMany': 'столбцов',
    'results.noData': 'Нет данных',
    'results.executeHint': 'Нажмите «Выполнить» или Ctrl+Enter для запуска',
    'results.title': 'Результаты запроса',
    'results.visualization': 'Визуализация',

    // Task panel
    'task.hint': 'Подсказка',
    'task.solution': 'Решение',
    'task.next': 'Следующее',
    'task.related': 'Похожие задания',

    // Welcome panel
    'welcome.recommend': 'Рекомендуем далее',
    'welcome.recent': 'Последние выполненные',
    'welcome.tips': 'Советы по использованию',
    'welcome.streak.day': 'день',
    'welcome.streak.days': 'дня',
    'welcome.streak.daysMany': 'дней',
    'welcome.streak.label': 'серия',
    'welcome.streak.record': 'Рекорд',
    'welcome.streak.total': 'Всего',

    // Practice mode
    'practice.title': 'Режим практики',
    'practice.select': 'Выберите уровень сложности для случайного порядка заданий',
    'practice.all': 'Все задания',
    'practice.next': 'Следующее',
    'practice.finish': 'Завершить',

    // Export/Import
    'export.title': 'Экспорт / Импорт прогресса',
    'export.description': 'Сохраните или восстановите ваш прогресс обучения',
    'export.exportTitle': 'Экспорт прогресса',
    'export.exportDesc': 'Скачайте файл с вашими выполненными заданиями, избранным и серией',
    'export.exportButton': 'Скачать прогресс',
    'export.importTitle': 'Импорт прогресса',
    'export.importDesc': 'Загрузите ранее экспортированный файл прогресса',
    'export.drop': 'Перетащите файл сюда или',
    'export.select': 'выберите',
    'export.success': 'Прогресс успешно загружен!',
    'export.warning': 'Внимание: Импорт заменит ваш текущий прогресс данными из файла',

    // Chart
    'chart.noData': 'Нет числовых данных для визуализации',
    'chart.hint': 'Для построения графика нужен хотя бы один числовой столбец',
    'chart.bar': 'Столбцы',
    'chart.horizontal': 'Горизонт.',

    // Shortcuts
    'shortcuts.title': 'Горячие клавиши',
    'shortcuts.execution': 'Выполнение',
    'shortcuts.editor': 'Редактор',
    'shortcuts.navigation': 'Навигация',
  },
  en: {
    // Header
    'app.title': 'SQL Trainer',
    'app.subtitle': 'Interactive platform for learning SQL',

    // Progress
    'progress.label': 'Progress',
    'progress.complete': 'All tasks completed!',
    'progress.percent': '% completed',

    // Difficulties
    'difficulty.beginner': 'Beginner',
    'difficulty.intermediate': 'Intermediate',
    'difficulty.advanced': 'Advanced',

    // Actions
    'action.start': 'Start Training',
    'action.freeMode': 'Free Mode',
    'action.practice': 'Practice Mode',
    'action.execute': 'Execute',
    'action.clear': 'Clear',
    'action.resetDb': 'Reset DB',
    'action.export': 'Export / Import',
    'action.profile': 'Profile',

    // Results
    'results.row': 'row',
    'results.rows': 'rows',
    'results.rowsMany': 'rows',
    'results.column': 'column',
    'results.columns': 'columns',
    'results.columnsMany': 'columns',
    'results.noData': 'No data',
    'results.executeHint': 'Press "Execute" or Ctrl+Enter to run',
    'results.title': 'Query Results',
    'results.visualization': 'Visualization',

    // Task panel
    'task.hint': 'Hint',
    'task.solution': 'Solution',
    'task.next': 'Next',
    'task.related': 'Related Tasks',

    // Welcome panel
    'welcome.recommend': 'Recommended Next',
    'welcome.recent': 'Recently Completed',
    'welcome.tips': 'Tips',
    'welcome.streak.day': 'day',
    'welcome.streak.days': 'days',
    'welcome.streak.daysMany': 'days',
    'welcome.streak.label': 'streak',
    'welcome.streak.record': 'Record',
    'welcome.streak.total': 'Total',

    // Practice mode
    'practice.title': 'Practice Mode',
    'practice.select': 'Select difficulty level for random task order',
    'practice.all': 'All Tasks',
    'practice.next': 'Next',
    'practice.finish': 'Finish',

    // Export/Import
    'export.title': 'Export / Import Progress',
    'export.description': 'Save or restore your learning progress',
    'export.exportTitle': 'Export Progress',
    'export.exportDesc': 'Download a file with your completed tasks, bookmarks and streak',
    'export.exportButton': 'Download Progress',
    'export.importTitle': 'Import Progress',
    'export.importDesc': 'Upload a previously exported progress file',
    'export.drop': 'Drop file here or',
    'export.select': 'select',
    'export.success': 'Progress loaded successfully!',
    'export.warning': 'Warning: Import will replace your current progress with data from the file',

    // Chart
    'chart.noData': 'No numeric data for visualization',
    'chart.hint': 'At least one numeric column is needed for chart',
    'chart.bar': 'Bars',
    'chart.horizontal': 'Horizontal',

    // Shortcuts
    'shortcuts.title': 'Keyboard Shortcuts',
    'shortcuts.execution': 'Execution',
    'shortcuts.editor': 'Editor',
    'shortcuts.navigation': 'Navigation',
  },
};

// Current locale (can be persisted in localStorage)
let currentLocale: Locale = 'ru';

export function setLocale(locale: Locale) {
  currentLocale = locale;
  if (typeof window !== 'undefined') {
    localStorage.setItem('sql-trainer-locale', locale);
  }
}

export function getLocale(): Locale {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('sql-trainer-locale') as Locale;
    if (stored && (stored === 'ru' || stored === 'en')) {
      currentLocale = stored;
    }
  }
  return currentLocale;
}

export function t(key: string): string {
  return translations[currentLocale]?.[key] || translations.ru[key] || key;
}

export function getPlural(key: string, count: number): string {
  // For now, just return the key and let the caller handle pluralization
  return t(key);
}
