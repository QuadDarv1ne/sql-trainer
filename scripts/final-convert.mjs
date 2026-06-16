import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// All replacements: [file, oldString, newString]
const reps = [];

function add(file, oldStr, newStr) {
  reps.push([file, oldStr, newStr]);
}

// ==================== ADMIN PAGE ====================
add(
  'src/app/(main)/admin/page.tsx',
  "default: 'Управление пользователями, аналитика и мониторинг системы'",
  "default: 'User management, analytics and system monitoring'",
);
add('src/app/(main)/admin/page.tsx', "default: 'Метрики'", "default: 'Metrics'");

// ==================== APP PAGE ====================
add(
  'src/app/(main)/app/page.tsx',
  "default: 'Не удалось проверить результат запроса'",
  "default: 'Failed to verify query result'",
);

// ==================== PROFILE PAGE ====================
add(
  'src/app/(main)/profile/page.tsx',
  "default: 'Прогресс сброшен. Можно отменить в течение 30 секунд.'",
  "default: 'Progress reset. Can undo within 30 seconds.'",
);
add('src/app/(main)/profile/page.tsx', "default: 'Отменить'", "default: 'Undo'");
add('src/app/(main)/profile/page.tsx', "default: 'Прогресс восстановлен'", "default: 'Progress restored'");
add('src/app/(main)/profile/page.tsx', "default: 'Профиль'", "default: 'Profile'");
add(
  'src/app/(main)/profile/page.tsx',
  "default: 'Управляйте своим профилем и отслеживайте прогресс'",
  "default: 'Manage your profile and track progress'",
);

// ==================== TEACHER PAGE ====================
add(
  'src/app/(main)/teacher/page.tsx',
  "default: 'Отслеживание прогресса студентов и аналитика класса'",
  "default: 'Student progress tracking and class analytics'",
);

// ==================== ADMIN ANALYTICS ====================
add('src/components/admin/admin-analytics.tsx', "default: 'Административная панель'", "default: 'Admin Dashboard'");
add('src/components/admin/admin-analytics.tsx', "default: 'Обновить'", "default: 'Refresh'");
add('src/components/admin/admin-analytics.tsx', "default: 'Экспорт'", "default: 'Export'");
add('src/components/admin/admin-analytics.tsx', "default: 'Всего пользователей'", "default: 'Total Users'");
add('src/components/admin/admin-analytics.tsx', "default: 'Новых за сегодня'", "default: 'New Today'");
add('src/components/admin/admin-analytics.tsx', "default: 'Запросов'", "default: 'Requests'");
add('src/components/admin/admin-analytics.tsx', "default: 'Ошибки'", "default: 'Errors'");
add('src/components/admin/admin-analytics.tsx', "default: 'База данных'", "default: 'Database'");
add('src/components/admin/admin-analytics.tsx', "default: 'Размер БД'", "default: 'DB Size'");
add('src/components/admin/admin-analytics.tsx', "default: 'за 30 дней'", "default: 'over 30 days'");
add('src/components/admin/admin-analytics.tsx', "default: 'Онлайн'", "default: 'Online'");
add('src/components/admin/admin-analytics.tsx', "default: 'пользователей'", "default: 'users'");
add('src/components/admin/admin-analytics.tsx', "default: 'Время ответа'", "default: 'Response Time'");
add('src/components/admin/admin-analytics.tsx', "default: 'Активность пользователей'", "default: 'User Activity'");
add(
  'src/components/admin/admin-analytics.tsx',
  "default: 'Последние активные пользователи'",
  "default: 'Recently Active Users'",
);
add('src/components/admin/admin-analytics.tsx', "default: 'Все пользователи'", "default: 'All Users'");
add('src/components/admin/admin-analytics.tsx', "default: 'Пользователь'", "default: 'User'");
add('src/components/admin/admin-analytics.tsx', "default: 'Роль'", "default: 'Role'");
add('src/components/admin/admin-analytics.tsx', "default: 'Запросов сегодня'", "default: 'Queries Today'");
add('src/components/admin/admin-analytics.tsx', "default: 'Был(а)'", "default: 'Last Seen'");
add('src/components/admin/admin-analytics.tsx', "default: 'Статус'", "default: 'Status'");
add('src/components/admin/admin-analytics.tsx', "default: 'Админ'", "default: 'Admin'");
add('src/components/admin/admin-analytics.tsx', "default: 'Преподаватель'", "default: 'Teacher'");
add('src/components/admin/admin-analytics.tsx', "default: 'Студент'", "default: 'Student'");
add('src/components/admin/admin-analytics.tsx', "default: 'Активен'", "default: 'Active'");
add('src/components/admin/admin-analytics.tsx', "default: 'Заблокирован'", "default: 'Banned'");
add('src/components/admin/admin-analytics.tsx', "default: 'Не активен'", "default: 'Inactive'");
add('src/components/admin/admin-analytics.tsx', "default: 'Журнал аудита'", "default: 'Audit Log'");
add(
  'src/components/admin/admin-analytics.tsx',
  "default: 'Последние действия в системе'",
  "default: 'Latest system actions'",
);
add('src/components/admin/admin-analytics.tsx', "default: 'Все логи'", "default: 'All Logs'");
add('src/components/admin/admin-analytics.tsx', "default: 'Время'", "default: 'Time'");
add('src/components/admin/admin-analytics.tsx', "default: 'Действие'", "default: 'Action'");
add('src/components/admin/admin-analytics.tsx', "default: 'Ресурс'", "default: 'Resource'");
add('src/components/admin/admin-analytics.tsx', "default: 'Журнал аудита пуст'", "default: 'Audit log is empty'");

// ==================== USER TABLE ====================
add('src/components/admin/user-table.tsx', "default: 'Заблокированные'", "default: 'Banned'");

// ==================== REGISTER FORM ====================
add('src/components/auth/register-form.tsx', "default: 'Практика SQL-запросов'", "default: 'Practice SQL queries'");
add(
  'src/components/auth/register-form.tsx',
  "default: 'Аналитика и прогресс студентов'",
  "default: 'Student analytics and progress'",
);

// ==================== EXPLAIN PANEL ====================
add(
  'src/components/explain-panel.tsx',
  "default: 'Рекомендации по оптимизации'",
  "default: 'Optimization recommendations'",
);

// ==================== LEARNING PATH ====================
add('src/components/student/learning-path.tsx', "default: 'Ваш учебный план'", "default: 'Your learning path'");
add(
  'src/components/student/learning-path.tsx',
  "default: 'Последовательное изучение SQL от простого к сложному'",
  "default: 'Progressive SQL learning from basics to advanced'",
);
add('src/components/student/learning-path.tsx', "default: 'задач выполнено'", "default: 'tasks completed'");
add('src/components/student/learning-path.tsx', "default: 'Заработано'", "default: 'Earned'");
add('src/components/student/learning-path.tsx', "default: 'Текущий уровень'", "default: 'Current level'");
add('src/components/student/learning-path.tsx', "default: 'выполнено'", "default: 'completed'");
add('src/components/student/learning-path.tsx', "default: 'Требуется:'", "default: 'Required:'");
add('src/components/student/learning-path.tsx', "default: 'предварительных задач'", "default: 'prerequisite tasks'");
add('src/components/student/learning-path.tsx', "default: 'Начать'", "default: 'Start'");
add('src/components/student/learning-path.tsx', "default: 'Повторить'", "default: 'Review'");
add('src/components/student/learning-path.tsx', "default: 'Выполнено'", "default: 'Completed'");
add('src/components/student/learning-path.tsx', "default: 'Доступно'", "default: 'Available'");
add('src/components/student/learning-path.tsx', "default: 'Заблокировано'", "default: 'Locked'");
add('src/components/student/learning-path.tsx', "default: 'Прогресс'", "default: 'Progress'");

// ==================== STUDENT DASHBOARD ====================
add(
  'src/components/student/student-dashboard.tsx',
  "default: 'Не удалось загрузить данные'",
  "default: 'Failed to load data'",
);
add('src/components/student/student-dashboard.tsx', "default: 'Добро пожаловать'", "default: 'Welcome'");
add(
  'src/components/student/student-dashboard.tsx',
  "default: 'Ваш прогресс и рекомендации по обучению'",
  "default: 'Your progress and learning recommendations'",
);
add('src/components/student/student-dashboard.tsx', "default: 'Обзор'", "default: 'Overview'");
add('src/components/student/student-dashboard.tsx', "default: 'Учебный план'", "default: 'Learning Path'");
add('src/components/student/student-dashboard.tsx', "default: 'Продолжить обучение'", "default: 'Continue Learning'");
add(
  'src/components/student/student-dashboard.tsx',
  "default: 'Все задачи выполнены!'",
  "default: 'All tasks completed!'",
);
add('src/components/student/student-dashboard.tsx', "default: 'Следующая задача'", "default: 'Next Task'");
add('src/components/student/student-dashboard.tsx', "default: 'задач выполнено'", "default: 'tasks completed'");
add('src/components/student/student-dashboard.tsx', "default: 'Начать задачу'", "default: 'Start Task'");
add('src/components/student/student-dashboard.tsx', "default: 'Перейти к практике'", "default: 'Go to Practice'");
add('src/components/student/student-dashboard.tsx', "default: 'Серия'", "default: 'Streak'");
add('src/components/student/student-dashboard.tsx', "default: 'день подряд'", "default: 'day streak'");
add('src/components/student/student-dashboard.tsx', "default: 'дня подряд'", "default: 'day streak'");
add('src/components/student/student-dashboard.tsx', "default: 'дней подряд'", "default: 'day streak'");
add('src/components/student/student-dashboard.tsx', "default: 'Рекорд'", "default: 'Record'");
add('src/components/student/student-dashboard.tsx', "default: 'Всего дней'", "default: 'Total Days'");
add('src/components/student/student-dashboard.tsx', "default: 'Уровень'", "default: 'Level'");
add(
  'src/components/student/student-dashboard.tsx',
  "default: 'Прогресс по сложности'",
  "default: 'Progress by Difficulty'",
);
add('src/components/student/student-dashboard.tsx', "default: 'Рекомендации'", "default: 'Recommendations'");
add(
  'src/components/student/student-dashboard.tsx',
  "default: 'Персонализированные рекомендации по обучению'",
  "default: 'Personalized learning recommendations'",
);
add(
  'src/components/student/student-dashboard.tsx',
  "default: 'Выполните несколько задач для получения рекомендаций'",
  "default: 'Complete a few tasks to get recommendations'",
);
add('src/components/student/student-dashboard.tsx', "default: 'Напоминания'", "default: 'Reminders'");
add(
  'src/components/student/student-dashboard.tsx',
  "default: 'Предстоящие дедлайны и напоминания'",
  "default: 'Upcoming deadlines and reminders'",
);
add(
  'src/components/student/student-dashboard.tsx',
  "default: 'Нет предстоящих напоминаний'",
  "default: 'No upcoming reminders'",
);
add('src/components/student/student-dashboard.tsx', "default: 'Просрочено'", "default: 'Overdue'");
add('src/components/student/student-dashboard.tsx', "default: 'Завтра'", "default: 'Tomorrow'");
add('src/components/student/student-dashboard.tsx', "default: 'SQL Редактор'", "default: 'SQL Editor'");
add(
  'src/components/student/student-dashboard.tsx',
  "default: 'Практика SQL-запросов'",
  "default: 'Practice SQL Queries'",
);
add('src/components/student/student-dashboard.tsx', "default: 'Профиль'", "default: 'Profile'");
add(
  'src/components/student/student-dashboard.tsx',
  "default: 'Достижения и статистика'",
  "default: 'Achievements and Statistics'",
);
add('src/components/student/student-dashboard.tsx', "default: 'Достижения'", "default: 'Achievements'");

// ==================== GROUP MANAGEMENT ====================
add('src/components/teacher/group-management.tsx', "default: 'Управление группами'", "default: 'Group Management'");
add('src/components/teacher/group-management.tsx', "default: 'Создать группу'", "default: 'Create Group'");
add('src/components/teacher/group-management.tsx', "default: 'Создание группы'", "default: 'Creating Group'");
add(
  'src/components/teacher/group-management.tsx',
  "default: 'Создайте новую группу для управления студентами'",
  "default: 'Create a new group to manage students'",
);
add('src/components/teacher/group-management.tsx', "default: 'Название'", "default: 'Name'");
add('src/components/teacher/group-management.tsx', "default: 'Например: ПИ-2024'", "default: 'For example: CS-2024'");
add('src/components/teacher/group-management.tsx', "default: 'Описание'", "default: 'Description'");
add('src/components/teacher/group-management.tsx', "default: 'Описание группы'", "default: 'Group description'");
add('src/components/teacher/group-management.tsx', "default: 'Отмена'", "default: 'Cancel'");
add('src/components/teacher/group-management.tsx', "default: 'Создать'", "default: 'Create'");
add('src/components/teacher/group-management.tsx', "default: 'студ.'", "default: 'stud.'");
add(
  'src/components/teacher/group-management.tsx',
  "default: 'Нет групп. Создайте первую группу для начала работы.'",
  "default: 'No groups. Create the first group to get started.'",
);
add('src/components/teacher/group-management.tsx', "default: 'студентов в группе'", "default: 'students in group'");
add('src/components/teacher/group-management.tsx', "default: 'Добавить'", "default: 'Add'");
add('src/components/teacher/group-management.tsx', "default: 'Экспорт'", "default: 'Export'");
add('src/components/teacher/group-management.tsx', "default: 'Поиск студентов...'", "default: 'Search students...'");
add('src/components/teacher/group-management.tsx', "default: 'Студент'", "default: 'Student'");
add('src/components/teacher/group-management.tsx', "default: 'Уровень'", "default: 'Level'");
add('src/components/teacher/group-management.tsx', "default: 'Прогресс'", "default: 'Progress'");
add('src/components/teacher/group-management.tsx', "default: 'Был(а)'", "default: 'Last Seen'");
add('src/components/teacher/group-management.tsx', "default: 'Действия'", "default: 'Actions'");
add('src/components/teacher/group-management.tsx', "default: 'зад.'", "default: 'ago'");
add('src/components/teacher/group-management.tsx', "default: 'Написать'", "default: 'Message'");
add('src/components/teacher/group-management.tsx', "default: 'Редактировать'", "default: 'Edit'");
add('src/components/teacher/group-management.tsx', "default: 'Удалить'", "default: 'Delete'");
add(
  'src/components/teacher/group-management.tsx',
  "default: 'В группе пока нет студентов'",
  "default: 'No students in group yet'",
);
add('src/components/teacher/group-management.tsx', "default: 'Добавить студентов'", "default: 'Add Students'");
add(
  'src/components/teacher/group-management.tsx',
  "default: 'Введите email адреса студентов (через запятую или каждый с новой строки)'",
  "default: 'Enter student email addresses (comma-separated or one per line)'",
);
add('src/components/teacher/group-management.tsx', "default: 'Email адреса'", "default: 'Email Addresses'");

// ==================== TEACHER DASHBOARD ====================
add('src/components/teacher/teacher-dashboard.tsx', "default: 'Группы'", "default: 'Groups'");

// ==================== WELCOME PANEL ====================
add('src/components/welcome-panel.tsx', "default: 'Нужно practice'", "default: 'Need practice'");

// ==================== SQL GLOSSARY ====================
add('src/components/sql-glossary.tsx', "default: 'недопустимый символ'", "default: 'invalid character'");
add('src/components/sql-glossary.tsx', "default: 'Ключевые слова SQL'", "default: 'SQL Keywords'");

// ==================== CONTEXTUAL TIPS ====================
add(
  'src/components/contextual-tips.tsx',
  'INNER JOIN возвращает только совпадающие строки из обеих таблиц. LEFT JOIN — все строки из левой таблицы + совпадения из правой (или NULL). RIGHT JOIN — наоборот.',
  'INNER JOIN returns only matching rows from both tables. LEFT JOIN returns all rows from the left table + matches from the right (or NULL). RIGHT JOIN is the opposite.',
);
add(
  'src/components/contextual-tips.tsx',
  'После GROUP BY в SELECT можно использовать только столбцы из GROUP BY и агрегатные функции (COUNT, SUM, AVG, MIN, MAX). Для фильтрации агрегатов используйте HAVING, а не WHERE.',
  'After GROUP BY, SELECT can only use columns from GROUP BY and aggregate functions (COUNT, SUM, AVG, MIN, MAX). To filter aggregates use HAVING, not WHERE.',
);
add(
  'src/components/contextual-tips.tsx',
  'OVER (PARTITION BY ...) делит данные на группы, внутри которых применяется функция. В отличие от GROUP BY, оконные функции не \u00ABсхлопывают\u00BB строки — каждая строка сохраняется.',
  'OVER (PARTITION BY ...) divides data into groups, within which the function is applied. Unlike GROUP BY, window functions do not collapse rows — each row is preserved.',
);
add(
  'src/components/contextual-tips.tsx',
  'ROW_NUMBER() даёт уникальный номер каждой строке. RANK() пропускает номера при одинаковых значениях (1,2,2,4). DENSE_RANK() не пропускает (1,2,2,3). Всегда используйте ORDER BY внутри OVER().',
  'ROW_NUMBER() assigns a unique number to each row. RANK() skips numbers on equal values (1,2,2,4). DENSE_RANK() does not skip (1,2,2,3). Always use ORDER BY inside OVER().',
);
add(
  'src/components/contextual-tips.tsx',
  'CTE (Common Table Expression) — именованный подзапрос, который можно использовать несколько раз. Делает сложный запрос читаемым. Несколько CTE разделяются запятой: WITH cte1 AS (...), cte2 AS (...)',
  'CTE (Common Table Expression) — a named subquery that can be used multiple times. Makes complex queries readable. Multiple CTEs are separated by commas: WITH cte1 AS (...), cte2 AS (...).',
);
add(
  'src/components/contextual-tips.tsx',
  'Подзапрос в WHERE (IN, EXISTS) выполняется для каждой строки внешнего запроса. EXISTS эффективнее IN, т.к. останавливается на первом совпадении. Подзапросы в SELECT вычисляются для каждой строки.',
  'A subquery in WHERE (IN, EXISTS) executes for each row of the outer query. EXISTS is more efficient than IN because it stops on the first match. Subqueries in SELECT are computed for each row.',
);
add(
  'src/components/contextual-tips.tsx',
  'NULL — это \u00ABотсутствие значения\u00BB, он не равен ничему, даже другому NULL. Используйте COALESCE(col, default) для подстановки значения по умолчанию. Для сравнения: col IS NULL, а не col = NULL.',
  'NULL means "absence of value" — it is not equal to anything, not even another NULL. Use COALESCE(col, default) to substitute a default value. For comparison: col IS NULL, not col = NULL.',
);
add(
  'src/components/contextual-tips.tsx',
  'Порядок выполнения SQL: FROM \u2192 WHERE \u2192 GROUP BY \u2192 HAVING \u2192 SELECT \u2192 ORDER BY \u2192 LIMIT. Это объясняет, почему WHERE не работает с агрегатными функциями.\n',
  'SQL execution order: FROM \u2192 WHERE \u2192 GROUP BY \u2192 HAVING \u2192 SELECT \u2192 ORDER BY \u2192 LIMIT. This explains why WHERE does not work with aggregate functions.\n',
);
add(
  'src/components/contextual-tips.tsx',
  'Индексы ускоряют поиск (WHERE, JOIN) за счёт предварительной сортировки. CREATE INDEX idx_name ON table(col).',
  'Indexes speed up searches (WHERE, JOIN) by pre-sorting. CREATE INDEX idx_name ON table(col).',
);
add(
  'src/components/contextual-tips.tsx',
  'Транзакции: BEGIN TRANSACTION \u2192 ... \u2192 COMMIT (сохранить) или ROLLBACK (отменить).',
  'Transactions: BEGIN TRANSACTION \u2192 ... \u2192 COMMIT (save) or ROLLBACK (undo).',
);
add('src/components/contextual-tips.tsx', "title: 'Типы JOIN'", "title: 'JOIN Types'");
add('src/components/contextual-tips.tsx', "title: 'GROUP BY и агрегация'", "title: 'GROUP BY and Aggregation'");
add('src/components/contextual-tips.tsx', "title: 'Оконные функции'", "title: 'Window Functions'");
add('src/components/contextual-tips.tsx', "title: 'Ранжирование'", "title: 'Ranking'");
add('src/components/contextual-tips.tsx', "title: 'CTE'", "title: 'CTE'");
add('src/components/contextual-tips.tsx', "title: 'Подзапросы'", "title: 'Subqueries'");
add('src/components/contextual-tips.tsx', "title: 'Работа с NULL'", "title: 'Working with NULL'");
add('src/components/contextual-tips.tsx', "title: 'Порядок выполнения'", "title: 'Execution Order'");
add('src/components/contextual-tips.tsx', "title: 'Индексы'", "title: 'Indexes'");
add('src/components/contextual-tips.tsx', "title: 'Транзакции'", "title: 'Transactions'");

// ==================== CONTEXTUAL TIPS (second tips block) ====================
add(
  'src/components/contextual-tips.tsx',
  'CASE позволяет ветвление в SQL: CASE WHEN condition THEN result [ELSE default] END. Можно использовать в SELECT, ORDER BY и даже GROUP BY. Всегда заканчивайте END!',
  'CASE enables branching in SQL: CASE WHEN condition THEN result [ELSE default] END. Can be used in SELECT, ORDER BY and even GROUP BY. Always end with END!',
);
add(
  'src/components/contextual-tips.tsx',
  'EXISTS проверяет наличие хотя бы одной строки в подзапросе. Обычно быстрее IN, т.к. останавливается на первом совпадении. Часто используется с коррелированным подзапросом, ссылающимся на внешний запрос.',
  'EXISTS checks for at least one row in a subquery. Usually faster than IN because it stops on the first match. Often used with correlated subqueries referencing the outer query.',
);
add(
  'src/components/contextual-tips.tsx',
  'UNION удаляет дубликаты, UNION ALL — оставляет все строки.',
  'UNION removes duplicates, UNION ALL keeps all rows.',
);
add(
  'src/components/contextual-tips.tsx',
  'Автоинкремент (AUTO_INCREMENT / SERIAL) генерирует уникальный ID для каждой новой строки.',
  'Auto-increment (AUTO_INCREMENT / SERIAL) generates a unique ID for each new row.',
);
add(
  'src/components/contextual-tips.tsx',
  'Внешний ключ (FOREIGN KEY) ссылается на PRIMARY KEY другой таблицы, обеспечивая ссылочную целостность.',
  'A foreign key (FOREIGN KEY) references a PRIMARY KEY of another table, ensuring referential integrity.',
);
add(
  'src/components/contextual-tips.tsx',
  'ILIKE — регистронезависимый LIKE. SIMILAR TO — регулярные выражения в PostgreSQL.',
  'ILIKE — case-insensitive LIKE. SIMILAR TO — regular expressions in PostgreSQL.',
);
add(
  'src/components/contextual-tips.tsx',
  'OFFSET/FETCH — стандартный SQL синтаксис пагинации (в PostgreSQL, SQL Server).',
  'OFFSET/FETCH — standard SQL pagination syntax (PostgreSQL, SQL Server).',
);
add(
  'src/components/contextual-tips.tsx',
  'RETURNING возвращает данные изменённых строк после INSERT/UPDATE/DELETE.',
  'RETURNING returns data from modified rows after INSERT/UPDATE/DELETE.',
);
add(
  'src/components/contextual-tips.tsx',
  'LATERAL позволяет подзапросу в FROM ссылаться на столбцы предыдущих таблиц.',
  'LATERAL allows a subquery in FROM to reference columns of preceding tables.',
);
add(
  'src/components/contextual-tips.tsx',
  'DISTINCT ON (PostgreSQL) оставляет первую строку для каждого уникального значения.',
  'DISTINCT ON (PostgreSQL) keeps the first row for each unique value.',
);
add('src/components/contextual-tips.tsx', 'title: \u00ABОконные функции\u00BB', "title: 'Window Functions'");

// ==================== ANALYTICS COMPONENTS ====================
add('src/config/analytics-tabs.ts', "default: 'Обзор'", "default: 'Overview'");
add('src/config/analytics-tabs.ts', "default: 'Пользователи'", "default: 'Users'");
add('src/config/analytics-tabs.ts', "default: 'Производительность'", "default: 'Performance'");
add('src/config/analytics-tabs.ts', "default: 'Уведомления'", "default: 'Notifications'");
add('src/config/analytics-tabs.ts', "default: 'Регистрации'", "default: 'Registrations'");

add('src/components/admin/analytics/activity-summary.tsx', "default: 'Активность'", "default: 'Activity'");
add(
  'src/components/admin/analytics/aggregate-performance.tsx',
  "default: 'Производительность'",
  "default: 'Performance'",
);
add('src/components/admin/analytics/notification-analytics.tsx', "default: 'Уведомления'", "default: 'Notifications'");
add('src/components/admin/analytics/onboarding-funnel.tsx', "default: 'Воронка'", "default: 'Funnel'");
add('src/components/admin/analytics/registration-funnel.tsx', "default: 'Регистрации'", "default: 'Registrations'");
add('src/components/admin/analytics/registration-trends.tsx', "default: 'Тренды'", "default: 'Trends'");
add('src/components/admin/analytics/session-analysis-chart.tsx', "default: 'Сессии'", "default: 'Sessions'");
add('src/components/admin/analytics/study-patterns.tsx', "default: 'Паттерны'", "default: 'Patterns'");
add('src/components/admin/analytics/topic-performance-chart.tsx', "default: 'Темы'", "default: 'Topics'");
add(
  'src/components/admin/analytics/topic-performance-chart.tsx',
  "default: 'Производительность'",
  "default: 'Performance'",
);

add('src/components/locale-selector.tsx', "default: 'Язык'", "default: 'Language'");
add('src/components/theme-time-sync.tsx', "default: 'Тема'", "default: 'Theme'");
add('src/components/query-result-chart.tsx', "default: 'График'", "default: 'Chart'");

// ==================== LIB FILES ====================
add('src/lib/sql-engine.ts', "default: 'Ошибка выполнения SQL'", "default: 'SQL execution error'");
add('src/lib/concept-engine.ts', "default: 'Ошибка выполнения индекса'", "default: 'Index execution error'");
add('src/lib/scheduler.ts', "default: 'Ошибка планировщика'", "default: 'Scheduler error'");
add('src/lib/notification-config.ts', "default: 'Уведомление'", "default: 'Notification'");
add('src/lib/rbac.ts', "default: 'Недостаточно прав'", "default: 'Insufficient permissions'");
add('src/lib/mongodb-engine.ts', "default: 'Ошибка выполнения MongoDB'", "default: 'MongoDB execution error'");
add('src/lib/mysql-adapter.ts', "default: 'Ошибка MySQL'", "default: 'MySQL error'");
add('src/lib/progressive-hints.ts', "default: 'Подсказка'", "default: 'Hint'");
add('src/lib/store/gamification-slice.ts', "default: 'Серия'", "default: 'Streak'");
add('src/lib/store/gamification-slice.ts', "default: 'достижение'", "default: 'achievement'");
add('src/lib/store/gamification-slice.ts', "default: 'Опыт'", "default: 'Experience'");
add('src/lib/store/gamification-slice.ts', "default: 'Награда'", "default: 'Reward'");
add('src/lib/store/timer-slice.ts', "default: 'Таймер'", "default: 'Timer'");
add('src/components/admin/deadline-manager.tsx', "default: 'Дедлайн'", "default: 'Deadline'");

// Process files
let totalBefore = 0;
let totalAfter = 0;
const processed = {};

for (const [file, oldStr, newStr] of reps) {
  if (!processed[file]) {
    const fp = path.resolve(root, file);
    let content = fs.readFileSync(fp, 'utf-8');
    // Normalize to LF
    content = content.replace(/\r\n/g, '\n');
    const cyr = (content.match(/[А-яЁё]/g) || []).length;
    processed[file] = { content, beforeCyr: cyr, afterCyr: cyr };
    totalBefore += cyr;
  }
  const normOld = oldStr.replace(/\r\n/g, '\n');
  const normNew = newStr.replace(/\r\n/g, '\n');
  const pos = processed[file].content.indexOf(normOld);
  if (pos !== -1) {
    const c = processed[file].content;
    processed[file].content = c.slice(0, pos) + normNew + c.slice(pos + normOld.length);
  } else {
    console.log(`  NOT FOUND: ${file}: "${oldStr.substring(0, 60)}..."`);
  }
}

for (const [file, data] of Object.entries(processed)) {
  const afterCyr = (data.content.match(/[А-яЁё]/g) || []).length;
  data.afterCyr = afterCyr;
  totalAfter += afterCyr;
  // Restore CRLF
  data.content = data.content.replace(/\n/g, '\r\n');
  fs.writeFileSync(path.resolve(root, file), data.content, 'utf-8');
  const removed = data.beforeCyr - afterCyr;
  if (removed > 0) {
    console.log(`${file}: ${data.beforeCyr} -> ${afterCyr} Cyrillic (-${removed})`);
  }
}
console.log(`\nTotal: ${totalBefore} -> ${totalAfter} Cyrillic (${totalBefore - totalAfter} removed)`);
