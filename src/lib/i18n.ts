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
    'shortcuts.execute': 'Выполнить запрос',
    'shortcuts.indent': 'Отступ в редакторе',

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
    'welcome.tip': 'Используйте подсказки и справочник SQL для помощи',

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

    // ER Diagram
    'erDiagram.viewList': 'Список',
    'erDiagram.viewDiagram': 'Диаграмма',
    'erDiagram.zoomIn': 'Приблизить',
    'erDiagram.zoomOut': 'Отдалить',
    'erDiagram.reset': 'Сбросить вид',

    // Level
    'level.label': 'Ур.',
    'level.xpToNext': '{xp} XP до следующего уровня',

    // Reset progress
    'resetProgress.title': 'Сброс прогресса',
    'resetProgress.description': 'Это действие сбросит весь ваш прогресс, достижения и сохранённые запросы',
    'resetProgress.button': 'Сбросить прогресс',
    'resetProgress.confirmTitle': 'Вы уверены?',
    'resetProgress.confirmDescription': 'Все выполненные задания, достижения, серия практики, XP, уровни и сохранённые запросы будут удалены. Это действие нельзя отменить.',
    'resetProgress.success': 'Прогресс сброшен',

    // Admin
    'admin.title': 'Панель администратора',
    'admin.tabs.overview': 'Обзор',
    'admin.tabs.analytics': 'Аналитика',
    'admin.tabs.leaderboard': 'Рейтинг',
    'admin.stats.title': 'Статистика базы данных',
    'admin.stats.totalUsers': 'Всего пользователей',
    'admin.stats.students': 'Студенты',
    'admin.stats.teachers': 'Преподаватели',
    'admin.stats.admins': 'Администраторы',
    'admin.stats.completions': 'Выполнено заданий',
    'admin.stats.achievements': 'Получено достижений',
    'admin.stats.dbSize': 'Размер БД',
    'admin.stats.loading': 'Загрузка статистики...',
    'admin.stats.error': 'Не удалось загрузить статистику',
    'admin.users.title': 'Управление пользователями',
    'admin.users.name': 'Имя',
    'admin.users.email': 'Email',
    'admin.users.role': 'Роль',
    'admin.users.tasks': 'Задания',
    'admin.users.registered': 'Дата регистрации',
    'admin.users.actions': 'Действия',
    'admin.users.role.student': 'Студент',
    'admin.users.role.teacher': 'Преподаватель',
    'admin.users.role.admin': 'Администратор',
    'admin.users.loading': 'Загрузка...',
    'admin.users.error': 'Не удалось загрузить список пользователей',
    'admin.users.roleUpdated': 'Роль обновлена',
    'admin.users.roleUpdateError': 'Ошибка обновления роли',
    'admin.users.deleteConfirm': 'Удалить пользователя "{name}"? Все данные будут удалены.',
    'admin.users.deleted': 'Пользователь удалён',
    'admin.users.deleteError': 'Ошибка удаления пользователя',
    'admin.users.search': 'Поиск по имени или email...',
    'admin.users.prev': 'Назад',
    'admin.users.next': 'Вперёд',
    'admin.users.noResults': 'Нет результатов',

    // Teacher Dashboard
    'teacher.loading': 'Загрузка...',
    'teacher.error': 'Не удалось загрузить данные',
    'teacher.noData': 'Нет данных',
    'teacher.tabs.progress': 'Прогресс',
    'teacher.tabs.analytics': 'Аналитика',
    'teacher.tabs.engagement': 'Вовлечённость',
    'teacher.stats.totalStudents': 'Всего студентов',
    'teacher.stats.activeStudents': 'Активные (7 дн.)',
    'teacher.stats.totalCompletions': 'Выполнено заданий',
    'teacher.stats.avgCompletionRate': 'Среднее завершение',
    'teacher.stats.atRisk': 'В зоне риска',
    'teacher.stats.avgAttempts': 'Среднее попыток',
    'teacher.progress.title': 'Прогресс студентов',
    'teacher.progress.name': 'Имя',
    'teacher.progress.email': 'Email',
    'teacher.progress.completed': 'Выполнено',
    'teacher.progress.completionRate': 'Прогресс',
    'teacher.progress.avgAttempts': 'Ср. попытки',
    'teacher.progress.lastActive': 'Последняя активность',
    'teacher.progress.today': 'Сегодня',
    'teacher.progress.yesterday': 'Вчера',
    'teacher.progress.daysAgo': '{days} дн. назад',
    'teacher.progress.neverActive': 'Нет активности',
    'teacher.progress.search': 'Поиск по имени или email...',
    'teacher.progress.prev': 'Назад',
    'teacher.progress.next': 'Вперёд',
    'teacher.progress.noResults': 'Нет результатов',
    'teacher.engagement.title': 'Вовлечённость студентов',
    'teacher.engagement.level': 'Уровень',
    'teacher.engagement.score': 'Балл',
    'teacher.engagement.velocity': 'Скорость',
    'teacher.engagement.high': 'Высокий',
    'teacher.engagement.medium': 'Средний',
    'teacher.engagement.low': 'Низкий',
    'teacher.engagement.atRisk': 'В зоне риска',
    'teacher.engagement.highCount': 'Высокая вовлечённость',
    'teacher.engagement.avgScore': 'Средний балл',
    'teacher.engagement.atRiskCount': 'В зоне риска',
    'teacher.engagement.perWeek': 'зад/нед',
    'teacher.analytics.completionByLevel': 'Выполнение по уровням',
    'teacher.analytics.easiestTasks': 'Лёгкие задания',
    'teacher.analytics.hardestTasks': 'Сложные задания',
    'teacher.analytics.completions': 'выполнений',
    'teacher.analytics.failRate': 'трудностей',
    'teacher.export.title': 'Экспорт отчётов',
    'teacher.export.description': 'Выберите формат и данные для экспорта',
    'teacher.export.format': 'Формат',
    'teacher.export.button': 'Экспортировать',
    'teacher.export.exporting': 'Экспорт...',
    'teacher.export.classReport': 'Отчёт группы',
    'teacher.student.details': 'Подробнее',
    'teacher.student.detailTitle': 'Студент: {name}',
    'teacher.student.activityChart': 'Активность',
    'teacher.export.studentReport': 'Отчёт студента',
    'teacher.tabs.alerts': 'Оповещения',
    'teacher.tabs.cohorts': 'Когорты',
    'teacher.tabs.recommendations': 'Рекомендации',
    'teacher.cohort.title': 'Когортный анализ',
    'teacher.cohort.month': 'Месяц',
    'teacher.cohort.total': 'Всего',
    'teacher.cohort.month0': 'Месяц 0',
    'teacher.cohort.month1': 'Месяц 1',
    'teacher.cohort.month2': 'Месяц 2',
    'teacher.cohort.month3': 'Месяц 3',
    'teacher.recommendations.title': 'Рекомендации',
    'teacher.recommendations.target': 'Целевая группа',
    'teacher.alerts.title': 'Оповещения о студентах',
    'teacher.alerts.noAlerts': 'Нет оповещений — все студенты в норме',
    'teacher.alerts.atRisk': 'В зоне риска',
    'teacher.alerts.inactive': 'Неактивные',
    'teacher.alerts.struggling': 'Испытывают трудности',
    'teacher.alerts.excelling': 'Отличники',
    'teacher.alerts.high': 'Высокий',
    'teacher.alerts.medium': 'Средний',
    'teacher.alerts.low': 'Низкий',
    'teacher.tabs.churn': 'Отсев',

    // Analytics
    'analytics.loading': 'Загрузка аналитики...',
    'analytics.error': 'Не удалось загрузить данные',
    'analytics.noData': 'Нет данных',

    // Activity chart
    'analytics.activity.title': 'Активность за 30 дней',
    'analytics.activity.completions': 'Выполнения',
    'analytics.activity.uniqueUsers': 'Уникальные пользователи',

    // Performance metrics
    'analytics.metrics.activeUsers': 'Активные (7 дн.)',
    'analytics.metrics.avgAttempts': 'Среднее число попыток',
    'analytics.metrics.totalStudents': 'Всего студентов',
    'analytics.metrics.completionRate': 'Доля выполнивших',

    // Task analytics
    'analytics.tasks.title': 'Аналитика заданий',
    'analytics.tasks.byDifficulty': 'Сложность по попыткам',
    'analytics.tasks.hardest': 'Самые сложные задания',
    'analytics.tasks.taskName': 'Задание',
    'analytics.tasks.difficulty': 'Уровень',
    'analytics.tasks.completions': 'Выполнений',
    'analytics.tasks.avgAttempts': 'Ср. попытки',
    'analytics.tasks.firstAttemptRate': 'С 1-й попытки',

    // Completion distribution
    'analytics.distribution.title': 'Распределение студентов',
    'analytics.distribution.completions': 'Выполнено заданий',
    'analytics.distribution.students': 'Студентов',

    // Achievement analytics
    'analytics.achievements.title': 'Достижения',
    'analytics.achievements.earnRate': 'Получили',
    'analytics.achievements.recent': 'Последние получившие',
    'analytics.achievements.noRecent': 'Пока никто не получил',

    // Leaderboard
    'analytics.leaderboard.title': 'Рейтинг студентов',
    'analytics.leaderboard.rank': 'Место',
    'analytics.leaderboard.name': 'Имя',
    'analytics.leaderboard.completed': 'Выполнено',
    'analytics.leaderboard.achievements': 'Достижения',
    'analytics.leaderboard.completionRate': 'Прогресс',
    'analytics.leaderboard.avgAttempts': 'Ср. попытки',
    'analytics.leaderboard.search': 'Поиск по имени или email...',
    'analytics.leaderboard.prev': 'Назад',
    'analytics.leaderboard.next': 'Вперёд',
    'analytics.leaderboard.noResults': 'Нет результатов',

    // Student detail dialog
    'analytics.student.detailTitle': 'Подробности: {name}',
    'analytics.student.email': 'Email',
    'analytics.student.lastActive': 'Последняя активность',
    'analytics.student.neverActive': 'Нет активности',
    'analytics.student.totalAttempts': 'Всего попыток',
    'analytics.student.avgAttempts': 'Среднее число попыток',
    'analytics.student.byDifficulty': 'По уровням сложности',
    'analytics.student.achievements': 'Достижения',
    'analytics.student.noAchievements': 'Нет достижений',
    'analytics.student.beginner': 'Начальный',
    'analytics.student.intermediate': 'Средний',
    'analytics.student.advanced': 'Продвинутый',
    'analytics.student.completed': 'Выполнено',

    // Advanced analytics
    'analytics.progress.title': 'Динамика обучения',
    'analytics.progress.weekly': 'Еженедельная активность',
    'analytics.progress.students': 'Студенты',
    'analytics.progress.tasks': 'Задания',
    'analytics.progress.cumulative': 'Накопительно',
    'analytics.progress.attempts': 'Попытки',

    'analytics.timeToComplete.title': 'Время выполнения заданий',
    'analytics.timeToComplete.min': 'Минимум',
    'analytics.timeToComplete.avg': 'Среднее',
    'analytics.timeToComplete.max': 'Максимум',
    'analytics.timeToComplete.minutes': '{min} мин',
    'analytics.heatmap.title': 'Тепловая карта активности',
    'analytics.weekComparison.title': 'Сравнение с прошлой неделей',

    'analytics.errors.title': 'Ошибки',
    'analytics.engagement.title': 'Вовлечённость',
    'analytics.churn.title': 'Отсев',

    'analytics.cohort.title': 'Когортный анализ',
    'analytics.cohort.month': 'Месяц',
    'analytics.cohort.retention': 'Удержание',
    'analytics.cohort.total': 'Всего',
    'analytics.cohort.month0': 'Месяц 0',
    'analytics.cohort.month1': 'Месяц 1',
    'analytics.cohort.month2': 'Месяц 2',
    'analytics.cohort.month3': 'Месяц 3',

    'analytics.difficulty.title': 'Сравнение по уровням',
    'analytics.difficulty.attempted': 'Попыток',
    'analytics.difficulty.completion': 'Завершение',
    'analytics.difficulty.firstAttempt': 'С 1-й попытки',

    'analytics.students.title': 'Успеваемость студентов',
    'analytics.students.performance': 'Успеваемость',
    'analytics.students.trend': 'Тренд',
    'analytics.students.trend.improving': 'Улучшается',
    'analytics.students.trend.stable': 'Стабильно',
    'analytics.students.trend.declining': 'Снижается',
    'analytics.students.streak': 'Серия',
    'analytics.students.weakest': 'Слабый уровень',
    'analytics.students.viewDetails': 'Подробнее',

    // Date range filter
    'analytics.filter.dateRange': 'Период',
    'analytics.filter.last7': '7 дней',
    'analytics.filter.last14': '14 дней',
    'analytics.filter.last30': '30 дней',
    'analytics.filter.last90': '90 дней',
    'analytics.filter.custom': 'Свой период',
    'analytics.filter.startDate': 'Дата начала',
    'analytics.filter.endDate': 'Дата окончания',
    'analytics.filter.apply': 'Применить',
    'analytics.filter.reset': 'Сбросить',

    // Export
    'analytics.export.csv': 'Экспорт CSV',
    'analytics.export.excel': 'Экспорт Excel',
    'analytics.export.success': 'Отчёт экспортирован',
    'analytics.export.error': 'Ошибка экспорта',
    'analytics.export.allData': 'Все данные',
    'analytics.export.selected': 'Выбранные данные',

    // Alerts & Recommendations
    'analytics.alerts.title': 'Оповещения',
    'analytics.alerts.atRisk': 'Студент в зоне риска',
    'analytics.alerts.inactive': 'Неактивный студент',
    'analytics.alerts.struggling': 'Испытывает трудности',
    'analytics.alerts.excelling': 'Отличная успеваемость',
    'analytics.alerts.milestone': 'Веха достигнута',
    'analytics.alerts.severity.high': 'Высокая',
    'analytics.alerts.severity.medium': 'Средняя',
    'analytics.alerts.severity.low': 'Низкая',
    'analytics.alerts.noAlerts': 'Нет оповещений',
    'analytics.alerts.viewStudent': 'Просмотреть',

    'analytics.recommendations.title': 'Рекомендации',
    'analytics.recommendations.practiceMore': 'Увеличить практику',
    'analytics.recommendations.reviewBasics': 'Повторить основы',
    'analytics.recommendations.advanceLevel': 'Перейти на следующий уровень',
    'analytics.recommendations.seekHelp': 'Обратиться за помощью',
    'analytics.recommendations.maintainPace': 'Поддерживать темп',
    'analytics.recommendations.priority.high': 'Высокий приоритет',
    'analytics.recommendations.priority.medium': 'Средний приоритет',
    'analytics.recommendations.priority.low': 'Низкий приоритет',
    'analytics.recommendations.noRecommendations': 'Нет рекомендаций',
    'analytics.recommendations.actionItems': 'Действия',

    // Class Report
    'analytics.classReport.title': 'Отчёт по группе',
    'analytics.classReport.totalStudents': 'Всего студентов',
    'analytics.classReport.activeStudents': 'Активные',
    'analytics.classReport.avgCompletion': 'Среднее завершение',
    'analytics.classReport.avgAttempts': 'Среднее число попыток',
    'analytics.classReport.atRisk': 'В зоне риска',
    'analytics.classReport.excelling': 'Отличники',
    'analytics.classReport.topPerformers': 'Лучшие студенты',
    'analytics.classReport.struggling': 'Испытывают трудности',
    'analytics.classReport.inactive': 'Неактивные',
    'analytics.classReport.daysAgo': '{days} дн. назад',
    'analytics.classReport.noActivity': 'Нет активности',
    'analytics.classReport.generated': 'Сгенерировано {days}',

    // LMS Export
    'analytics.lms.title': 'Экспорт в LMS',
    'analytics.lms.format': 'Формат',
    'analytics.lms.format.csv': 'CSV',
    'analytics.lms.format.json': 'JSON',
    'analytics.lms.format.xml': 'XML (IMS Global)',
    'analytics.lms.includeProgress': 'Включить прогресс',
    'analytics.lms.includeAchievements': 'Включить достижения',
    'analytics.lms.includeAttempts': 'Включить попытки',
    'analytics.lms.exportAll': 'Экспортировать всё',

    // PDF Reports
    'analytics.pdf.studentReport': 'Отчёт студента',
    'analytics.pdf.classReport': 'Отчёт группы',
    'analytics.pdf.generate': 'Сгенерировать PDF',
    'analytics.pdf.download': 'Скачать PDF',
    'analytics.pdf.preview': 'Предпросмотр',
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
    'shortcuts.execute': 'Execute query',
    'shortcuts.indent': 'Indent in editor',

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
    'welcome.tip': 'Use hints and SQL reference for help',

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

    // ER Diagram
    'erDiagram.viewList': 'List',
    'erDiagram.viewDiagram': 'Diagram',
    'erDiagram.zoomIn': 'Zoom in',
    'erDiagram.zoomOut': 'Zoom out',
    'erDiagram.reset': 'Reset view',

    // Level
    'level.label': 'Lvl',
    'level.xpToNext': '{xp} XP to next level',

    // Reset progress
    'resetProgress.title': 'Reset Progress',
    'resetProgress.description': 'This will reset all your progress, achievements and saved queries',
    'resetProgress.button': 'Reset Progress',
    'resetProgress.confirmTitle': 'Are you sure?',
    'resetProgress.confirmDescription': 'All completed tasks, achievements, practice streak, XP, levels and saved queries will be deleted. This action cannot be undone.',
    'resetProgress.success': 'Progress reset',

    // Admin
    'admin.title': 'Admin Panel',
    'admin.tabs.overview': 'Overview',
    'admin.tabs.analytics': 'Analytics',
    'admin.tabs.leaderboard': 'Leaderboard',
    'admin.stats.title': 'Database Statistics',
    'admin.stats.totalUsers': 'Total Users',
    'admin.stats.students': 'Students',
    'admin.stats.teachers': 'Teachers',
    'admin.stats.admins': 'Administrators',
    'admin.stats.completions': 'Tasks Completed',
    'admin.stats.achievements': 'Achievements Awarded',
    'admin.stats.dbSize': 'DB Size',
    'admin.stats.loading': 'Loading statistics...',
    'admin.stats.error': 'Failed to load statistics',
    'admin.users.title': 'User Management',
    'admin.users.name': 'Name',
    'admin.users.email': 'Email',
    'admin.users.role': 'Role',
    'admin.users.tasks': 'Tasks',
    'admin.users.registered': 'Registered',
    'admin.users.actions': 'Actions',
    'admin.users.role.student': 'Student',
    'admin.users.role.teacher': 'Teacher',
    'admin.users.role.admin': 'Administrator',
    'admin.users.loading': 'Loading...',
    'admin.users.error': 'Failed to load users',
    'admin.users.roleUpdated': 'Role updated',
    'admin.users.roleUpdateError': 'Failed to update role',
    'admin.users.deleteConfirm': 'Delete user "{name}"? All data will be deleted.',
    'admin.users.deleted': 'User deleted',
    'admin.users.deleteError': 'Failed to delete user',
    'admin.users.search': 'Search by name or email...',
    'admin.users.prev': 'Previous',
    'admin.users.next': 'Next',
    'admin.users.noResults': 'No results',

    // Teacher Dashboard
    'teacher.loading': 'Loading...',
    'teacher.error': 'Failed to load data',
    'teacher.noData': 'No data',
    'teacher.tabs.progress': 'Progress',
    'teacher.tabs.analytics': 'Analytics',
    'teacher.tabs.engagement': 'Engagement',
    'teacher.stats.totalStudents': 'Total Students',
    'teacher.stats.activeStudents': 'Active (7 days)',
    'teacher.stats.totalCompletions': 'Tasks Completed',
    'teacher.stats.avgCompletionRate': 'Avg Completion',
    'teacher.stats.atRisk': 'At Risk',
    'teacher.stats.avgAttempts': 'Avg Attempts',
    'teacher.progress.title': 'Student Progress',
    'teacher.progress.name': 'Name',
    'teacher.progress.email': 'Email',
    'teacher.progress.completed': 'Completed',
    'teacher.progress.completionRate': 'Progress',
    'teacher.progress.avgAttempts': 'Avg Attempts',
    'teacher.progress.lastActive': 'Last Active',
    'teacher.progress.today': 'Today',
    'teacher.progress.yesterday': 'Yesterday',
    'teacher.progress.daysAgo': '{days} days ago',
    'teacher.progress.neverActive': 'No activity',
    'teacher.progress.search': 'Search by name or email...',
    'teacher.progress.prev': 'Previous',
    'teacher.progress.next': 'Next',
    'teacher.progress.noResults': 'No results',
    'teacher.engagement.title': 'Student Engagement',
    'teacher.engagement.level': 'Level',
    'teacher.engagement.score': 'Score',
    'teacher.engagement.velocity': 'Velocity',
    'teacher.engagement.high': 'High',
    'teacher.engagement.medium': 'Medium',
    'teacher.engagement.low': 'Low',
    'teacher.engagement.atRisk': 'At Risk',
    'teacher.engagement.highCount': 'High Engagement',
    'teacher.engagement.avgScore': 'Avg Score',
    'teacher.engagement.atRiskCount': 'At Risk',
    'teacher.engagement.perWeek': 'tasks/wk',
    'teacher.analytics.completionByLevel': 'Completion by Level',
    'teacher.analytics.easiestTasks': 'Easiest Tasks',
    'teacher.analytics.hardestTasks': 'Hardest Tasks',
    'teacher.analytics.completions': 'completions',
    'teacher.analytics.failRate': 'struggling',
    'teacher.export.title': 'Export Reports',
    'teacher.export.description': 'Select format and data to export',
    'teacher.export.format': 'Format',
    'teacher.export.button': 'Export',
    'teacher.export.exporting': 'Exporting...',
    'teacher.export.classReport': 'Class Report',
    'teacher.student.details': 'Details',
    'teacher.student.detailTitle': 'Student: {name}',
    'teacher.student.activityChart': 'Activity',
    'teacher.export.studentReport': 'Student Report',
    'teacher.tabs.alerts': 'Alerts',
    'teacher.tabs.cohorts': 'Cohorts',
    'teacher.tabs.recommendations': 'Recommendations',
    'teacher.cohort.title': 'Cohort Analysis',
    'teacher.cohort.month': 'Month',
    'teacher.cohort.total': 'Total',
    'teacher.cohort.month0': 'Month 0',
    'teacher.cohort.month1': 'Month 1',
    'teacher.cohort.month2': 'Month 2',
    'teacher.cohort.month3': 'Month 3',
    'teacher.recommendations.title': 'Recommendations',
    'teacher.recommendations.target': 'Target group',
    'teacher.alerts.title': 'Student Alerts',
    'teacher.alerts.noAlerts': 'No alerts — all students doing well',
    'teacher.alerts.atRisk': 'At Risk',
    'teacher.alerts.inactive': 'Inactive',
    'teacher.alerts.struggling': 'Struggling',
    'teacher.alerts.excelling': 'Excelling',
    'teacher.alerts.high': 'High',
    'teacher.alerts.medium': 'Medium',
    'teacher.alerts.low': 'Low',
    'teacher.tabs.churn': 'Churn',

    // Analytics
    'analytics.loading': 'Loading analytics...',
    'analytics.error': 'Failed to load data',
    'analytics.noData': 'No data',

    // Activity chart
    'analytics.activity.title': 'Activity (Last 30 Days)',
    'analytics.activity.completions': 'Completions',
    'analytics.activity.uniqueUsers': 'Unique Users',

    // Performance metrics
    'analytics.metrics.activeUsers': 'Active (7d)',
    'analytics.metrics.avgAttempts': 'Avg Attempts',
    'analytics.metrics.totalStudents': 'Total Students',
    'analytics.metrics.completionRate': 'Completion Rate',

    // Task analytics
    'analytics.tasks.title': 'Task Analytics',
    'analytics.tasks.byDifficulty': 'Difficulty by Attempts',
    'analytics.tasks.hardest': 'Hardest Tasks',
    'analytics.tasks.taskName': 'Task',
    'analytics.tasks.difficulty': 'Difficulty',
    'analytics.tasks.completions': 'Completions',
    'analytics.tasks.avgAttempts': 'Avg Attempts',
    'analytics.tasks.firstAttemptRate': 'First Attempt',

    // Completion distribution
    'analytics.distribution.title': 'Student Distribution',
    'analytics.distribution.completions': 'Tasks Completed',
    'analytics.distribution.students': 'Students',

    // Achievement analytics
    'analytics.achievements.title': 'Achievements',
    'analytics.achievements.earnRate': 'Earn Rate',
    'analytics.achievements.recent': 'Recent Earners',
    'analytics.achievements.noRecent': 'No one has earned yet',

    // Leaderboard
    'analytics.leaderboard.title': 'Student Leaderboard',
    'analytics.leaderboard.rank': 'Rank',
    'analytics.leaderboard.name': 'Name',
    'analytics.leaderboard.completed': 'Completed',
    'analytics.leaderboard.achievements': 'Achievements',
    'analytics.leaderboard.completionRate': 'Progress',
    'analytics.leaderboard.avgAttempts': 'Avg Attempts',
    'analytics.leaderboard.search': 'Search by name or email...',
    'analytics.leaderboard.prev': 'Previous',
    'analytics.leaderboard.next': 'Next',
    'analytics.leaderboard.noResults': 'No results',

    // Student detail dialog
    'analytics.student.detailTitle': 'Details: {name}',
    'analytics.student.email': 'Email',
    'analytics.student.lastActive': 'Last Active',
    'analytics.student.neverActive': 'No activity',
    'analytics.student.totalAttempts': 'Total Attempts',
    'analytics.student.avgAttempts': 'Avg Attempts',
    'analytics.student.byDifficulty': 'By Difficulty',
    'analytics.student.achievements': 'Achievements',
    'analytics.student.noAchievements': 'No achievements',
    'analytics.student.beginner': 'Beginner',
    'analytics.student.intermediate': 'Intermediate',
    'analytics.student.advanced': 'Advanced',
    'analytics.student.completed': 'Completed',

    // Advanced analytics
    'analytics.progress.title': 'Learning Progress',
    'analytics.progress.weekly': 'Weekly Activity',
    'analytics.progress.students': 'Students',
    'analytics.progress.tasks': 'Tasks',
    'analytics.progress.cumulative': 'Cumulative',
    'analytics.progress.attempts': 'Attempts',

    'analytics.timeToComplete.title': 'Time to Complete',
    'analytics.timeToComplete.min': 'Minimum',
    'analytics.timeToComplete.avg': 'Average',
    'analytics.timeToComplete.max': 'Maximum',
    'analytics.timeToComplete.minutes': '{min} min',
    'analytics.heatmap.title': 'Activity Heatmap',
    'analytics.weekComparison.title': 'Week-over-Week Comparison',

    'analytics.errors.title': 'Errors',
    'analytics.engagement.title': 'Engagement',
    'analytics.churn.title': 'Churn',

    'analytics.cohort.title': 'Cohort Analysis',
    'analytics.cohort.month': 'Month',
    'analytics.cohort.retention': 'Retention',
    'analytics.cohort.total': 'Total',
    'analytics.cohort.month0': 'Month 0',
    'analytics.cohort.month1': 'Month 1',
    'analytics.cohort.month2': 'Month 2',
    'analytics.cohort.month3': 'Month 3',

    'analytics.difficulty.title': 'Difficulty Comparison',
    'analytics.difficulty.attempted': 'Attempted',
    'analytics.difficulty.completion': 'Completion',
    'analytics.difficulty.firstAttempt': 'First Attempt',

    'analytics.students.title': 'Student Performance',
    'analytics.students.performance': 'Performance',
    'analytics.students.trend': 'Trend',
    'analytics.students.trend.improving': 'Improving',
    'analytics.students.trend.stable': 'Stable',
    'analytics.students.trend.declining': 'Declining',
    'analytics.students.streak': 'Streak',
    'analytics.students.weakest': 'Weakest Level',
    'analytics.students.viewDetails': 'View Details',

    // Date range filter
    'analytics.filter.dateRange': 'Date Range',
    'analytics.filter.last7': '7 days',
    'analytics.filter.last14': '14 days',
    'analytics.filter.last30': '30 days',
    'analytics.filter.last90': '90 days',
    'analytics.filter.custom': 'Custom',
    'analytics.filter.startDate': 'Start Date',
    'analytics.filter.endDate': 'End Date',
    'analytics.filter.apply': 'Apply',
    'analytics.filter.reset': 'Reset',

    // Export
    'analytics.export.csv': 'Export CSV',
    'analytics.export.excel': 'Export Excel',
    'analytics.export.success': 'Report exported',
    'analytics.export.error': 'Export failed',
    'analytics.export.allData': 'All data',
    'analytics.export.selected': 'Selected data',

    // Alerts & Recommendations
    'analytics.alerts.title': 'Alerts',
    'analytics.alerts.atRisk': 'Student at risk',
    'analytics.alerts.inactive': 'Inactive student',
    'analytics.alerts.struggling': 'Struggling student',
    'analytics.alerts.excelling': 'Excelling student',
    'analytics.alerts.milestone': 'Milestone reached',
    'analytics.alerts.severity.high': 'High',
    'analytics.alerts.severity.medium': 'Medium',
    'analytics.alerts.severity.low': 'Low',
    'analytics.alerts.noAlerts': 'No alerts',
    'analytics.alerts.viewStudent': 'View',

    'analytics.recommendations.title': 'Recommendations',
    'analytics.recommendations.practiceMore': 'Practice more',
    'analytics.recommendations.reviewBasics': 'Review basics',
    'analytics.recommendations.advanceLevel': 'Advance to next level',
    'analytics.recommendations.seekHelp': 'Seek help',
    'analytics.recommendations.maintainPace': 'Maintain pace',
    'analytics.recommendations.priority.high': 'High priority',
    'analytics.recommendations.priority.medium': 'Medium priority',
    'analytics.recommendations.priority.low': 'Low priority',
    'analytics.recommendations.noRecommendations': 'No recommendations',
    'analytics.recommendations.actionItems': 'Action items',

    // Class Report
    'analytics.classReport.title': 'Class Report',
    'analytics.classReport.totalStudents': 'Total Students',
    'analytics.classReport.activeStudents': 'Active',
    'analytics.classReport.avgCompletion': 'Avg Completion',
    'analytics.classReport.avgAttempts': 'Avg Attempts',
    'analytics.classReport.atRisk': 'At Risk',
    'analytics.classReport.excelling': 'Excelling',
    'analytics.classReport.topPerformers': 'Top Performers',
    'analytics.classReport.struggling': 'Struggling',
    'analytics.classReport.inactive': 'Inactive',
    'analytics.classReport.daysAgo': '{days} days ago',
    'analytics.classReport.noActivity': 'No activity',
    'analytics.classReport.generated': 'Generated {days}',

    // LMS Export
    'analytics.lms.title': 'LMS Export',
    'analytics.lms.format': 'Format',
    'analytics.lms.format.csv': 'CSV',
    'analytics.lms.format.json': 'JSON',
    'analytics.lms.format.xml': 'XML (IMS Global)',
    'analytics.lms.includeProgress': 'Include progress',
    'analytics.lms.includeAchievements': 'Include achievements',
    'analytics.lms.includeAttempts': 'Include attempts',
    'analytics.lms.exportAll': 'Export all',

    // PDF Reports
    'analytics.pdf.studentReport': 'Student Report',
    'analytics.pdf.classReport': 'Class Report',
    'analytics.pdf.generate': 'Generate PDF',
    'analytics.pdf.download': 'Download PDF',
    'analytics.pdf.preview': 'Preview',
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
