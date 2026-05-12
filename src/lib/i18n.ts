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
    'action.executeShort': 'Выполнить',
    'action.clear': 'Очистить',
    'action.resetDb': 'Сбросить БД',
    'action.export': 'Экспорт / Импорт',
    'action.profile': 'Профиль',
    'action.close': 'Закрыть',
    'action.explain': 'EXPLAIN',
    'action.explainTooltip': 'Показать план выполнения запроса',

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

    // Header
    'header.tasks': 'Задания',
    'header.theme.light': 'Светлая тема',
    'header.theme.dark': 'Тёмная тема',

    // Editor
    'editor.placeholder.task': 'Напишите SQL запрос для: {title}...',
    'editor.placeholder.free': 'Напишите SQL запрос... (Ctrl+Enter для выполнения)',

    // Actions bar
    'action.executeShort': 'Выполнить',
    'action.explain': 'EXPLAIN',
    'action.explainTooltip': 'Показать план выполнения запроса',
    'action.queryHistory': 'История запросов',
    'action.sqlTemplates': 'Шаблоны SQL',
    'action.chart': 'График',

    // Task panel
    'task.completed': 'Задание выполнено верно! 🎉',
    'task.attempts': 'попытку',
    'task.attemptsFew': 'попытки',
    'task.attemptsMany': 'попыток',
    'task.next.label': 'Следующее: {title}',
    'task.next.level': 'Следующий уровень: {title}',
    'task.showHint': 'Показать подсказку',
    'task.showSolution': 'Показать решение',
    'task.useSolution': 'Использовать решение',

    // Results
    'results.error': 'Ошибка',
    'results.success': 'Запрос выполнен успешно',
    'results.verified': 'Результат проверен',
    'results.notVerified': 'Результат не проверен',
    'results.executionTime': 'Время выполнения',
    'results.ms': 'мс',
    'results.suggestion': 'Рекомендация',

    // Schema
    'schema.title': 'Схема базы данных',
    'schema.noSchema': 'Схема не загружена',
    'schema.selectTable': 'Выберите таблицу',

    // SQL Reference
    'sqlReference.title': 'Справка по SQL',
    'sqlReference.select': 'Выберите раздел',

    // Welcome
    'welcome.title': 'Добро пожаловать в SQL Тренажёр',
    'welcome.description': 'Интерактивная платформа для изучения и практики SQL',
    'welcome.startTraining': 'Начать обучение',
    'welcome.freeModeDesc': 'Пишите любые SQL-запросы без ограничений',
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
    'action.executeShort': 'Execute',
    'action.clear': 'Clear',
    'action.resetDb': 'Reset DB',
    'action.export': 'Export / Import',
    'action.profile': 'Profile',
    'action.close': 'Close',
    'action.explain': 'EXPLAIN',
    'action.explainTooltip': 'Show query execution plan',

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

    // Header
    'header.tasks': 'Tasks',
    'header.theme.light': 'Light theme',
    'header.theme.dark': 'Dark theme',

    // Editor
    'editor.placeholder.task': 'Write SQL query for: {title}...',
    'editor.placeholder.free': 'Write SQL query... (Ctrl+Enter to execute)',

    // Actions bar
    'action.executeShort': 'Execute',
    'action.explain': 'EXPLAIN',
    'action.explainTooltip': 'Show query execution plan',
    'action.queryHistory': 'Query History',
    'action.sqlTemplates': 'SQL Templates',
    'action.chart': 'Chart',

    // Task panel
    'task.completed': 'Task completed successfully! 🎉',
    'task.attempts': 'attempt',
    'task.attemptsFew': 'attempts',
    'task.attemptsMany': 'attempts',
    'task.next.label': 'Next: {title}',
    'task.next.level': 'Next level: {title}',
    'task.showHint': 'Show hint',
    'task.showSolution': 'Show solution',
    'task.useSolution': 'Use solution',

    // Results
    'results.error': 'Error',
    'results.success': 'Query executed successfully',
    'results.verified': 'Result verified',
    'results.notVerified': 'Result not verified',
    'results.executionTime': 'Execution time',
    'results.ms': 'ms',
    'results.suggestion': 'Suggestion',

    // Schema
    'schema.title': 'Database Schema',
    'schema.noSchema': 'Schema not loaded',
    'schema.selectTable': 'Select a table',

    // SQL Reference
    'sqlReference.title': 'SQL Reference',
    'sqlReference.select': 'Select a section',

    // Welcome
    'welcome.title': 'Welcome to SQL Trainer',
    'welcome.description': 'Interactive platform for learning and practicing SQL',
    'welcome.startTraining': 'Start Training',
    'welcome.freeModeDesc': 'Write any SQL queries without restrictions',
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

export function t(key: string, params?: Record<string, string>): string {
  let value = translations[currentLocale]?.[key] || translations.ru[key] || key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      value = value.replace(`{${k}}`, v);
    });
  }
  return value;
}

export function getPlural(key: string, count: number): string {
  // For now, just return the key and let the caller handle pluralization
  return t(key);
}
