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
    'action.bookmarksAll': 'Все задания',
    'action.bookmarksOnly': 'Избранные',
    'action.removeFromBookmark': 'Удалить из избранного',
    'action.addToBookmark': 'Добавить в избранное',
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
    'welcome.progressLabel': 'Общий прогресс',
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
    'export.error.invalidFormat': 'Неверный формат данных',
    'export.error.incompatibleVersion': 'Несовместимая версия файла',

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

    // Actions bar (additional)
    'action.queryHistory': 'История запросов',
    'action.history': 'История',
    'action.sqlTemplates': 'Шаблоны SQL',
    'action.chart': 'График',
    'history.empty': 'Нет выполненных запросов',

    // Task panel
    'task.completed': 'Задание выполнено верно! 🎉',
    'task.completedBadge': 'Выполнено',
    'task.congrats': 'Поздравляем! 🎉',
    'task.congratsDesc': 'Вы выполнили все задания! Вы настоящий SQL-мастер.',
    'task.taskLabel': 'Задание',
    'task.solutionTitle': 'Пример решения',
    'task.solutionShow': 'Показать',
    'task.solutionHide': 'Скрыть',
    'task.solutionUse': 'Вставить в редактор',
    'task.attempts': 'попытку',
    'task.attemptsFew': 'попытки',
    'task.attemptsMany': 'попыток',
    'task.next.label': 'Следующее: {title}',
    'task.next.level': 'Следующий уровень: {title}',
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
    'results.sorting': 'Сортировка',
    'results.copyAll': 'Копировать результат',
    'results.exportCSV': 'Экспорт CSV',
    'results.copied': 'Результат скопирован в буфер обмена',
    'results.downloaded': 'CSV файл скачан',

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

    // PWA
    'pwa.install.title': 'Установить SQL Trainer',
    'pwa.install.description': 'Установите приложение на устройство для быстрого доступа и офлайн-работы',
    'pwa.install.button': 'Установить',

    // Achievements
    'achievement.toast.title': '🏆 Новое достижение!',
    'achievement.toast.description': 'Вы получили бейд "{title}"',

    // Saved Queries
    'savedQueries.title': 'Сохранённые',
    'savedQueries.dropdownTitle': 'Сохранённые запросы',
    'savedQueries.empty': 'Нет сохранённых запросов',
    'savedQueries.saveCurrent': 'Сохранить текущий запрос',
    'savedQueries.saveTitle': 'Сохранить запрос',
    'savedQueries.nameLabel': 'Название',
    'savedQueries.namePlaceholder': 'Например: Сотрудники с высокой зарплатой',
    'savedQueries.sqlLabel': 'SQL',
    'savedQueries.saveButton': 'Сохранить',
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
    'action.bookmarksAll': 'All Tasks',
    'action.bookmarksOnly': 'Bookmarked',
    'action.removeFromBookmark': 'Remove from bookmarks',
    'action.addToBookmark': 'Add to bookmarks',
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
    'welcome.progressLabel': 'Overall Progress',
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
    'export.error.invalidFormat': 'Invalid data format',
    'export.error.incompatibleVersion': 'Incompatible file version',

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

    // Actions bar (additional)
    'action.queryHistory': 'Query History',
    'action.history': 'History',
    'action.sqlTemplates': 'SQL Templates',
    'action.chart': 'Chart',
    'history.empty': 'No executed queries',

    // Task panel
    'task.completed': 'Task completed successfully! 🎉',
    'task.completedBadge': 'Completed',
    'task.congrats': 'Congratulations! 🎉',
    'task.congratsDesc': 'You completed all tasks! You are a true SQL master.',
    'task.taskLabel': 'Task',
    'task.solutionTitle': 'Example Solution',
    'task.solutionShow': 'Show',
    'task.solutionHide': 'Hide',
    'task.solutionUse': 'Insert into Editor',
    'task.attempts': 'attempt',
    'task.attemptsFew': 'attempts',
    'task.attemptsMany': 'attempts',
    'task.next.label': 'Next: {title}',
    'task.next.level': 'Next level: {title}',
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
    'results.sorting': 'Sorting',
    'results.copyAll': 'Copy results',
    'results.exportCSV': 'Export CSV',
    'results.copied': 'Results copied to clipboard',
    'results.downloaded': 'CSV file downloaded',

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

    // PWA
    'pwa.install.title': 'Install SQL Trainer',
    'pwa.install.description': 'Install the app on your device for quick access and offline work',
    'pwa.install.button': 'Install',

    // Achievements
    'achievement.toast.title': '🏆 New Achievement!',
    'achievement.toast.description': 'You earned the "{title}" badge',

    // Saved Queries
    'savedQueries.title': 'Saved',
    'savedQueries.dropdownTitle': 'Saved Queries',
    'savedQueries.empty': 'No saved queries',
    'savedQueries.saveCurrent': 'Save current query',
    'savedQueries.saveTitle': 'Save Query',
    'savedQueries.nameLabel': 'Name',
    'savedQueries.namePlaceholder': 'e.g. Employees with high salary',
    'savedQueries.sqlLabel': 'SQL',
    'savedQueries.saveButton': 'Save',
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
