/**
 * SQL Training Tasks Definitions
 * Comprehensive set of tasks organized by difficulty level.
 */

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type DbType = 'sqlite' | 'postgresql';

export interface TrainingTask {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  dbType: DbType;
  schema: string;
  taskText: string;
  hint: string;
  sampleSolution: string;
  verificationQuery: string;
}

// Shared schema for employees database
const EMPLOYEES_SCHEMA = `
CREATE TABLE departments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  location TEXT,
  budget REAL
);

CREATE TABLE employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE,
  department_id INTEGER,
  salary REAL,
  hire_date TEXT,
  is_active INTEGER DEFAULT 1,
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  department_id INTEGER,
  start_date TEXT,
  end_date TEXT,
  status TEXT DEFAULT 'active',
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE assignments (
  employee_id INTEGER,
  project_id INTEGER,
  role TEXT,
  hours_worked INTEGER,
  PRIMARY KEY (employee_id, project_id),
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Departments
INSERT INTO departments (id, name, location, budget) VALUES (1, 'Разработка', 'Москва', 5000000);
INSERT INTO departments (id, name, location, budget) VALUES (2, 'Маркетинг', 'Санкт-Петербург', 3000000);
INSERT INTO departments (id, name, location, budget) VALUES (3, 'Продажи', 'Казань', 2500000);
INSERT INTO departments (id, name, location, budget) VALUES (4, 'HR', 'Москва', 1500000);
INSERT INTO departments (id, name, location, budget) VALUES (5, 'Финансы', 'Москва', 2000000);

-- Employees
INSERT INTO employees (id, first_name, last_name, email, department_id, salary, hire_date, is_active) VALUES (1, 'Иван', 'Петров', 'ivan@company.ru', 1, 150000, '2020-03-15', 1);
INSERT INTO employees (id, first_name, last_name, email, department_id, salary, hire_date, is_active) VALUES (2, 'Мария', 'Сидорова', 'maria@company.ru', 1, 140000, '2020-06-01', 1);
INSERT INTO employees (id, first_name, last_name, email, department_id, salary, hire_date, is_active) VALUES (3, 'Алексей', 'Козлов', 'alexey@company.ru', 1, 160000, '2019-11-20', 1);
INSERT INTO employees (id, first_name, last_name, email, department_id, salary, hire_date, is_active) VALUES (4, 'Елена', 'Новикова', 'elena@company.ru', 2, 120000, '2021-01-10', 1);
INSERT INTO employees (id, first_name, last_name, email, department_id, salary, hire_date, is_active) VALUES (5, 'Дмитрий', 'Волков', 'dmitry@company.ru', 2, 110000, '2021-04-22', 1);
INSERT INTO employees (id, first_name, last_name, email, department_id, salary, hire_date, is_active) VALUES (6, 'Ольга', 'Морозова', 'olga@company.ru', 3, 130000, '2020-08-15', 1);
INSERT INTO employees (id, first_name, last_name, email, department_id, salary, hire_date, is_active) VALUES (7, 'Сергей', 'Лебедев', 'sergey@company.ru', 3, 125000, '2020-09-01', 1);
INSERT INTO employees (id, first_name, last_name, email, department_id, salary, hire_date, is_active) VALUES (8, 'Анна', 'Соколова', 'anna@company.ru', 4, 100000, '2022-02-14', 1);
INSERT INTO employees (id, first_name, last_name, email, department_id, salary, hire_date, is_active) VALUES (9, 'Николай', 'Кузнецов', 'nikolay@company.ru', 4, 95000, '2022-03-20', 1);
INSERT INTO employees (id, first_name, last_name, email, department_id, salary, hire_date, is_active) VALUES (10, 'Виктория', 'Попова', 'victoria@company.ru', 5, 135000, '2019-07-10', 1);
INSERT INTO employees (id, first_name, last_name, email, department_id, salary, hire_date, is_active) VALUES (11, 'Павел', 'Васильев', 'pavel@company.ru', 1, 145000, '2021-05-15', 1);
INSERT INTO employees (id, first_name, last_name, email, department_id, salary, hire_date, is_active) VALUES (12, 'Татьяна', 'Зайцева', 'tatiana@company.ru', 1, 130000, '2021-08-01', 1);
INSERT INTO employees (id, first_name, last_name, email, department_id, salary, hire_date, is_active) VALUES (13, 'Андрей', 'Павлов', 'andrey@company.ru', 2, 105000, '2022-01-05', 0);
INSERT INTO employees (id, first_name, last_name, email, department_id, salary, hire_date, is_active) VALUES (14, 'Юлия', 'Семенова', 'julia@company.ru', 2, 115000, '2021-10-10', 1);
INSERT INTO employees (id, first_name, last_name, email, department_id, salary, hire_date, is_active) VALUES (15, 'Роман', 'Голубев', 'roman@company.ru', 3, 120000, '2020-12-01', 1);
INSERT INTO employees (id, first_name, last_name, email, department_id, salary, hire_date, is_active) VALUES (16, 'Екатерина', 'Виноградова', 'ekaterina@company.ru', 3, 128000, '2020-07-20', 1);
INSERT INTO employees (id, first_name, last_name, email, department_id, salary, hire_date, is_active) VALUES (17, 'Максим', 'Богданов', 'maxim@company.ru', 4, 98000, '2022-06-15', 1);
INSERT INTO employees (id, first_name, last_name, email, department_id, salary, hire_date, is_active) VALUES (18, 'Ксения', 'Воробьёва', 'ksenia@company.ru', 5, 140000, '2019-09-25', 1);
INSERT INTO employees (id, first_name, last_name, email, department_id, salary, hire_date, is_active) VALUES (19, 'Артём', 'Филиппов', 'artem@company.ru', 1, 155000, '2019-04-10', 1);
INSERT INTO employees (id, first_name, last_name, email, department_id, salary, hire_date, is_active) VALUES (20, 'Дарья', 'Давыдова', 'daria@company.ru', 5, 125000, '2021-11-30', 0);
INSERT INTO employees (id, first_name, last_name, email, department_id, salary, hire_date, is_active) VALUES (21, 'Игорь', 'Белых', 'igor@company.ru', 1, 148000, '2020-01-15', 1);
INSERT INTO employees (id, first_name, last_name, email, department_id, salary, hire_date, is_active) VALUES (22, 'Наталья', 'Тарасова', 'natalia@company.ru', 2, 118000, '2021-03-10', 1);
INSERT INTO employees (id, first_name, last_name, email, department_id, salary, hire_date, is_active) VALUES (23, 'Владимир', 'Орлов', 'vladimir@company.ru', 3, 132000, '2020-05-22', 1);
INSERT INTO employees (id, first_name, last_name, email, department_id, salary, hire_date, is_active) VALUES (24, 'Светлана', 'Киселёва', 'svetlana@company.ru', 4, 102000, '2022-04-01', 1);

-- Projects
INSERT INTO projects (id, name, department_id, start_date, end_date, status) VALUES (1, 'Веб-платформа', 1, '2023-01-15', '2023-08-30', 'completed');
INSERT INTO projects (id, name, department_id, start_date, end_date, status) VALUES (2, 'Мобильное приложение', 1, '2023-06-01', NULL, 'active');
INSERT INTO projects (id, name, department_id, start_date, end_date, status) VALUES (3, 'Рекламная кампания Q1', 2, '2023-01-01', '2023-03-31', 'completed');
INSERT INTO projects (id, name, department_id, start_date, end_date, status) VALUES (4, 'Бренд-стратегия', 2, '2023-04-15', NULL, 'active');
INSERT INTO projects (id, name, department_id, start_date, end_date, status) VALUES (5, 'CRM интеграция', 3, '2023-02-01', '2023-07-15', 'completed');
INSERT INTO projects (id, name, department_id, start_date, end_date, status) VALUES (6, 'Обучение персонала', 4, '2023-03-01', NULL, 'active');
INSERT INTO projects (id, name, department_id, start_date, end_date, status) VALUES (7, 'Аудит расходов', 5, '2023-01-15', '2023-04-30', 'completed');
INSERT INTO projects (id, name, department_id, start_date, end_date, status) VALUES (8, 'API Gateway', 1, '2023-07-01', NULL, 'active');

-- Assignments
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (1, 1, 'Ведущий разработчик', 320);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (2, 1, 'Фронтенд-разработчик', 280);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (3, 1, 'Архитектор', 200);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (3, 2, 'Архитектор', 150);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (11, 2, 'Backend-разработчик', 180);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (12, 2, 'Фронтенд-разработчик', 200);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (19, 2, 'Ведущий разработчик', 220);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (21, 2, 'Backend-разработчик', 160);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (4, 3, 'Маркетолог', 150);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (5, 3, 'Дизайнер', 120);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (14, 4, 'Маркетолог', 100);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (22, 4, 'Копирайтер', 80);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (4, 4, 'Маркетолог', 60);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (6, 5, 'Менеджер проекта', 180);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (7, 5, 'Аналитик', 160);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (15, 5, 'Разработчик', 200);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (16, 5, 'Тестировщик', 120);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (23, 5, 'Разработчик', 180);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (8, 6, 'HR-менеджер', 100);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (9, 6, 'HR-специалист', 80);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (17, 6, 'HR-специалист', 90);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (10, 7, 'Финансовый аналитик', 140);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (18, 7, 'Бухгалтер', 120);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (1, 8, 'Ведущий разработчик', 80);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (19, 8, 'Ведущий разработчик', 80);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (11, 8, 'Backend-разработчик', 60);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (21, 8, 'Backend-разработчик', 60);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (13, 1, 'Фронтенд-разработчик', 150);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (20, 3, 'Ассистент', 50);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (24, 6, 'HR-специалист', 70);
`;

// Schema for INSERT/UPDATE/DELETE exercises — starts empty
const EMPTY_ORDERS_SCHEMA = `
CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  stock INTEGER DEFAULT 0
);

CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  order_date TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

INSERT INTO products (id, name, price, stock) VALUES (1, 'Ноутбук', 75000, 10);
INSERT INTO products (id, name, price, stock) VALUES (2, 'Мышь', 1500, 50);
INSERT INTO products (id, name, price, stock) VALUES (3, 'Клавиатура', 3000, 30);
INSERT INTO products (id, name, price, stock) VALUES (4, 'Монитор', 25000, 15);
INSERT INTO products (id, name, price, stock) VALUES (5, 'Наушники', 5000, 40);
`;

// Schema for INDEX demonstration
const INDEX_DEMO_SCHEMA = `
CREATE TABLE books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  genre TEXT,
  published_year INTEGER,
  pages INTEGER,
  rating REAL
);

INSERT INTO books (id, title, author, genre, published_year, pages, rating) VALUES (1, 'Война и мир', 'Толстой', 'роман', 1869, 1225, 4.8);
INSERT INTO books (id, title, author, genre, published_year, pages, rating) VALUES (2, 'Преступление и наказание', 'Достоевский', 'роман', 1866, 671, 4.7);
INSERT INTO books (id, title, author, genre, published_year, pages, rating) VALUES (3, 'Мастер и Маргарита', 'Булгаков', 'роман', 1967, 480, 4.9);
INSERT INTO books (id, title, author, genre, published_year, pages, rating) VALUES (4, 'Евгений Онегин', 'Пушкин', 'поэма', 1833, 224, 4.6);
INSERT INTO books (id, title, author, genre, published_year, pages, rating) VALUES (5, 'Герой нашего времени', 'Лермонтов', 'роман', 1840, 210, 4.5);
INSERT INTO books (id, title, author, genre, published_year, pages, rating) VALUES (6, 'Анна Каренина', 'Толстой', 'роман', 1877, 864, 4.7);
INSERT INTO books (id, title, author, genre, published_year, pages, rating) VALUES (7, 'Идиот', 'Достоевский', 'роман', 1869, 640, 4.4);
INSERT INTO books (id, title, author, genre, published_year, pages, rating) VALUES (8, 'Отцы и дети', 'Тургенев', 'роман', 1862, 224, 4.3);
INSERT INTO books (id, title, author, genre, published_year, pages, rating) VALUES (9, 'Мёртвые души', 'Гоголь', 'поэма', 1842, 349, 4.5);
INSERT INTO books (id, title, author, genre, published_year, pages, rating) VALUES (10, 'Обломов', 'Гончаров', 'роман', 1859, 496, 4.2);
INSERT INTO books (id, title, author, genre, published_year, pages, rating) VALUES (11, 'Тихий Дон', 'Шолохов', 'роман', 1940, 1888, 4.6);
INSERT INTO books (id, title, author, genre, published_year, pages, rating) VALUES (12, 'Доктор Живаго', 'Пастернак', 'роман', 1957, 560, 4.4);
`;

export const TRAINING_TASKS: TrainingTask[] = [
  // ==================== BEGINNER TASKS ====================
  {
    id: 'beginner-1',
    title: 'Базовый SELECT',
    description: 'Выбрать все столбцы из таблицы',
    difficulty: 'beginner',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText: 'Выведите все данные из таблицы departments (все столбцы, все строки).',
    hint: 'Используйте SELECT * FROM для выбора всех столбцов.',
    sampleSolution: 'SELECT * FROM departments;',
    verificationQuery: 'SELECT COUNT(*) as count FROM departments;',
  },
  {
    id: 'beginner-2',
    title: 'Выбор столбцов',
    description: 'Выбрать конкретные столбцы из таблицы',
    difficulty: 'beginner',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText: 'Выведите имена (first_name) и фамилии (last_name) всех сотрудников из таблицы employees.',
    hint: 'Перечислите нужные столбцы через запятую после SELECT.',
    sampleSolution: 'SELECT first_name, last_name FROM employees;',
    verificationQuery: 'SELECT COUNT(*) as count FROM employees;',
  },
  {
    id: 'beginner-3',
    title: 'Фильтрация WHERE',
    description: 'Отфильтровать строки с помощью WHERE',
    difficulty: 'beginner',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText: 'Найдите всех сотрудников с зарплатой больше 130000. Выведите их first_name, last_name и salary.',
    hint: 'Используйте WHERE с оператором сравнения >.',
    sampleSolution: 'SELECT first_name, last_name, salary FROM employees WHERE salary > 130000;',
    verificationQuery: 'SELECT COUNT(*) as count FROM employees WHERE salary > 130000;',
  },
  {
    id: 'beginner-4',
    title: 'Сортировка ORDER BY',
    description: 'Отсортировать результаты по столбцу',
    difficulty: 'beginner',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText: 'Выведите список сотрудников (first_name, last_name, salary), отсортированный по зарплате по убыванию.',
    hint: 'Используйте ORDER BY с DESC для сортировки по убыванию.',
    sampleSolution: 'SELECT first_name, last_name, salary FROM employees ORDER BY salary DESC;',
    verificationQuery: 'SELECT MAX(salary) as max_salary FROM employees;',
  },
  {
    id: 'beginner-5',
    title: 'Ограничение результатов LIMIT',
    description: 'Ограничить количество выводимых строк',
    difficulty: 'beginner',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText: 'Выведите 5 самых высокооплачиваемых сотрудников (first_name, last_name, salary).',
    hint: 'Комбинируйте ORDER BY для сортировки и LIMIT для ограничения.',
    sampleSolution: 'SELECT first_name, last_name, salary FROM employees ORDER BY salary DESC LIMIT 5;',
    verificationQuery: 'SELECT salary FROM employees ORDER BY salary DESC LIMIT 1;',
  },
  {
    id: 'beginner-6',
    title: 'Уникальные значения DISTINCT',
    description: 'Получить уникальные значения столбца',
    difficulty: 'beginner',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText: 'Получите список всех уникальных городов (location) из таблицы departments.',
    hint: 'Используйте DISTINCT перед именем столбца.',
    sampleSolution: 'SELECT DISTINCT location FROM departments;',
    verificationQuery: 'SELECT COUNT(DISTINCT location) as count FROM departments;',
  },
  {
    id: 'beginner-7',
    title: 'Агрегатные функции COUNT и SUM',
    description: 'Использовать агрегатные функции для вычислений',
    difficulty: 'beginner',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText: 'Посчитайте общее количество сотрудников и сумму всех зарплат в компании.',
    hint: 'Используйте COUNT(*) для подсчёта строк и SUM(column) для суммы.',
    sampleSolution: 'SELECT COUNT(*) as total_employees, SUM(salary) as total_salary FROM employees;',
    verificationQuery: 'SELECT COUNT(*) as total_employees FROM employees;',
  },
  {
    id: 'beginner-8',
    title: 'Среднее значение AVG',
    description: 'Вычислить среднее значение столбца',
    difficulty: 'beginner',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText: 'Вычислите среднюю зарплату сотрудников для каждого отдела. Выведите department_id и среднюю зарплату.',
    hint: 'Используйте AVG() с GROUP BY по department_id.',
    sampleSolution: 'SELECT department_id, AVG(salary) as avg_salary FROM employees GROUP BY department_id;',
    verificationQuery: 'SELECT COUNT(DISTINCT department_id) as dept_count FROM employees WHERE department_id IS NOT NULL;',
  },

  // ==================== INTERMEDIATE TASKS ====================
  {
    id: 'intermediate-1',
    title: 'INNER JOIN',
    description: 'Соединить две таблицы с INNER JOIN',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText: 'Выведите имена сотрудников (first_name, last_name) и названия их отделов (name). Используйте INNER JOIN.',
    hint: 'Соедините employees с departments по department_id.',
    sampleSolution: 'SELECT e.first_name, e.last_name, d.name as department_name FROM employees e INNER JOIN departments d ON e.department_id = d.id;',
    verificationQuery: 'SELECT COUNT(*) as count FROM employees e INNER JOIN departments d ON e.department_id = d.id;',
  },
  {
    id: 'intermediate-2',
    title: 'LEFT JOIN',
    description: 'Соединить таблицы с LEFT JOIN',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText: 'Выведите все отделы и количество сотрудников в каждом. Включите отделы, где нет сотрудников (количество = 0).',
    hint: 'Используйте LEFT JOIN сотрудников с отделами и COUNT.',
    sampleSolution: 'SELECT d.name as department_name, COUNT(e.id) as employee_count FROM departments d LEFT JOIN employees e ON d.id = e.department_id GROUP BY d.id, d.name ORDER BY employee_count DESC;',
    verificationQuery: 'SELECT COUNT(*) as count FROM departments;',
  },
  {
    id: 'intermediate-3',
    title: 'GROUP BY с HAVING',
    description: 'Фильтрация сгруппированных данных',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText: 'Найдите отделы, в которых средняя зарплата больше 125000. Выведите название отдела и среднюю зарплату.',
    hint: 'GROUP BY + HAVING позволяет фильтровать по результатам агрегатных функций.',
    sampleSolution: 'SELECT d.name, AVG(e.salary) as avg_salary FROM employees e JOIN departments d ON e.department_id = d.id GROUP BY d.id, d.name HAVING AVG(e.salary) > 125000;',
    verificationQuery: 'SELECT COUNT(*) as count FROM (SELECT d.id FROM employees e JOIN departments d ON e.department_id = d.id GROUP BY d.id HAVING AVG(e.salary) > 125000);',
  },
  {
    id: 'intermediate-4',
    title: 'Подзапросы',
    description: 'Использовать подзапрос в WHERE',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText: 'Найдите сотрудников, чья зарплата выше средней по компании. Выведите first_name, last_name и salary.',
    hint: 'Подзапрос AVG(salary) FROM employees вернёт среднюю зарплату.',
    sampleSolution: 'SELECT first_name, last_name, salary FROM employees WHERE salary > (SELECT AVG(salary) FROM employees);',
    verificationQuery: 'SELECT COUNT(*) as count FROM employees WHERE salary > (SELECT AVG(salary) FROM employees);',
  },
  {
    id: 'intermediate-5',
    title: 'CASE WHEN',
    description: 'Условное выражение в SELECT',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText: 'Для каждого сотрудника выведите first_name, last_name, salary и категорию зарплаты: "Высокая" (>=140000), "Средняя" (>=110000 и <140000), "Низкая" (<110000).',
    hint: 'Используйте CASE WHEN ... THEN ... ELSE ... END.',
    sampleSolution: "SELECT first_name, last_name, salary, CASE WHEN salary >= 140000 THEN 'Высокая' WHEN salary >= 110000 THEN 'Средняя' ELSE 'Низкая' END as salary_category FROM employees;",
    verificationQuery: "SELECT COUNT(*) as count FROM employees WHERE salary >= 140000;",
  },
  {
    id: 'intermediate-6',
    title: 'Функции работы со строками',
    description: 'Конкатенация и преобразование строк',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText: 'Создайте список сотрудников в формате "Фамилия И. (email)". Используйте SUBSTR для инициала имени.',
    hint: 'SUBSTR(string, 1, 1) извлечёт первый символ. || — оператор конкатенации.',
    sampleSolution: "SELECT last_name || ' ' || SUBSTR(first_name, 1, 1) || '. (' || email || ')' as contact_info FROM employees WHERE email IS NOT NULL;",
    verificationQuery: 'SELECT COUNT(*) as count FROM employees WHERE email IS NOT NULL;',
  },
  {
    id: 'intermediate-7',
    title: 'Множественные условия WHERE',
    description: 'Комбинирование условий с AND, OR, IN, BETWEEN',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText: 'Найдите активных сотрудников (is_active = 1) из отделов "Разработка" (id=1) или "Маркетинг" (id=2) с зарплатой от 110000 до 145000.',
    hint: 'Используйте AND, OR и BETWEEN для комбинирования условий.',
    sampleSolution: "SELECT first_name, last_name, salary FROM employees WHERE is_active = 1 AND department_id IN (1, 2) AND salary BETWEEN 110000 AND 145000 ORDER BY salary DESC;",
    verificationQuery: "SELECT COUNT(*) as count FROM employees WHERE is_active = 1 AND department_id IN (1, 2) AND salary BETWEEN 110000 AND 145000;",
  },
  {
    id: 'intermediate-8',
    title: 'Множественный JOIN',
    description: 'Соединение трёх и более таблиц',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText: 'Выведите имя сотрудника, название проекта и роль в проекте. Включите только активные сотрудники.',
    hint: 'Соедините employees, assignments и projects через два JOIN.',
    sampleSolution: 'SELECT e.first_name, e.last_name, p.name as project_name, a.role FROM employees e JOIN assignments a ON e.id = a.employee_id JOIN projects p ON a.project_id = p.id WHERE e.is_active = 1 ORDER BY p.name, e.last_name;',
    verificationQuery: 'SELECT COUNT(*) as count FROM employees e JOIN assignments a ON e.id = a.employee_id JOIN projects p ON a.project_id = p.id WHERE e.is_active = 1;',
  },

  // ==================== ADVANCED TASKS ====================
  {
    id: 'advanced-1',
    title: 'Оконные функции — ROW_NUMBER',
    description: 'Нумерация строк с помощью ROW_NUMBER',
    difficulty: 'advanced',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText: 'Присвойте каждому сотруднику ранг по зарплате внутри своего отдела (1 — самая высокая зарплата). Выведите: department_id, first_name, last_name, salary, rank.',
    hint: 'ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY salary DESC).',
    sampleSolution: 'SELECT department_id, first_name, last_name, salary, ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY salary DESC) as rank FROM employees WHERE department_id IS NOT NULL ORDER BY department_id, rank;',
    verificationQuery: 'SELECT COUNT(*) as count FROM employees WHERE department_id IS NOT NULL;',
  },
  {
    id: 'advanced-2',
    title: 'Оконные функции — RANK и DENSE_RANK',
    description: 'Ранжирование с пропусками и без',
    difficulty: 'advanced',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText: 'Выведите отделы, общее количество часов работы по отделу и долю каждого проекта в общих часах отдела. Используйте SUM() с оконной функцией.',
    hint: 'SUM(hours_worked) OVER (PARTITION BY department_id) даст сумму по отделу.',
    sampleSolution: 'SELECT p.name as project_name, d.name as department_name, a.hours_worked, SUM(a.hours_worked) OVER (PARTITION BY p.department_id) as dept_total_hours, ROUND(CAST(a.hours_worked AS REAL) / SUM(a.hours_worked) OVER (PARTITION BY p.department_id) * 100, 1) as percentage FROM assignments a JOIN projects p ON a.project_id = p.id JOIN departments d ON p.department_id = d.id ORDER BY d.name, a.hours_worked DESC;',
    verificationQuery: 'SELECT COUNT(DISTINCT p.department_id) as count FROM assignments a JOIN projects p ON a.project_id = p.id;',
  },
  {
    id: 'advanced-3',
    title: 'CTE (WITH clause)',
    description: 'Общие табличные выражения',
    difficulty: 'advanced',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText: 'Используя CTE, найдите отделы, где суммарный бюджет отдела больше суммарной зарплаты всех его сотрудников.',
    hint: 'Создайте CTE с суммой зарплат по отделам, затем JOIN с departments.',
    sampleSolution: 'WITH dept_salaries AS (SELECT department_id, SUM(salary) as total_salary FROM employees WHERE department_id IS NOT NULL GROUP BY department_id) SELECT d.name, d.budget, ds.total_salary, d.budget - ds.total_salary as surplus FROM departments d JOIN dept_salaries ds ON d.id = ds.department_id WHERE d.budget > ds.total_salary;',
    verificationQuery: 'SELECT COUNT(*) as count FROM (SELECT d.id FROM departments d JOIN (SELECT department_id, SUM(salary) as total_salary FROM employees WHERE department_id IS NOT NULL GROUP BY department_id) ds ON d.id = ds.department_id WHERE d.budget > ds.total_salary);',
  },
  {
    id: 'advanced-4',
    title: 'Рекурсивный CTE',
    description: 'Рекурсивные запросы для иерархических данных',
    difficulty: 'advanced',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText: 'Создайте рекурсивный CTE, который генерирует таблицу чисел от 1 до 10, и для каждого числа выведите его квадрат и куб.',
    hint: 'Базовый случай: SELECT 1 as n. Рекурсия: SELECT n+1 FROM cte WHERE n < 10.',
    sampleSolution: 'WITH RECURSIVE numbers AS (SELECT 1 as n UNION ALL SELECT n + 1 FROM numbers WHERE n < 10) SELECT n, n * n as square, n * n * n as cube FROM numbers;',
    verificationQuery: 'SELECT 10 as expected_count;',
  },
  {
    id: 'advanced-5',
    title: 'Самосоединение (Self Join)',
    description: 'Соединение таблицы с самой собой',
    difficulty: 'advanced',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText: 'Найдите все пары сотрудников из одного отдела, у которых разница в зарплате более 5000. Выведите имена обоих сотрудников и разницу в зарплате.',
    hint: 'Соедините employees с самой же таблицей по department_id, но с разными алиасами. Исключите совпадения и дубликаты.',
    sampleSolution: 'SELECT e1.first_name as emp1_name, e1.last_name as emp1_last, e2.first_name as emp2_name, e2.last_name as emp2_last, ABS(e1.salary - e2.salary) as salary_diff FROM employees e1 JOIN employees e2 ON e1.department_id = e2.department_id AND e1.id < e2.id WHERE ABS(e1.salary - e2.salary) > 5000 ORDER BY salary_diff DESC;',
    verificationQuery: 'SELECT COUNT(*) as count FROM employees e1 JOIN employees e2 ON e1.department_id = e2.department_id AND e1.id < e2.id WHERE ABS(e1.salary - e2.salary) > 5000;',
  },
  {
    id: 'advanced-6',
    title: 'Сложный запрос с подзапросами',
    description: 'Комбинация подзапросов и JOIN',
    difficulty: 'advanced',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText: 'Найдите сотрудников, которые работают над завершёнными проектами и при этом трудились больше 150 часов. Выведите имя сотрудника, название проекта, роль и часы.',
    hint: 'Подзапрос для завершённых проектов, затем JOIN с assignments и employees.',
    sampleSolution: "SELECT e.first_name, e.last_name, p.name as project_name, a.role, a.hours_worked FROM employees e JOIN assignments a ON e.id = a.employee_id JOIN projects p ON a.project_id = p.id WHERE p.status = 'completed' AND a.hours_worked > 150 ORDER BY a.hours_worked DESC;",
    verificationQuery: "SELECT COUNT(*) as count FROM employees e JOIN assignments a ON e.id = a.employee_id JOIN projects p ON a.project_id = p.id WHERE p.status = 'completed' AND a.hours_worked > 150;",
  },
  {
    id: 'advanced-7',
    title: 'Несколько CTE и аналитика',
    description: 'Многоуровневые CTE с оконными функциями',
    difficulty: 'advanced',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText: 'Для каждого отдела выведите: название, кол-во сотрудников, среднюю зарплату, сотрудника с максимальной зарплатой и общее количество часов по проектам отдела.',
    hint: 'Используйте несколько CTE: один для статистики по сотрудникам, другой для часов по проектам.',
    sampleSolution: 'WITH emp_stats AS (SELECT department_id, COUNT(*) as emp_count, AVG(salary) as avg_salary, MAX(salary) as max_salary FROM employees WHERE department_id IS NOT NULL GROUP BY department_id), top_earners AS (SELECT e.department_id, e.first_name, e.last_name, e.salary, ROW_NUMBER() OVER (PARTITION BY e.department_id ORDER BY e.salary DESC) as rn FROM employees e WHERE e.department_id IS NOT NULL), project_hours AS (SELECT p.department_id, SUM(a.hours_worked) as total_hours FROM projects p JOIN assignments a ON p.id = a.project_id GROUP BY p.department_id) SELECT d.name as department, es.emp_count, ROUND(es.avg_salary) as avg_salary, te.first_name || \' \' || te.last_name as top_earner, te.salary as top_salary, COALESCE(ph.total_hours, 0) as total_project_hours FROM departments d LEFT JOIN emp_stats es ON d.id = es.department_id LEFT JOIN top_earners te ON d.id = te.department_id AND te.rn = 1 LEFT JOIN project_hours ph ON d.id = ph.department_id ORDER BY es.emp_count DESC;',
    verificationQuery: 'SELECT COUNT(*) as count FROM departments;',
  },
  {
    id: 'advanced-8',
    title: 'HAVING vs WHERE и NULL обработка',
    description: 'Фильтрация NULL значений и сложная агрегация',
    difficulty: 'advanced',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText: 'Найдите проекты, в которых участвуют сотрудники из 3 и более разных отделов. Выведите название проекта и количество уникальных отделов.',
    hint: 'JOIN projects → assignments → employees, GROUP BY project, HAVING COUNT(DISTINCT department_id) >= 3.',
    sampleSolution: 'SELECT p.name as project_name, COUNT(DISTINCT e.department_id) as dept_count FROM projects p JOIN assignments a ON p.id = a.project_id JOIN employees e ON a.employee_id = e.id GROUP BY p.id, p.name HAVING COUNT(DISTINCT e.department_id) >= 3;',
    verificationQuery: 'SELECT 0 as expected_count;',
  },

  // ==================== NEW TOPIC TASKS ====================
  {
    id: 'intermediate-9',
    title: 'Объединение UNION',
    description: 'Объединить результаты двух запросов с UNION',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText: 'Получите список всех уникальных имён из first_name и location из departments. Выведите один столбец name.',
    hint: 'Используйте UNION для объединения двух SELECT с алиасом name.',
    sampleSolution: "SELECT first_name as name FROM employees UNION SELECT location as name FROM departments;",
    verificationQuery: 'SELECT COUNT(*) as count FROM (SELECT first_name as name FROM employees UNION SELECT location as name FROM departments);',
  },
  {
    id: 'intermediate-10',
    title: 'INTERSECT и EXCEPT',
    description: 'Найти пересечение и разность множеств',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText: 'Найдите сотрудников, которые НЕ участвуют ни в одном проекте. Выведите first_name и last_name.',
    hint: 'Используйте EXCEPT: все сотрудники MINUS сотрудники в проектах.',
    sampleSolution: 'SELECT first_name, last_name FROM employees EXCEPT SELECT e.first_name, e.last_name FROM employees e JOIN assignments a ON e.id = a.employee_id;',
    verificationQuery: 'SELECT COUNT(*) as count FROM employees e WHERE e.id NOT IN (SELECT a.employee_id FROM assignments a);',
  },
  {
    id: 'intermediate-11',
    title: 'INSERT, UPDATE, DELETE',
    description: 'Вставка, обновление и удаление данных',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    schema: EMPTY_ORDERS_SCHEMA,
    taskText: 'Добавьте новый заказ: продукт "Мышь" (product_id=2), количество 3, дата "2024-01-15", покупатель "Иванов". Затем обновите stock у продукта "Мышь" (уменьшите на 3). Выведите итоговый stock продукта "Мышь".',
    hint: 'Сначала INSERT INTO orders, затем UPDATE products SET stock = stock - 3, затем SELECT stock FROM products WHERE id = 2.',
    sampleSolution: "INSERT INTO orders (product_id, quantity, order_date, customer_name) VALUES (2, 3, '2024-01-15', 'Иванов'); UPDATE products SET stock = stock - 3 WHERE id = 2; SELECT stock FROM products WHERE id = 2;",
    verificationQuery: 'SELECT stock FROM products WHERE id = 2;',
  },
  {
    id: 'advanced-9',
    title: 'Представления (VIEW)',
    description: 'Создание и использование VIEW',
    difficulty: 'advanced',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText: 'Создайте представление active_employees, которое показывает только активных сотрудников (is_active = 1). Затем выберите все данные из этого представления.',
    hint: 'CREATE VIEW name AS SELECT ... FROM ... WHERE is_active = 1, затем SELECT * FROM name.',
    sampleSolution: 'CREATE VIEW active_employees AS SELECT * FROM employees WHERE is_active = 1; SELECT * FROM active_employees;',
    verificationQuery: 'SELECT COUNT(*) as count FROM employees WHERE is_active = 1;',
  },
  {
    id: 'advanced-10',
    title: 'Индексы (INDEX)',
    description: 'Создание и использование индексов',
    difficulty: 'advanced',
    dbType: 'sqlite',
    schema: INDEX_DEMO_SCHEMA,
    taskText: 'Создайте индекс idx_books_author на таблице books по столбцу author. Затем создайте составной индекс idx_books_genre_year по genre и published_year. Выведите все индексы для таблицы books.',
    hint: 'CREATE INDEX idx_name ON table(column). Для просмотра: SELECT * FROM sqlite_master WHERE type="index" AND tbl_name="books".',
    sampleSolution: "CREATE INDEX idx_books_author ON books(author); CREATE INDEX idx_books_genre_year ON books(genre, published_year); SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='books';",
    verificationQuery: "SELECT COUNT(*) as count FROM sqlite_master WHERE type='index' AND tbl_name='books';",
  },
  {
    id: 'intermediate-12',
    title: 'FULL OUTER JOIN',
    description: 'Полное внешнее соединение таблиц',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText: 'Выведите все отделы и всех сотрудников, включая отделы без сотрудников и сотрудников без отдела. Используйте FULL OUTER JOIN эмуляцию через UNION двух LEFT/RIGHT JOIN. Выведите department_name и employee_name (first_name).',
    hint: 'SQLite не поддерживает FULL OUTER JOIN. Эмулируйте: LEFT JOIN UNION RIGHT JOIN с COALESCE.',
    sampleSolution: "SELECT d.name as department_name, e.first_name as employee_name FROM departments d LEFT JOIN employees e ON d.id = e.department_id UNION SELECT d.name, e.first_name FROM employees e LEFT JOIN departments d ON e.department_id = d.id;",
    verificationQuery: 'SELECT COUNT(*) as count FROM departments UNION ALL SELECT first_name FROM employees;',
  },
  {
    id: 'intermediate-13',
    title: 'CROSS JOIN',
    description: 'Декартово произведение таблиц',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText: 'Создайте все возможные комбинации отделов и проектов (декартово произведение). Выведите название отдела и название проекта, отсортируйте по названию отдела.',
    hint: 'CROSS JOIN создаёт все комбинации строк двух таблиц.',
    sampleSolution: 'SELECT d.name as department_name, p.name as project_name FROM departments d CROSS JOIN projects p ORDER BY d.name, p.name;',
    verificationQuery: 'SELECT COUNT(*) as count FROM departments CROSS JOIN projects;',
  },
  {
    id: 'advanced-11',
    title: 'Коррелированный подзапрос с EXISTS',
    description: 'Подзапрос, зависящий от внешнего запроса',
    difficulty: 'advanced',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText: 'Найдите отделы, в которых есть сотрудники с зарплатой больше 140000. Выведите название отдела. Используйте EXISTS.',
    hint: 'EXISTS (SELECT 1 FROM employees WHERE department_id = departments.id AND salary > 140000).',
    sampleSolution: "SELECT d.name FROM departments d WHERE EXISTS (SELECT 1 FROM employees e WHERE e.department_id = d.id AND e.salary > 140000);",
    verificationQuery: "SELECT COUNT(*) as count FROM departments d WHERE EXISTS (SELECT 1 FROM employees e WHERE e.department_id = d.id AND e.salary > 140000);",
  },
];

export function getTasksByDifficulty(difficulty: Difficulty): TrainingTask[] {
  return TRAINING_TASKS.filter((t) => t.difficulty === difficulty);
}

export function getTaskById(id: string): TrainingTask | undefined {
  return TRAINING_TASKS.find((t) => t.id === id);
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: 'Начальный',
  intermediate: 'Средний',
  advanced: 'Продвинутый',
};

export const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  beginner: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  intermediate: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  advanced: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};
