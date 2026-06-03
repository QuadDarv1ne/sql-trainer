/**
 * Intermediate Task Definitions
 * Auto-generated from training-tasks.ts
 */

import type { TrainingTask } from './types';
import {
  ANALYTICS_SCHEMA,
  CLICKHOUSE_EVENTS_SCHEMA,
  EMPLOYEES_SCHEMA,
  EMPTY_ORDERS_SCHEMA,
  SHOP_SCHEMA,
} from './schemas';

export const INTERMEDIATE_TASKS: TrainingTask[] = [
  // ==================== INTERMEDIATE TASKS ====================
  {
    id: 'intermediate-1',
    title: 'INNER JOIN',
    description: 'Соединить две таблицы с INNER JOIN',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Выведите имена сотрудников (first_name, last_name) и названия их отделов (name). Используйте INNER JOIN.',
    hint: 'INNER JOIN соединяет строки двух таблиц по совпадению ключей. Только строки, где есть совпадение в обеих таблицах, попадут в результат. Алиасы (e, d) сокращают запись: employees e, departments d.',
    sampleSolution:
      'SELECT e.first_name, e.last_name, d.name as department_name FROM employees e INNER JOIN departments d ON e.department_id = d.id;',
    verificationQuery: 'SELECT COUNT(*) as count FROM employees e INNER JOIN departments d ON e.department_id = d.id;',
  },

  {
    id: 'intermediate-2',
    title: 'LEFT JOIN',
    description: 'Соединить таблицы с LEFT JOIN',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Выведите все отделы и количество сотрудников в каждом. Включите отделы, где нет сотрудников (количество = 0).',
    hint: 'LEFT JOIN возвращает ВСЕ строки левой таблицы, даже если нет совпадения в правой. Для строк без совпадения столбцы правой таблицы будут NULL. COUNT(e.id) не считает NULL, поэтому отделы без сотрудников покажут 0.',
    sampleSolution:
      'SELECT d.name as department_name, COUNT(e.id) as employee_count FROM departments d LEFT JOIN employees e ON d.id = e.department_id GROUP BY d.id, d.name ORDER BY employee_count DESC;',
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
    sampleSolution:
      'SELECT d.name, AVG(e.salary) as avg_salary FROM employees e JOIN departments d ON e.department_id = d.id GROUP BY d.id, d.name HAVING AVG(e.salary) > 125000;',
    verificationQuery:
      'SELECT COUNT(*) as count FROM (SELECT d.id FROM employees e JOIN departments d ON e.department_id = d.id GROUP BY d.id HAVING AVG(e.salary) > 125000);',
  },

  {
    id: 'intermediate-4',
    title: 'Подзапросы',
    description: 'Использовать подзапрос в WHERE',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText: 'Найдите сотрудников, чья зарплата выше средней по компании. Выведите first_name, last_name и salary.',
    hint: 'Подзапрос в WHERE выполняется ОДИН раз и возвращает одно значение (скалярный подзапрос). Сначала вычисляется AVG(salary) для всей таблицы, затем внешний запрос сравнивает каждую зарплату с этим числом. Порядок выполнения: подзапрос → внешний запрос.',
    sampleSolution:
      'SELECT first_name, last_name, salary FROM employees WHERE salary > (SELECT AVG(salary) FROM employees);',
    verificationQuery: 'SELECT COUNT(*) as count FROM employees WHERE salary > (SELECT AVG(salary) FROM employees);',
  },

  {
    id: 'intermediate-5',
    title: 'CASE WHEN',
    description: 'Условное выражение в SELECT',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Для каждого сотрудника выведите first_name, last_name, salary и категорию зарплаты: "Высокая" (>=140000), "Средняя" (>=110000 и <140000), "Низкая" (<110000).',
    hint: 'Используйте CASE WHEN ... THEN ... ELSE ... END.',
    sampleSolution:
      "SELECT first_name, last_name, salary, CASE WHEN salary >= 140000 THEN 'Высокая' WHEN salary >= 110000 THEN 'Средняя' ELSE 'Низкая' END as salary_category FROM employees;",
    verificationQuery: 'SELECT COUNT(*) as count FROM employees WHERE salary >= 140000;',
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
    sampleSolution:
      "SELECT last_name || ' ' || SUBSTR(first_name, 1, 1) || '. (' || email || ')' as contact_info FROM employees WHERE email IS NOT NULL;",
    verificationQuery: 'SELECT COUNT(*) as count FROM employees WHERE email IS NOT NULL;',
  },

  {
    id: 'intermediate-7',
    title: 'Множественные условия WHERE',
    description: 'Комбинирование условий с AND, OR, IN, BETWEEN',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Найдите активных сотрудников (is_active = 1) из отделов "Разработка" (id=1) или "Маркетинг" (id=2) с зарплатой от 110000 до 145000.',
    hint: 'Используйте AND, OR и BETWEEN для комбинирования условий.',
    sampleSolution:
      'SELECT first_name, last_name, salary FROM employees WHERE is_active = 1 AND department_id IN (1, 2) AND salary BETWEEN 110000 AND 145000 ORDER BY salary DESC;',
    verificationQuery:
      'SELECT COUNT(*) as count FROM employees WHERE is_active = 1 AND department_id IN (1, 2) AND salary BETWEEN 110000 AND 145000;',
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
    sampleSolution:
      'SELECT e.first_name, e.last_name, p.name as project_name, a.role FROM employees e JOIN assignments a ON e.id = a.employee_id JOIN projects p ON a.project_id = p.id WHERE e.is_active = 1 ORDER BY p.name, e.last_name;',
    verificationQuery:
      'SELECT COUNT(*) as count FROM employees e JOIN assignments a ON e.id = a.employee_id JOIN projects p ON a.project_id = p.id WHERE e.is_active = 1;',
  },

  // ==================== NEW TOPIC TASKS ====================
  {
    id: 'intermediate-9',
    title: 'Объединение UNION',
    description: 'Объединить результаты двух запросов с UNION',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Получите список всех уникальных имён из first_name и location из departments. Выведите один столбец name.',
    hint: 'Используйте UNION для объединения двух SELECT с алиасом name.',
    sampleSolution: 'SELECT first_name as name FROM employees UNION SELECT location as name FROM departments;',
    verificationQuery:
      'SELECT COUNT(*) as count FROM (SELECT first_name as name FROM employees UNION SELECT location as name FROM departments);',
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
    sampleSolution:
      'SELECT first_name, last_name FROM employees EXCEPT SELECT e.first_name, e.last_name FROM employees e JOIN assignments a ON e.id = a.employee_id;',
    verificationQuery:
      'SELECT COUNT(*) as count FROM employees e WHERE e.id NOT IN (SELECT a.employee_id FROM assignments a);',
  },

  {
    id: 'intermediate-11',
    title: 'INSERT, UPDATE, DELETE',
    description: 'Вставка, обновление и удаление данных',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    schema: EMPTY_ORDERS_SCHEMA,
    taskText:
      'Добавьте новый заказ: продукт "Мышь" (product_id=2), количество 3, дата "2024-01-15", покупатель "Иванов". Затем обновите stock у продукта "Мышь" (уменьшите на 3). Выведите итоговый stock продукта "Мышь".',
    hint: 'Сначала INSERT INTO orders, затем UPDATE products SET stock = stock - 3, затем SELECT stock FROM products WHERE id = 2.',
    sampleSolution:
      "INSERT INTO orders (product_id, quantity, order_date, customer_name) VALUES (2, 3, '2024-01-15', 'Иванов'); UPDATE products SET stock = stock - 3 WHERE id = 2; SELECT stock FROM products WHERE id = 2;",
    verificationQuery: 'SELECT stock FROM products WHERE id = 2;',
  },

  {
    id: 'intermediate-12',
    title: 'FULL OUTER JOIN',
    description: 'Полное внешнее соединение таблиц',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Выведите все отделы и всех сотрудников, включая отделы без сотрудников и сотрудников без отдела. Используйте FULL OUTER JOIN эмуляцию через UNION двух LEFT/RIGHT JOIN. Выведите department_name и employee_name (first_name).',
    hint: 'SQLite не поддерживает FULL OUTER JOIN. Эмулируйте: LEFT JOIN UNION RIGHT JOIN с COALESCE.',
    sampleSolution:
      'SELECT d.name as department_name, e.first_name as employee_name FROM departments d LEFT JOIN employees e ON d.id = e.department_id UNION SELECT d.name, e.first_name FROM employees e LEFT JOIN departments d ON e.department_id = d.id;',
    verificationQuery: 'SELECT COUNT(*) as count FROM departments UNION ALL SELECT first_name FROM employees;',
  },

  {
    id: 'intermediate-13',
    title: 'CROSS JOIN',
    description: 'Декартово произведение таблиц',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Создайте все возможные комбинации отделов и проектов (декартово произведение). Выведите название отдела и название проекта, отсортируйте по названию отдела.',
    hint: 'CROSS JOIN создаёт все комбинации строк двух таблиц.',
    sampleSolution:
      'SELECT d.name as department_name, p.name as project_name FROM departments d CROSS JOIN projects p ORDER BY d.name, p.name;',
    verificationQuery: 'SELECT COUNT(*) as count FROM departments CROSS JOIN projects;',
  },

  // ==================== COALESCE AND NULL FUNCTIONS ====================
  {
    id: 'intermediate-14',
    title: 'COALESCE — замена NULL',
    description: 'Использование COALESCE для обработки NULL значений',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Выведите всех сотрудников (first_name, last_name). Если у сотрудника нет department_id, выведите "Без отдела". Используйте COALESCE.',
    hint: 'COALESCE(value, replacement) возвращает первый не-NULL аргумент. JOIN с departments и COALESCE(d.name, "Без отдела").',
    sampleSolution:
      "SELECT e.first_name, e.last_name, COALESCE(d.name, 'Без отдела') as department_name FROM employees e LEFT JOIN departments d ON e.department_id = d.id;",
    verificationQuery: 'SELECT COUNT(*) as count FROM employees;',
  },

  {
    id: 'intermediate-15',
    title: 'NULLIF — условный NULL',
    description: 'Возврат NULL при совпадении значений',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText: 'Посчитайте среднюю зарплату, исключив сотрудников с зарплатой ровно 100000. Используйте NULLIF.',
    hint: 'NULLIF(salary, 100000) вернет NULL для зарплаты 100000, и AVG проигнорирует эти строки.',
    sampleSolution: 'SELECT AVG(NULLIF(salary, 100000)) as avg_salary_excluding_100k FROM employees;',
    verificationQuery: 'SELECT AVG(salary) as avg_all FROM employees WHERE salary != 100000;',
  },

  {
    id: 'intermediate-16',
    title: 'Комбинация COALESCE и агрегатных функций',
    description: 'Обработка NULL в агрегатных результатах',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Для каждого отдела выведите название и максимальную зарплату. Если в отделе нет сотрудников, выведите 0 вместо NULL. Используйте COALESCE с LEFT JOIN.',
    hint: 'LEFT JOIN departments с employees, COALESCE(MAX(e.salary), 0) для отделов без сотрудников.',
    sampleSolution:
      'SELECT d.name, COALESCE(MAX(e.salary), 0) as max_salary FROM departments d LEFT JOIN employees e ON d.id = e.department_id GROUP BY d.id, d.name;',
    verificationQuery: 'SELECT COUNT(*) as count FROM departments;',
  },

  // ==================== TRANSACTIONS ====================
  {
    id: 'intermediate-17',
    title: 'Транзакции — BEGIN и COMMIT',
    description: 'Атомарное выполнение нескольких операций',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    schema: EMPTY_ORDERS_SCHEMA,
    taskText:
      'Выполните транзакцию: добавьте продукт "Принтер" (цена=15000, stock=20) и сразу создайте заказ на этот продукт (quantity=2, order_date="2024-02-01", customer_name="Петров"). Зафиксируйте транзакцию.',
    hint: 'BEGIN; INSERT INTO products ...; INSERT INTO orders ...; COMMIT;',
    sampleSolution:
      "BEGIN; INSERT INTO products (name, price, stock) VALUES ('Принтер', 15000, 20); INSERT INTO orders (product_id, quantity, order_date, customer_name) VALUES (6, 2, '2024-02-01', 'Петров'); COMMIT;",
    verificationQuery: 'SELECT COUNT(*) as count FROM products WHERE name = "Принтер";',
  },

  {
    id: 'intermediate-18',
    title: 'Транзакции — ROLLBACK',
    description: 'Откат изменений при ошибке',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    schema: EMPTY_ORDERS_SCHEMA,
    taskText:
      'Начните транзакцию, добавьте продукт "Сканер" (цена=12000, stock=15), затем сделайте ROLLBACK. Убедитесь, что продукт не появился в таблице (выведите все продукты).',
    hint: 'BEGIN; INSERT INTO products ...; ROLLBACK; SELECT * FROM products;',
    sampleSolution:
      "BEGIN; INSERT INTO products (name, price, stock) VALUES ('Сканер', 12000, 15); ROLLBACK; SELECT * FROM products;",
    verificationQuery: 'SELECT COUNT(*) as count FROM products WHERE name = "Сканер";',
  },

  {
    id: 'intermediate-19',
    title: 'Транзакции с проверкой условий',
    description: 'Проверка бизнес-правил внутри транзакции',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    schema: EMPTY_ORDERS_SCHEMA,
    taskText:
      'Создайте транзакцию: проверьте, достаточно ли товара "Мышь" (id=2) на складе для заказа quantity=100. Если stock >= 100, создайте заказ и обновите stock. Иначе сделайте ROLLBACK. Выведите результат.',
    hint: 'Используйте BEGIN, проверьте stock, если условие не выполняется — ROLLBACK.',
    sampleSolution:
      'BEGIN; SELECT stock FROM products WHERE id = 2; -- stock=50, что < 100, поэтому ROLLBACK; ROLLBACK; SELECT * FROM products WHERE id = 2;',
    verificationQuery: 'SELECT stock FROM products WHERE id = 2;',
  },

  // ==================== DATE/TIME FUNCTIONS ====================
  {
    id: 'intermediate-20',
    title: 'Функции работы с датами',
    description: 'DATE, strftime и форматирование дат',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText: 'Выведите first_name, hire_date и год найма каждого сотрудника. Используйте strftime.',
    hint: 'strftime("%Y", hire_date) извлечет год из даты.',
    sampleSolution: 'SELECT first_name, hire_date, strftime("%Y", hire_date) as hire_year FROM employees;',
    verificationQuery: 'SELECT COUNT(*) as count FROM employees;',
  },

  {
    id: 'intermediate-21',
    title: 'Разница между датами',
    description: 'Вычисление интервалов между датами',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Вычислите количество дней, прошедших с даты найма каждого сотрудника до "2024-01-01". Выведите first_name и days_worked.',
    hint: 'julianday("2024-01-01") - julianday(hire_date) даст разницу в днях.',
    sampleSolution:
      'SELECT first_name, CAST(julianday("2024-01-01") - julianday(hire_date) AS INTEGER) as days_worked FROM employees ORDER BY days_worked DESC;',
    verificationQuery: 'SELECT COUNT(*) as count FROM employees;',
  },

  {
    id: 'intermediate-22',
    title: 'Фильтрация по дате',
    description: 'Поиск записей в диапазоне дат',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText: 'Найдите сотрудников, нанятых в 2021 году. Выведите first_name, last_name и hire_date.',
    hint: 'strftime("%Y", hire_date) = "2021" или hire_date BETWEEN "2021-01-01" AND "2021-12-31".',
    sampleSolution: 'SELECT first_name, last_name, hire_date FROM employees WHERE strftime("%Y", hire_date) = "2021";',
    verificationQuery: 'SELECT COUNT(*) as count FROM employees WHERE strftime("%Y", hire_date) = "2021";',
  },

  {
    id: 'intermediate-23',
    title: 'Даты в проектах',
    description: 'Анализ длительности проектов',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Для завершённых проектов выведите название и длительность в днях. Для активных проектов выведите "В процессе".',
    hint: 'CASE WHEN end_date IS NULL THEN "В процессе" ELSE julianday(end_date) - julianday(start_date) END.',
    sampleSolution:
      "SELECT name, CASE WHEN end_date IS NULL THEN 'В процессе' ELSE CAST(julianday(end_date) - julianday(start_date) AS INTEGER) END as duration_days FROM projects ORDER BY duration_days DESC;",
    verificationQuery: 'SELECT COUNT(*) as count FROM projects;',
  },

  // ==================== SHOP TASKS ====================
  {
    id: 'ch-35',
    title: 'ClickHouse: groupArray + arrayJoin',
    description: 'Сбор товаров в массивы по категориям и раскрытие массивов',
    difficulty: 'intermediate',
    dbType: 'clickhouse',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'Для каждой категории соберите названия товаров в массив products с помощью groupArray(). Выведите name категории и products. Отсортируйте по name. Дополнительно покажите, что arrayJoin() раскрывает массив обратно в строки: SELECT arrayJoin(groupArray(DISTINCT shipping_city)) AS city FROM orders;',
    hint: 'groupArray(expr) собирает все значения в группе в массив. arrayJoin(arr) раскрывает массив в отдельные строки — обратная операция.',
    sampleSolution:
      'SELECT c.name, groupArray(p.name) AS products FROM products p JOIN categories c ON p.category_id = c.id GROUP BY c.name ORDER BY c.name;',
    verificationQuery:
      'SELECT COUNT(*) as count FROM categories WHERE (SELECT COUNT(*) FROM products WHERE category_id = categories.id) > 0;',
  },

  {
    id: 'ch-36',
    title: 'ClickHouse: avgIf для фильтрованной аналитики',
    description: 'Средняя цена только активных товаров',
    difficulty: 'intermediate',
    dbType: 'clickhouse',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'Для каждой категории вычислите среднюю цену только активных товаров (is_active = 1). Используйте avgIf(price, is_active = 1). Выведите name категории и avg_active_price (округлите до 2 знаков). Отсортируйте по avg_active_price DESC.',
    hint: 'avgIf(expr, condition) вычисляет среднее только по строкам, удовлетворяющим условию. Аналоги: sumIf, countIf, minIf, maxIf.',
    sampleSolution:
      'SELECT c.name, ROUND(avgIf(p.price, p.is_active = 1), 2) AS avg_active_price FROM products p JOIN categories c ON p.category_id = c.id GROUP BY c.name ORDER BY avg_active_price DESC;',
    verificationQuery: 'SELECT COUNT(*) as count FROM categories;',
  },

  {
    id: 'ch-41',
    title: 'ClickHouse: having + countIf',
    description: 'Категории с более чем 3 товарами',
    difficulty: 'intermediate',
    dbType: 'clickhouse',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'Найдите категории, в которых более 3 товаров. Используйте GROUP BY category_id, HAVING COUNT(*) > 3. Для каждой подходящей категории выведите name, product_count и expensive_count (товары с ценой > 5000 через countIf). Отсортируйте по product_count DESC.',
    hint: 'HAVING фильтрует группы после GROUP BY. countIf(condition) считает строки, удовлетворяющие условию внутри группы.',
    sampleSolution:
      'SELECT c.name, COUNT(*) AS product_count, countIf(p.price > 5000) AS expensive_count FROM products p JOIN categories c ON p.category_id = c.id GROUP BY c.name, c.id HAVING COUNT(*) > 3 ORDER BY product_count DESC;',
    verificationQuery:
      'SELECT COUNT(*) as count FROM categories WHERE (SELECT COUNT(*) FROM products WHERE category_id = categories.id) > 3;',
  },

  {
    id: 'ch-43',
    title: 'ClickHouse: groupUniqArray для уникальных списков',
    description: 'Уникальные города доставки по клиентам',
    difficulty: 'intermediate',
    dbType: 'clickhouse',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'Для каждого города доставки соберите уникальные идентификаторы клиентов в массив. Используйте groupUniqArray(customer_id). Выведите shipping_city, unique_customers (массив) и total_orders. Отсортируйте по shipping_city.',
    hint: 'groupUniqArray(expr) собирает только уникальные значения в массив (в отличие от groupArray, который может содержать дубликаты).',
    sampleSolution:
      'SELECT shipping_city, groupUniqArray(customer_id) AS unique_customers, COUNT(*) AS total_orders FROM orders GROUP BY shipping_city ORDER BY shipping_city;',
    verificationQuery: 'SELECT COUNT(DISTINCT shipping_city) as count FROM orders;',
  },

  {
    id: 'pg-10',
    title: 'PostgreSQL: EXTRACT',
    description: 'Извлечение компонентов даты через EXTRACT',
    difficulty: 'intermediate',
    dbType: 'postgresql',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'Извлеките месяц (month) из order_date для каждого заказа. Выведите order_id, order_date и month_num = EXTRACT(MONTH FROM order_date). Посчитайте количество заказов в каждом месяце (order_count).',
    hint: 'EXTRACT(MONTH FROM order_date) вернёт номер месяца (1-12) из даты.',
    sampleSolution:
      'SELECT EXTRACT(MONTH FROM order_date) AS month_num, COUNT(*) AS order_count FROM orders GROUP BY month_num ORDER BY month_num;',
    verificationQuery:
      "SELECT CAST(STRFTIME('%m', order_date) AS INTEGER) AS month_num, COUNT(*) AS order_count FROM orders GROUP BY month_num ORDER BY month_num;",
  },

  {
    id: 'pg-21',
    title: 'PostgreSQL: множественные CTE',
    description: 'Несколько обобщённых табличных выражений в одном запросе',
    difficulty: 'intermediate',
    dbType: 'postgresql',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'Используя два CTE (WITH ... AS), выведите категории товаров с количеством продуктов и средней ценой. Первый CTE — category_stats: считает product_count и avg_price для каждого category_id. Второй CTE — category_info: объединяет результат с названиями категорий. Выведите name, product_count, avg_price. Отсортируйте по product_count DESC.',
    hint: 'WITH cte1 AS (...), cte2 AS (...) SELECT ... — несколько CTE через запятую. Второй CTE может ссылаться на первый.',
    sampleSolution:
      'WITH category_stats AS (SELECT category_id, COUNT(*) AS product_count, ROUND(AVG(price), 2) AS avg_price FROM products GROUP BY category_id), category_info AS (SELECT c.name, cs.product_count, cs.avg_price FROM categories c JOIN category_stats cs ON c.id = cs.category_id) SELECT name, product_count, avg_price FROM category_info ORDER BY product_count DESC;',
    verificationQuery:
      'SELECT COUNT(*) as count FROM categories WHERE (SELECT COUNT(*) FROM products WHERE category_id = categories.id) > 0;',
  },

  {
    id: 'pg-25',
    title: 'PostgreSQL: FILTER в агрегатах',
    description: 'Условная агрегация с предложением FILTER',
    difficulty: 'intermediate',
    dbType: 'postgresql',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'Для каждого товара выведите средний рейтинг только среди отзывов, где оставлен комментарий (comment IS NOT NULL). Используйте AVG(rating) FILTER (WHERE comment IS NOT NULL). Выведите name товара, total_reviews и avg_with_comment. Только товары с отзывами. Отсортируйте по avg_with_comment DESC.',
    hint: 'FILTER (WHERE condition) внутри агрегатной функции позволяет учитывать только строки, удовлетворяющие условию, без необходимости CASE.',
    sampleSolution:
      'SELECT p.name, COUNT(r.id) AS total_reviews, ROUND(AVG(r.rating) FILTER (WHERE r.comment IS NOT NULL), 2) AS avg_with_comment FROM products p JOIN reviews r ON p.id = r.product_id GROUP BY p.id, p.name HAVING total_reviews > 0 ORDER BY avg_with_comment DESC;',
    verificationQuery:
      'SELECT COUNT(*) as count FROM products p WHERE EXISTS (SELECT 1 FROM reviews r WHERE r.product_id = p.id);',
  },

  {
    id: 'pg-27',
    title: 'PostgreSQL: ARRAY и оператор ANY',
    description: 'Проверка вхождения в массив через ANY',
    difficulty: 'intermediate',
    dbType: 'postgresql',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'Найдите все товары из категорий «Электроника» (id=1), «Спорт» (id=4) и «Дом и сад» (id=5). Используйте конструкцию category_id = ANY(ARRAY[1, 4, 5]) вместо IN. Выведите name и price. Отсортируйте по name.',
    hint: '= ANY(ARRAY[...]) — PostgreSQL-синтаксис для проверки вхождения, эквивалентный IN, но работает с массивами.',
    sampleSolution: 'SELECT name, price FROM products WHERE category_id = ANY(ARRAY[1, 4, 5]) ORDER BY name;',
    verificationQuery: 'SELECT COUNT(*) as count FROM products WHERE category_id IN (1, 4, 5);',
  },

  {
    id: 'pg-30',
    title: 'PostgreSQL: CASE в ORDER BY',
    description: 'Условная сортировка с CASE',
    difficulty: 'intermediate',
    dbType: 'postgresql',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'Выведите все товары, отсортированные по следующему правилу: сначала активные товары (is_active = TRUE), затем неактивные. Внутри каждой группы — по убыванию цены. Используйте CASE в ORDER BY. Выведите name, price и is_active.',
    hint: 'ORDER BY CASE WHEN is_active = TRUE THEN 0 ELSE 1 END, price DESC — CASE определяет приоритет сортировки: 0 для активных, 1 для неактивных.',
    sampleSolution:
      'SELECT name, price, is_active FROM products ORDER BY CASE WHEN is_active = TRUE THEN 0 ELSE 1 END, price DESC;',
    verificationQuery: 'SELECT COUNT(*) as count FROM products;',
  },

  {
    id: 'pg-9',
    title: 'PostgreSQL: COALESCE',
    description: 'Обработка NULL-значений через COALESCE',
    difficulty: 'intermediate',
    dbType: 'postgresql',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'Для каждого товара выведите: название (name), цену (price) и цену со скидкой 10% (discounted_price). Если end_date проекта NULL, выведите "Не завершён". Используйте COALESCE для безопасной обработки NULL. Примените это к таблице orders: выведите order_id, shipping_city, и status_or_default = COALESCE(status, \'Не указан\').',
    hint: "COALESCE(status, 'Не указан') вернёт status, если он не NULL, иначе строку по умолчанию.",
    sampleSolution:
      "SELECT id AS order_id, shipping_city, COALESCE(status, 'Не указан') AS status_or_default FROM orders ORDER BY id;",
    verificationQuery: 'SELECT COUNT(*) as count FROM orders;',
  },

  {
    id: 'shop-i1',
    title: 'Товары с категориями',
    description: 'JOIN products + categories',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'Выведите название товара (products.name), название категории (categories.name) и цену. Используйте INNER JOIN.',
    hint: 'Соедините products с categories по category_id.',
    sampleSolution:
      'SELECT p.name as product_name, c.name as category_name, p.price FROM products p JOIN categories c ON p.category_id = c.id ORDER BY c.name, p.price DESC;',
    verificationQuery: 'SELECT COUNT(*) as count FROM products p JOIN categories c ON p.category_id = c.id;',
  },

  {
    id: 'shop-i2',
    title: 'Клиенты и их заказы',
    description: 'JOIN orders + customers',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      "Выведите имя клиента (first_name, last_name), дату заказа (order_date) и сумму (total_amount). Только доставленные заказы (status = 'delivered').",
    hint: 'JOIN customers с orders по customer_id, добавьте WHERE для фильтрации статуса.',
    sampleSolution:
      "SELECT c.first_name, c.last_name, o.order_date, o.total_amount FROM customers c JOIN orders o ON c.id = o.customer_id WHERE o.status = 'delivered' ORDER BY o.order_date DESC;",
    verificationQuery:
      "SELECT COUNT(*) as count FROM customers c JOIN orders o ON c.id = o.customer_id WHERE o.status = 'delivered';",
  },

  {
    id: 'shop-i3',
    title: 'Постоянные клиенты',
    description: 'GROUP BY + HAVING для клиентов',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText: 'Найдите клиентов, у которых 3 и более заказов. Выведите first_name, last_name и количество заказов.',
    hint: 'GROUP BY customer_id с HAVING COUNT(*) >= 3.',
    sampleSolution:
      'SELECT c.first_name, c.last_name, COUNT(o.id) as order_count FROM customers c JOIN orders o ON c.id = o.customer_id GROUP BY c.id, c.first_name, c.last_name HAVING COUNT(o.id) >= 3 ORDER BY order_count DESC;',
    verificationQuery:
      'SELECT COUNT(*) as count FROM (SELECT o.customer_id FROM orders o GROUP BY o.customer_id HAVING COUNT(o.id) >= 3);',
  },

  {
    id: 'shop-i4',
    title: 'Популярные товары',
    description: 'Подзапрос для среднего количества',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'Найдите товары, которые были заказаны суммарно (quantity) больше, чем среднее количество всех заказанных товаров. Выведите название товара и суммарное количество.',
    hint: 'Подзапрос: SELECT AVG(quantity) FROM order_items. Основной запрос с SUM(quantity) GROUP BY product_id.',
    sampleSolution:
      'SELECT p.name as product_name, SUM(oi.quantity) as total_sold FROM order_items oi JOIN products p ON oi.product_id = p.id GROUP BY p.id, p.name HAVING SUM(oi.quantity) > (SELECT AVG(quantity) FROM order_items) ORDER BY total_sold DESC;',
    verificationQuery:
      'SELECT COUNT(*) as count FROM (SELECT product_id FROM order_items GROUP BY product_id HAVING SUM(quantity) > (SELECT AVG(quantity) FROM order_items));',
  },

  {
    id: 'shop-i5',
    title: 'Сегментация клиентов',
    description: 'CASE WHEN для классификации',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'Разделите клиентов на сегменты по сумме всех заказов: "VIP" (сумма >= 50000), "Активный" (>= 10000), "Обычный" (< 10000). Выведите имя клиента, общую сумму и сегмент.',
    hint: 'CTE с суммой заказов, затем CASE WHEN для сегментации.',
    sampleSolution:
      "WITH customer_totals AS (SELECT c.first_name, c.last_name, SUM(o.total_amount) as total_spent FROM customers c JOIN orders o ON c.id = o.customer_id GROUP BY c.id, c.first_name, c.last_name) SELECT first_name, last_name, total_spent, CASE WHEN total_spent >= 50000 THEN 'VIP' WHEN total_spent >= 10000 THEN 'Активный' ELSE 'Обычный' END as segment FROM customer_totals ORDER BY total_spent DESC;",
    verificationQuery:
      'SELECT COUNT(*) as count FROM (SELECT o.customer_id FROM orders o GROUP BY o.customer_id HAVING SUM(o.total_amount) >= 50000);',
  },

  {
    id: 'shop-i6',
    title: 'Товары с отзывами',
    description: 'JOIN с агрегацией',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'Выведите названия товаров, средний рейтинг отзывов (ROUND до 1 знака) и количество отзывов. Только товары с отзывами.',
    hint: 'JOIN products с reviews, GROUP BY product_id. Используйте ROUND(AVG(rating), 1).',
    sampleSolution:
      'SELECT p.name as product_name, ROUND(AVG(r.rating), 1) as avg_rating, COUNT(r.id) as review_count FROM products p JOIN reviews r ON p.id = r.product_id GROUP BY p.id, p.name HAVING COUNT(r.id) > 0 ORDER BY avg_rating DESC, review_count DESC;',
    verificationQuery: 'SELECT COUNT(DISTINCT product_id) as count FROM reviews;',
  },

  // ==================== COMPANY TASKS (PostgreSQL/ClickHouse) ====================
  {
    id: 'ch-37',
    title: 'ClickHouse: multiIf для категоризации',
    description: 'Категоризация зарплат по диапазонам',
    difficulty: 'intermediate',
    dbType: 'clickhouse',
    category: 'company',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Для каждого сотрудника определите диапазон зарплаты: «низкая» (< 100000), «средняя» (100000–120000), «высокая» (120000–150000), «очень высокая» (> 150000). Используйте multiIf(). Выведите first_name, last_name, salary и salary_range. Отсортируйте по salary DESC.',
    hint: 'multiIf(cond1, val1, cond2, val2, ..., elseVal) — цепочка условий, аналогичная CASE WHEN в SQL. Условия проверяются по порядку.',
    sampleSolution:
      "SELECT first_name, last_name, salary, multiIf(salary < 100000, 'низкая', salary < 120000, 'средняя', salary < 150000, 'высокая', 'очень высокая') AS salary_range FROM employees ORDER BY salary DESC;",
    verificationQuery: 'SELECT COUNT(*) as count FROM employees;',
  },

  {
    id: 'ch-44',
    title: 'ClickHouse: toYear + toMonth для анализа',
    description: 'Сотрудники по году и месяцу найма',
    difficulty: 'intermediate',
    dbType: 'clickhouse',
    category: 'company',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Сгруппируйте сотрудников по году и месяцу найма. Используйте toYear(toDate(hire_date)) и toMonth(toDate(hire_date)). Выведите hire_year, hire_month, emp_count и avg_salary (округлите до 2 знаков). Отсортируйте по hire_year, hire_month.',
    hint: 'toYear(date) извлекает год, toMonth(date) — месяц. toDate() преобразует строку в тип Date.',
    sampleSolution:
      'SELECT toYear(toDate(hire_date)) AS hire_year, toMonth(toDate(hire_date)) AS hire_month, COUNT(*) AS emp_count, ROUND(AVG(salary), 2) AS avg_salary FROM employees GROUP BY hire_year, hire_month ORDER BY hire_year, hire_month;',
    verificationQuery: 'SELECT COUNT(*) as count FROM employees;',
  },

  {
    id: 'pg-1',
    title: 'PostgreSQL: ILIKE',
    description: 'Регистронезависимый поиск по шаблону',
    difficulty: 'intermediate',
    dbType: 'postgresql',
    category: 'company',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Найдите всех сотрудников, чьё имя (first_name) содержит букву «а» в любом регистре. Используйте оператор ILIKE. Выведите first_name, last_name.',
    hint: "ILIKE работает как LIKE, но игнорирует регистр: WHERE first_name ILIKE '%а%'",
    sampleSolution: "SELECT first_name, last_name FROM employees WHERE first_name ILIKE '%а%';",
    verificationQuery: "SELECT COUNT(*) as count FROM employees WHERE LOWER(first_name) LIKE '%а%';",
  },

  {
    id: 'pg-17',
    title: 'PostgreSQL: ON CONFLICT DO UPDATE (UPSERT)',
    description: 'Вставка или обновление при конфликте уникального ключа',
    difficulty: 'intermediate',
    dbType: 'postgresql',
    category: 'company',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      "Напишите INSERT нового сотрудника: first_name = 'Олег', last_name = 'Савельев', email = 'ivan@company.ru' (этот email уже существует в таблице), department_id = 1, salary = 175000, hire_date = '2024-03-01', is_active = TRUE. Используйте ON CONFLICT (email) DO UPDATE SET salary = EXCLUDED.salary — если сотрудник с таким email уже есть, обновите его зарплату.",
    hint: 'ON CONFLICT (column) DO UPDATE SET ... позволяет выполнить UPSERT: вставить новую запись или обновить существующую при конфликте уникального ключа. EXCLUDED ссылается на новые значения.',
    sampleSolution:
      "INSERT INTO employees (first_name, last_name, email, department_id, salary, hire_date, is_active) VALUES ('Олег', 'Савельев', 'ivan@company.ru', 1, 175000, '2024-03-01', TRUE) ON CONFLICT (email) DO UPDATE SET salary = EXCLUDED.salary;",
    verificationQuery: "SELECT COUNT(*) as count FROM employees WHERE email = 'ivan@company.ru';",
  },

  {
    id: 'pg-19',
    title: 'PostgreSQL: FULL OUTER JOIN',
    description: 'Полное внешнее соединение двух таблиц',
    difficulty: 'intermediate',
    dbType: 'postgresql',
    category: 'company',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Выведите всех сотрудников с их проектными назначениями (assignments), включая сотрудников без назначений и назначения без сотрудника. Используйте FULL OUTER JOIN. Выведите first_name, last_name, project_id, role. Отсортируйте по employee_id.',
    hint: 'FULL OUTER JOIN возвращает все строки из обеих таблиц: совпадающие строки объединяются, а несопоставленные заполняются NULL.',
    sampleSolution:
      'SELECT e.first_name, e.last_name, a.project_id, a.role FROM employees e FULL OUTER JOIN assignments a ON e.id = a.employee_id ORDER BY e.id, a.project_id;',
    verificationQuery: 'SELECT COUNT(*) as count FROM employees e LEFT JOIN assignments a ON e.id = a.employee_id;',
  },

  {
    id: 'pg-2',
    title: 'PostgreSQL: STRING_AGG',
    description: 'Агрегация строк через STRING_AGG',
    difficulty: 'intermediate',
    dbType: 'postgresql',
    category: 'company',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Для каждого отдела (departments) выведите список имён сотрудников через запятую. Используйте STRING_AGG. Результат: name отдела и строка с именами (employee_names).',
    hint: "STRING_AGG(first_name, ', ' ORDER BY first_name) объединит имена через запятую.",
    sampleSolution:
      "SELECT d.name, STRING_AGG(e.first_name, ', ' ORDER BY e.first_name) AS employee_names FROM departments d JOIN employees e ON d.id = e.department_id GROUP BY d.name ORDER BY d.name;",
    verificationQuery:
      'SELECT d.name, GROUP_CONCAT(e.first_name, ", ") AS employee_names FROM departments d JOIN employees e ON d.id = e.department_id GROUP BY d.name;',
  },

  {
    id: 'pg-24',
    title: 'PostgreSQL: DATE_TRUNC',
    description: 'Усечение даты до квартала с DATE_TRUNC',
    difficulty: 'intermediate',
    dbType: 'postgresql',
    category: 'company',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      "Сгруппируйте сотрудников по кварталу найма. Используйте DATE_TRUNC('quarter', hire_date::date) для усечения даты до начала квартала. Выведите hire_quarter, emp_count и avg_salary (округлите до 2 знаков). Отсортируйте по hire_quarter.",
    hint: "DATE_TRUNC('quarter', date) округляет дату вниз до начала соответствующего квартала (1 января, 1 апреля, 1 июля или 1 октября).",
    sampleSolution:
      "SELECT DATE_TRUNC('quarter', hire_date::date) AS hire_quarter, COUNT(*) AS emp_count, ROUND(AVG(salary), 2) AS avg_salary FROM employees GROUP BY hire_quarter ORDER BY hire_quarter;",
    verificationQuery: "SELECT COUNT(DISTINCT STRFTIME('%Y', hire_date)) AS count FROM employees;",
  },

  {
    id: 'pg-29',
    title: 'PostgreSQL: INTERVAL',
    description: 'Арифметика интервалов времени',
    difficulty: 'intermediate',
    dbType: 'postgresql',
    category: 'company',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      "Найдите всех сотрудников, чей стаж работы превышает 3 года. Используйте INTERVAL: hire_date < CURRENT_DATE - INTERVAL '3 years'. Выведите first_name, last_name и hire_date. Отсортируйте по hire_date.",
    hint: "CURRENT_DATE - INTERVAL '3 years' вычисляет дату 3 года назад. INTERVAL позволяет работать с временными интервалами: years, months, days и т.д.",
    sampleSolution:
      "SELECT first_name, last_name, hire_date FROM employees WHERE hire_date < CURRENT_DATE - INTERVAL '3 years' ORDER BY hire_date;",
    verificationQuery: "SELECT COUNT(*) as count FROM employees WHERE hire_date < DATE('now', '-3 years');",
  },

  {
    id: 'pg-3',
    title: 'PostgreSQL: ARRAY_AGG',
    description: 'Создание массива через ARRAY_AGG',
    difficulty: 'intermediate',
    dbType: 'postgresql',
    category: 'company',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Для каждого отдела выведите массив email-адресов сотрудников. Используйте ARRAY_AGG. Результат: name отдела и employee_emails (массив).',
    hint: 'ARRAY_AGG(email) вернёт массив email-адресов для каждого отдела.',
    sampleSolution:
      'SELECT d.name, ARRAY_AGG(e.email) AS employee_emails FROM departments d JOIN employees e ON d.id = e.department_id GROUP BY d.name ORDER BY d.name;',
    verificationQuery:
      'SELECT d.name, GROUP_CONCAT(e.email, "|") AS employee_emails FROM departments d JOIN employees e ON d.id = e.department_id GROUP BY d.name;',
  },

  {
    id: 'pg-34',
    title: 'PostgreSQL: BOOL_AND и BOOL_OR',
    description: 'Агрегатные булевы функции',
    difficulty: 'intermediate',
    dbType: 'postgresql',
    category: 'company',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Для каждого отдела проверьте: все ли сотрудники активны? Есть ли хотя бы один неактивный? Используйте BOOL_AND(is_active) для проверки «все активны» и BOOL_OR(NOT is_active) для проверки «есть неактивные». Выведите name отдела, all_active, has_inactive и emp_count. Отсортируйте по name отдела.',
    hint: 'BOOL_AND(expr) возвращает TRUE, если expr = TRUE для всех строк группы. BOOL_OR(expr) возвращает TRUE, если expr = TRUE хотя бы для одной строки.',
    sampleSolution:
      'SELECT d.name, BOOL_AND(e.is_active) AS all_active, BOOL_OR(NOT e.is_active) AS has_inactive, COUNT(*) AS emp_count FROM departments d JOIN employees e ON d.id = e.department_id GROUP BY d.name ORDER BY d.name;',
    verificationQuery:
      'SELECT COUNT(*) as count FROM departments d JOIN employees e ON d.id = e.department_id GROUP BY d.name;',
  },

  {
    id: 'pg-4',
    title: 'PostgreSQL: TRUE/FALSE',
    description: 'Использование логических литералов TRUE и FALSE',
    difficulty: 'intermediate',
    dbType: 'postgresql',
    category: 'company',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'В PostgreSQL столбец is_active можно сравнивать с булевыми литералами TRUE и FALSE. Найдите всех неактивных сотрудников (is_active = FALSE). Выведите first_name, last_name, is_active.',
    hint: 'WHERE is_active = FALSE — PostgreSQL поддерживает булевы литералы напрямую.',
    sampleSolution: 'SELECT first_name, last_name, is_active FROM employees WHERE is_active = FALSE;',
    verificationQuery: 'SELECT COUNT(*) as count FROM employees WHERE is_active = 0;',
  },

  {
    id: 'pg-5',
    title: 'PostgreSQL: Приведение типов (::)',
    description: 'Синтаксис приведения типов через ::',
    difficulty: 'intermediate',
    dbType: 'postgresql',
    category: 'company',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Приведите зарплату (salary) к типу INTEGER с помощью PostgreSQL-синтаксиса ::INTEGER. Выведите first_name, last_name и зарплату как целое число (salary_int). Отсортируйте по убыванию зарплаты.',
    hint: 'salary::INTEGER приведёт REAL к INTEGER в PostgreSQL.',
    sampleSolution: 'SELECT first_name, last_name, salary::INTEGER AS salary_int FROM employees ORDER BY salary DESC;',
    verificationQuery:
      'SELECT first_name, last_name, CAST(salary AS INTEGER) AS salary_int FROM employees ORDER BY salary DESC;',
  },

  {
    id: 'pg-7',
    title: 'PostgreSQL: IS TRUE / IS FALSE',
    description: 'Проверка булевых значений через IS TRUE и IS FALSE',
    difficulty: 'intermediate',
    dbType: 'postgresql',
    category: 'company',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'В PostgreSQL можно использовать IS TRUE и IS FALSE для проверки булевых значений. Найдите всех активных сотрудников с помощью is_active IS TRUE. Выведите first_name, last_name, is_active. Отсортируйте по last_name.',
    hint: 'WHERE is_active IS TRUE — более точная проверка булевых значений, чем сравнение с = TRUE.',
    sampleSolution:
      'SELECT first_name, last_name, is_active FROM employees WHERE is_active IS TRUE ORDER BY last_name;',
    verificationQuery: 'SELECT COUNT(*) as count FROM employees WHERE is_active = 1;',
  },

  // ==================== ANALYTICS TASKS (ClickHouse) ====================
  {
    id: 'analytics-i1',
    title: 'JOIN пользователей и событий',
    description: 'LEFT JOIN users с events',
    difficulty: 'intermediate',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: ANALYTICS_SCHEMA,
    taskText:
      'Выведите имя пользователя (username) и количество его событий. Используйте LEFT JOIN таблиц users и events.',
    hint: 'LEFT JOIN гарантирует, что все пользователи будут в результате, даже без событий.',
    sampleSolution:
      'SELECT u.username, count(e.event_id) as event_count FROM users u LEFT JOIN events e ON u.user_id = e.user_id GROUP BY u.user_id, u.username ORDER BY event_count DESC;',
    verificationQuery: 'SELECT COUNT(*) as count FROM users;',
  },

  {
    id: 'analytics-i2',
    title: 'HAVING — фильтрация групп',
    description: 'GROUP BY + HAVING для фильтрации агрегатов',
    difficulty: 'intermediate',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: ANALYTICS_SCHEMA,
    taskText: 'Найдите страны, в которых больше 5 событий. Используйте GROUP BY country + HAVING с условием.',
    hint: 'HAVING count(*) > 5 фильтрует группы после агрегации.',
    sampleSolution:
      'SELECT country, count(*) as event_count FROM events GROUP BY country HAVING count(*) > 5 ORDER BY event_count DESC;',
    verificationQuery:
      'SELECT COUNT(*) as count FROM (SELECT country FROM events GROUP BY country HAVING count(*) > 5);',
  },

  {
    id: 'analytics-i3',
    title: 'toStartOfDay — группировка по дням',
    description: 'ClickHouse-функция toStartOfDay()',
    difficulty: 'intermediate',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: ANALYTICS_SCHEMA,
    taskText:
      'Посчитайте количество событий по дням (таблица events). Используйте ClickHouse-функцию toStartOfDay() для группировки.',
    hint: 'toStartOfDay(event_time) округляет DateTime до начала дня.',
    sampleSolution:
      'SELECT toStartOfDay(event_time) as day, count(*) as event_count FROM events GROUP BY day ORDER BY day;',
    verificationQuery: 'SELECT COUNT(DISTINCT date(event_time)) as days FROM events;',
  },

  {
    id: 'analytics-i4',
    title: 'toStartOfMonth — аналитика покупок',
    description: 'Группировка покупок по месяцам',
    difficulty: 'intermediate',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: ANALYTICS_SCHEMA,
    taskText:
      'Выведите месяц покупки, количество покупок и общую сумму по месяцам. Используйте toStartOfMonth() для группировки.',
    hint: 'toStartOfMonth(purchase_date) возвращает первый день месяца для каждой покупки.',
    sampleSolution:
      'SELECT toStartOfMonth(purchase_date) as month, count(*) as purchase_count, sum(amount) as total_amount FROM purchases GROUP BY month ORDER BY month;',
    verificationQuery: 'SELECT COUNT(DISTINCT purchase_date) as days FROM purchases;',
  },

  {
    id: 'analytics-i5',
    title: 'multiIf — множественное условие',
    description: 'ClickHouse-функция multiIf() для классификации',
    difficulty: 'intermediate',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: ANALYTICS_SCHEMA,
    taskText:
      'Классифицируйте пользователей по возрасту: "молодой" (<25), "средний" (25-34), "старший" (>=35). Выведите username, age и категорию. Используйте multiIf().',
    hint: "multiIf(age < 25, 'молодой', age <= 34, 'средний', 'старший') — работает как CASE WHEN с несколькими условиями.",
    sampleSolution:
      "SELECT username, age, multiIf(age < 25, 'молодой', age <= 34, 'средний', 'старший') as age_category FROM users ORDER BY age;",
    verificationQuery: 'SELECT COUNT(*) as count FROM users;',
  },

  {
    id: 'ch-1',
    title: 'sumIf — условная сумма',
    description: 'Conditional sum with sumIf',
    difficulty: 'intermediate',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: CLICKHOUSE_EVENTS_SCHEMA,
    taskText:
      'Вычислите общую продолжительность (duration) только событий типа page_view. Используйте sumIf(). Выведите результат как total_page_view_duration.',
    hint: 'sumIf(expr, condition) sums only rows matching the condition.',
    sampleSolution: "SELECT sumIf(duration, event_type = 'page_view') as total_page_view_duration FROM events;",
    verificationQuery: 'SELECT 1 as count;',
  },

  {
    id: 'ch-2',
    title: 'countIf — условный подсчёт',
    description: 'Conditional count with countIf',
    difficulty: 'intermediate',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: CLICKHOUSE_EVENTS_SCHEMA,
    taskText:
      'Подсчитайте количество премиум-пользователей из Москвы. Используйте countIf(). Выведите результат как premium_moscow.',
    hint: 'countIf(condition) counts rows matching the condition.',
    sampleSolution: "SELECT countIf(is_premium = 1 AND city = 'Москва') as premium_moscow FROM users;",
    verificationQuery: 'SELECT 1 as count;',
  },

  {
    id: 'ch-3',
    title: 'toStartOfMonth — группировка по месяцам',
    description: 'Group by month with toStartOfMonth',
    difficulty: 'intermediate',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: CLICKHOUSE_EVENTS_SCHEMA,
    taskText:
      'Сгруппируйте покупки по месяцам. Для каждого месяца выведите количество покупок (cnt) и общую сумму (total). Используйте toStartOfMonth().',
    hint: 'toStartOfMonth(date) truncates date to the first day of the month.',
    sampleSolution:
      'SELECT toStartOfMonth(purchase_date) as month, count() as cnt, SUM(amount) as total FROM purchases GROUP BY month ORDER BY month;',
    verificationQuery: 'SELECT 1 as count;',
  },

  {
    id: 'ch-33',
    title: 'ClickHouse: dateDiff с INTERVAL',
    description: 'Количество дней между первым и последним событием для каждого пользователя',
    difficulty: 'intermediate',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: CLICKHOUSE_EVENTS_SCHEMA,
    taskText:
      "Для каждого пользователя вычислите количество дней между первым и последним событием. Используйте dateDiff('day', MIN(event_time), MAX(event_time)). Выведите user_id, first_event, last_event и days_span. Отсортируйте по user_id.",
    hint: "dateDiff(unit, start, end) вычисляет разницу между двумя датами. Поддерживаемые единицы: 'day', 'hour', 'minute', 'second' и др.",
    sampleSolution:
      "SELECT user_id, MIN(event_time) AS first_event, MAX(event_time) AS last_event, dateDiff('day', MIN(event_time), MAX(event_time)) AS days_span FROM events GROUP BY user_id ORDER BY user_id;",
    verificationQuery: 'SELECT COUNT(*) as count FROM events;',
  },

  {
    id: 'ch-39',
    title: 'ClickHouse: uniqExact vs COUNT DISTINCT',
    description: 'Подсчёт уникальных пользователей за день',
    difficulty: 'intermediate',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: CLICKHOUSE_EVENTS_SCHEMA,
    taskText:
      'Для каждого дня подсчитайте количество уникальных пользователей двумя способами: uniqExact(user_id) и COUNT(DISTINCT user_id). Выведите event_date, unique_exact и unique_countd. uniqExact точнее, но медленнее. Отсортируйте по event_date.',
    hint: 'uniqExact() считает уникальные значения точно (используя хеш-таблицу). COUNT(DISTINCT) в ClickHouse может быть приблизительным. Для маленьких данных результат одинаков.',
    sampleSolution:
      'SELECT toDate(event_time) AS event_date, uniqExact(user_id) AS unique_exact, count(DISTINCT user_id) AS unique_countd FROM events GROUP BY event_date ORDER BY event_date;',
    verificationQuery: 'SELECT COUNT(*) as count FROM events;',
  },

  {
    id: 'ch-4',
    title: 'groupArray — массивы из групп',
    description: 'Create arrays from groups with groupArray',
    difficulty: 'intermediate',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: CLICKHOUSE_EVENTS_SCHEMA,
    taskText:
      'Для каждого пользователя соберите уникальные посещённые страницы (page) в массив. Используйте groupArray(DISTINCT page). Выведите user_id и visited_pages.',
    hint: 'groupArray(expr) creates an array from all values in the group.',
    sampleSolution:
      'SELECT user_id, groupArray(DISTINCT page) as visited_pages FROM events GROUP BY user_id ORDER BY user_id;',
    verificationQuery: 'SELECT 1 as count;',
  },

  {
    id: 'ch-46',
    title: 'ClickHouse: has() для поиска в массиве',
    description: 'Пользователи, посещавшие определённую страницу',
    difficulty: 'intermediate',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: CLICKHOUSE_EVENTS_SCHEMA,
    taskText:
      "Найдите пользователей, которые посещали страницу '/home'. Используйте подзапрос: сначала соберите посещённые страницы каждого пользователя в массив через groupArray(DISTINCT page), затем отфильтруйте с помощью has(visited_pages, '/home'). Выведите user_id и visited_pages. Отсортируйте по user_id.",
    hint: 'has(array, value) возвращает 1, если массив содержит значение, и 0 иначе. Работает с массивами, созданными groupArray.',
    sampleSolution:
      "SELECT user_id, groupArray(DISTINCT page) AS visited_pages FROM events GROUP BY user_id HAVING has(groupArray(DISTINCT page), '/home') ORDER BY user_id;",
    verificationQuery: 'SELECT COUNT(*) as count FROM events;',
  },

  {
    id: 'ch-5',
    title: 'multiIf — множественное условие',
    description: 'Multiple conditions with multiIf',
    difficulty: 'intermediate',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: CLICKHOUSE_EVENTS_SCHEMA,
    taskText:
      'Классифицируйте пользователей по возрастным группам: «молодой» (до 25), «средний» (25-34), «опытный» (35-44), «старший» (45+). Используйте multiIf(). Выведите username, age и age_group.',
    hint: 'multiIf(cond1, val1, cond2, val2, ..., elseVal) evaluates conditions sequentially.',
    sampleSolution:
      "SELECT username, age, multiIf(age < 25, 'молодой', age < 35, 'средний', age < 45, 'опытный', 'старший') as age_group FROM users ORDER BY age;",
    verificationQuery: 'SELECT COUNT(*) as count FROM users;',
  },

  {
    id: 'ch-6',
    title: 'formatDateTime — форматирование дат',
    description: 'Date formatting with formatDateTime',
    difficulty: 'intermediate',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: CLICKHOUSE_EVENTS_SCHEMA,
    taskText:
      "Сгруппируйте события по часам. Используйте formatDateTime(event_time, '%Y-%m-%d %H:00') для группировки. Выведите event_time, hour_bucket и количество событий (events_count).",
    hint: 'formatDateTime(date, format) formats dates using strftime-style patterns.',
    sampleSolution:
      "SELECT event_time, formatDateTime(event_time, '%Y-%m-%d %H:00') as hour_bucket, COUNT() as events_count FROM events GROUP BY event_time, hour_bucket ORDER BY event_time;",
    verificationQuery: 'SELECT 1 as count;',
  },

  {
    id: 'ch-intermediate-1',
    title: 'sumIf и countIf',
    description: 'Условные агрегации',
    difficulty: 'intermediate',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: ANALYTICS_SCHEMA,
    taskText:
      "Для каждого пользователя (users) выведите имя, общее количество покупок и общую сумму только завершённых покупок (purchases, status = 'completed').",
    hint: "Используйте sumIf(amount, status = 'completed') и countIf(status = 'completed').",
    sampleSolution:
      "SELECT u.username, countIf(p.status = 'completed') as completed_count, sumIf(p.amount, p.status = 'completed') as total_spent FROM users u LEFT JOIN purchases p ON u.user_id = p.user_id GROUP BY u.user_id, u.username ORDER BY total_spent DESC;",
    verificationQuery: 'SELECT COUNT(*) as count FROM users;',
  },

  {
    id: 'ch-intermediate-2',
    title: 'toStartOfMonth',
    description: 'Группировка по месяцам',
    difficulty: 'intermediate',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: ANALYTICS_SCHEMA,
    taskText: 'Посчитайте количество покупок и общую сумму по месяцам (таблица purchases). Используйте toStartOfMonth.',
    hint: 'toStartOfMonth(purchase_date) вернёт начало месяца для группировки.',
    sampleSolution:
      'SELECT toStartOfMonth(purchase_date) as month, count(*) as purchase_count, sum(amount) as total_amount FROM purchases GROUP BY month ORDER BY month;',
    verificationQuery: 'SELECT COUNT(DISTINCT toStartOfMonth(purchase_date)) as months FROM purchases;',
  },

  {
    id: 'ch-intermediate-3',
    title: 'avgIf',
    description: 'Условное среднее',
    difficulty: 'intermediate',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: ANALYTICS_SCHEMA,
    taskText: 'Найдите среднюю длительность (duration) только для событий page_view, сгруппированных по device.',
    hint: "avgIf(duration, event_type = 'page_view')",
    sampleSolution:
      "SELECT device, avgIf(duration, event_type = 'page_view') as avg_duration FROM events WHERE event_type = 'page_view' GROUP BY device ORDER BY avg_duration DESC;",
    verificationQuery: "SELECT COUNT(DISTINCT device) as devices FROM events WHERE event_type = 'page_view';",
  },

  {
    id: 'ch-intermediate-4',
    title: 'multiIf',
    description: 'Множественное условие',
    difficulty: 'intermediate',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: ANALYTICS_SCHEMA,
    taskText:
      'Классифицируйте пользователей по возрасту: "молодой" (<25), "средний" (25-34), "старший" (>=35). Выведите имя, возраст и категорию.',
    hint: "multiIf(age < 25, 'молодой', age <= 34, 'средний', 'старший')",
    sampleSolution:
      "SELECT username, age, multiIf(age < 25, 'молодой', age <= 34, 'средний', 'старший') as age_category FROM users ORDER BY age;",
    verificationQuery: 'SELECT COUNT(*) as count FROM users;',
  },

  {
    id: 'pg-11',
    title: 'ILIKE — регистронезависимый поиск',
    description: 'Case-insensitive pattern matching',
    difficulty: 'intermediate',
    dbType: 'postgresql',
    category: 'analytics',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Найдите всех сотрудников, чьё имя (first_name) содержит подстроку «ан» в любом регистре. Используйте ILIKE. Выведите first_name и last_name.',
    hint: 'ILIKE performs case-insensitive pattern matching in PostgreSQL.',
    sampleSolution: "SELECT first_name, last_name FROM employees WHERE first_name ILIKE '%ан%';",
    verificationQuery:
      "SELECT COUNT(*) as count FROM employees WHERE first_name LIKE '%ан%' OR first_name LIKE '%Ан%';",
  },

  {
    id: 'pg-12',
    title: 'EXTRACT — извлечение части даты',
    description: 'Extract date components with EXTRACT',
    difficulty: 'intermediate',
    dbType: 'postgresql',
    category: 'analytics',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Извлеките год из hire_date для каждого сотрудника. Выведите first_name, last_name и hire_year = EXTRACT(YEAR FROM hire_date). Отсортируйте по hire_year.',
    hint: 'EXTRACT(YEAR FROM column) returns the year part of a date.',
    sampleSolution:
      'SELECT first_name, last_name, EXTRACT(YEAR FROM hire_date) as hire_year FROM employees ORDER BY hire_year;',
    verificationQuery: 'SELECT COUNT(*) as count FROM employees;',
  },

  {
    id: 'pg-13',
    title: 'STRING_AGG — объединение строк',
    description: 'String aggregation with STRING_AGG',
    difficulty: 'intermediate',
    dbType: 'postgresql',
    category: 'analytics',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Для каждого отдела объедините имена сотрудников (first_name + last_name) через запятую. Используйте STRING_AGG. Выведите name отдела и employees.',
    hint: 'STRING_AGG(expr, delimiter) concatenates non-null input values into a string.',
    sampleSolution:
      "SELECT d.name as department, STRING_AGG(e.first_name || ' ' || e.last_name, ', ') as employees FROM departments d JOIN employees e ON d.id = e.department_id GROUP BY d.name;",
    verificationQuery: 'SELECT COUNT(*) as count FROM departments;',
  },

  // ==================== EXAM TASKS ====================
  {
    id: 'ch-exam-4',
    title: 'Экзамен ClickHouse: sumIf для проектных часов',
    description: 'Часы ведущих разработчиков по проектам',
    difficulty: 'intermediate',
    dbType: 'clickhouse',
    category: 'exam',
    examGroup: 'ch-exam-intermediate',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      "Для каждого проекта вычислите: часы ведущих разработчиков (sumIf(hours_worked, role = 'Ведущий разработчик')) и общие часы. Используйте таблицу assignments. Выведите project_id, lead_hours и total_hours. Отсортируйте по project_id.",
    hint: 'sumIf(expr, condition) суммирует expr только для строк, где condition = true. Это компактнее, чем CASE WHEN внутри SUM.',
    sampleSolution:
      "SELECT project_id, sumIf(hours_worked, role = 'Ведущий разработчик') AS lead_hours, SUM(hours_worked) AS total_hours FROM assignments GROUP BY project_id ORDER BY project_id;",
    verificationQuery: 'SELECT COUNT(*) as count FROM assignments;',
  },

  {
    id: 'ch-exam-5',
    title: 'Экзамен ClickHouse: groupArray',
    description: 'Список сотрудников по отделам',
    difficulty: 'intermediate',
    dbType: 'clickhouse',
    category: 'exam',
    examGroup: 'ch-exam-intermediate',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      "Для каждого отдела соберите имена сотрудников в массив. Используйте groupArray(first_name || ' ' || last_name). Выведите department и employees (массив). Отсортируйте по department.",
    hint: 'groupArray(expr) создаёт массив из значений expr в каждой группе. Порядок элементов не гарантируется. Для уникальных значений используйте groupUniqArray.',
    sampleSolution:
      "SELECT d.name AS department, groupArray(e.first_name || ' ' || e.last_name) AS employees FROM departments d JOIN employees e ON d.id = e.department_id GROUP BY d.name ORDER BY d.name;",
    verificationQuery: 'SELECT COUNT(*) as count FROM departments;',
  },

  {
    id: 'ch-exam-6',
    title: 'Экзамен ClickHouse: multiIf для зарплатных групп',
    description: 'Зарплатные группы с помощью multiIf',
    difficulty: 'intermediate',
    dbType: 'clickhouse',
    category: 'exam',
    examGroup: 'ch-exam-intermediate',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Разбейте сотрудников на зарплатные группы с помощью multiIf: A (< 100K), B (100K–120K), C (120K–140K), D (140K–160K), E (160K+). Выведите first_name, last_name, salary и bracket. Отсортируйте по salary.',
    hint: 'multiIf(cond1, val1, cond2, val2, ..., elseVal) — цепочка условий. Удобнее вложенных if(). Условия проверяются последовательно.',
    sampleSolution:
      "SELECT first_name, last_name, salary, multiIf(salary < 100000, 'A', salary < 120000, 'B', salary < 140000, 'C', salary < 160000, 'D', 'E') AS bracket FROM employees ORDER BY salary;",
    verificationQuery: 'SELECT COUNT(*) as count FROM employees;',
  },

  {
    id: 'exam-i1',
    title: 'Экзамен: Многотабличный JOIN',
    description: 'Проверочная работа — JOIN трёх таблиц',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    category: 'exam',
    examGroup: 'exam-intermediate',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Выведите имена сотрудников, названия проектов и часы работы, но только для проектов в статусе "active". Отсортируйте по часам по убыванию.',
    hint: "JOIN employees, assignments, projects. WHERE status = 'active'.",
    sampleSolution:
      "SELECT e.first_name, e.last_name, p.name as project_name, a.hours_worked FROM employees e JOIN assignments a ON e.id = a.employee_id JOIN projects p ON a.project_id = p.id WHERE p.status = 'active' ORDER BY a.hours_worked DESC;",
    verificationQuery:
      "SELECT COUNT(*) as count FROM employees e JOIN assignments a ON e.id = a.employee_id JOIN projects p ON a.project_id = p.id WHERE p.status = 'active';",
  },

  {
    id: 'exam-i2',
    title: 'Экзамен: Подзапрос с EXISTS',
    description: 'Проверочная работа — коррелированный подзапрос',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    category: 'exam',
    examGroup: 'exam-intermediate',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Найдите отделы, в которых есть хотя бы один неактивный сотрудник (is_active = 0). Выведите название отдела.',
    hint: 'WHERE EXISTS (SELECT 1 FROM employees WHERE department_id = d.id AND is_active = 0).',
    sampleSolution:
      'SELECT d.name FROM departments d WHERE EXISTS (SELECT 1 FROM employees e WHERE e.department_id = d.id AND e.is_active = 0);',
    verificationQuery: 'SELECT 2 as expected_count;',
  },

  {
    id: 'exam-i3',
    title: 'Экзамен: Сложный CASE WHEN',
    description: 'Проверочная работа — CASE в SELECT + GROUP BY',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    category: 'exam',
    examGroup: 'exam-intermediate',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Создайте отчёт: для каждого отдела выведите название, количество сотрудников и статус бюджета: "Профицит" (бюджет > сумма зарплат), "Дефицит" (иначе).',
    hint: 'CTE для суммы зарплат, затем JOIN с CASE WHEN.',
    sampleSolution:
      "WITH dept_salaries AS (SELECT department_id, SUM(salary) as total_salary FROM employees GROUP BY department_id) SELECT d.name, COUNT(e.id) as emp_count, ds.total_salary, d.budget, CASE WHEN d.budget > ds.total_salary THEN 'Профицит' ELSE 'Дефицит' END as budget_status FROM departments d LEFT JOIN employees e ON d.id = e.department_id LEFT JOIN dept_salaries ds ON d.id = ds.department_id GROUP BY d.id, d.name, d.budget, ds.total_salary ORDER BY d.name;",
    verificationQuery: 'SELECT COUNT(*) as count FROM departments;',
  },

  {
    id: 'exam-i4',
    title: 'Экзамен: IN подзапрос',
    description: 'Проверочная работа — WHERE IN с подзапросом',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    category: 'exam',
    examGroup: 'exam-intermediate',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Найдите сотрудников, которые работают над активными проектами, но работают менее 100 часов. Выведите first_name, last_name, hours_worked.',
    hint: 'WHERE employee_id IN (SELECT employee_id FROM assignments JOIN projects ...) AND hours_worked < 100.',
    sampleSolution:
      "SELECT DISTINCT e.first_name, e.last_name, a.hours_worked FROM employees e JOIN assignments a ON e.id = a.employee_id JOIN projects p ON a.project_id = p.id WHERE p.status = 'active' AND a.hours_worked < 100 ORDER BY a.hours_worked;",
    verificationQuery:
      "SELECT COUNT(*) as count FROM (SELECT DISTINCT e.id FROM employees e JOIN assignments a ON e.id = a.employee_id JOIN projects p ON a.project_id = p.id WHERE p.status = 'active' AND a.hours_worked < 100);",
  },

  {
    id: 'exam-i5',
    title: 'Экзамен: Сложная агрегация',
    description: 'Проверочная работа — GROUP BY + HAVING + JOIN',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    category: 'exam',
    examGroup: 'exam-intermediate',
    schema: SHOP_SCHEMA,
    taskText:
      'Найдите города, в которых общая сумма заказов больше 20000 рублей. Выведите shipping_city и суммарную сумму заказов.',
    hint: 'GROUP BY shipping_city с HAVING SUM(total_amount) > 20000.',
    sampleSolution:
      'SELECT shipping_city, SUM(total_amount) as total FROM orders GROUP BY shipping_city HAVING SUM(total_amount) > 20000 ORDER BY total DESC;',
    verificationQuery:
      'SELECT COUNT(*) as count FROM (SELECT shipping_city FROM orders GROUP BY shipping_city HAVING SUM(total_amount) > 20000);',
  },

  {
    id: 'pg-exam-4',
    title: 'Экзамен PostgreSQL: STRING_AGG для объединения строк',
    description: 'Список сотрудников по отделам',
    difficulty: 'intermediate',
    dbType: 'postgresql',
    category: 'exam',
    examGroup: 'pg-exam-intermediate',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      "Для каждого отдела выведите список имён сотрудников через запятую. Используйте STRING_AGG(first_name || ' ' || last_name, ', '). Выведите department и employees. Отсортируйте по department.",
    hint: 'STRING_AGG(expr, delimiter) объединяет строковые значения в группу с разделителем. Работает только с текстовыми выражениями.',
    sampleSolution:
      "SELECT d.name AS department, STRING_AGG(e.first_name || ' ' || e.last_name, ', ') AS employees FROM departments d LEFT JOIN employees e ON d.id = e.department_id GROUP BY d.name ORDER BY d.name;",
    verificationQuery: 'SELECT COUNT(*) as count FROM departments;',
  },

  {
    id: 'pg-exam-5',
    title: 'Экзамен PostgreSQL: EXTRACT для группировки по году',
    description: 'Анализ найма по годам',
    difficulty: 'intermediate',
    dbType: 'postgresql',
    category: 'exam',
    examGroup: 'pg-exam-intermediate',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Сгруппируйте сотрудников по году найма. Используйте EXTRACT(YEAR FROM hire_date::date). Для каждого года выведите hire_year, emp_count и avg_salary (округлите до 2 знаков). Отсортируйте по hire_year.',
    hint: 'EXTRACT(field FROM source) извлекает часть даты: YEAR, MONTH, DAY, HOUR и др. ::date преобразует строку в тип date.',
    sampleSolution:
      'SELECT EXTRACT(YEAR FROM hire_date::date) AS hire_year, COUNT(*) AS emp_count, ROUND(AVG(salary), 2) AS avg_salary FROM employees GROUP BY hire_year ORDER BY hire_year;',
    verificationQuery: "SELECT COUNT(DISTINCT STRFTIME('%Y', hire_date)) as count FROM employees;",
  },

  {
    id: 'pg-exam-6',
    title: 'Экзамен PostgreSQL: ARRAY_AGG для массивов',
    description: 'Сбор названий проектов по отделам',
    difficulty: 'intermediate',
    dbType: 'postgresql',
    category: 'exam',
    examGroup: 'pg-exam-intermediate',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Для каждого отдела соберите названия всех проектов в массив. Используйте ARRAY_AGG(p.name). Выведите department и projects (массив). Отсортируйте по department. Включите отделы без проектов (LEFT JOIN).',
    hint: 'ARRAY_AGG(expr) создаёт массив из значений группы. Если ни одной строки — результат NULL (при LEFT JOIN можно обернуть в COALESCE).',
    sampleSolution:
      'SELECT d.name AS department, ARRAY_AGG(p.name) AS projects FROM departments d LEFT JOIN projects p ON d.id = p.department_id GROUP BY d.name ORDER BY d.name;',
    verificationQuery: 'SELECT COUNT(*) as count FROM departments;',
  },
];
