/**
 * MySQL Task Definitions
 * MySQL-specific syntax and features for educational exercises
 */

import type { TrainingTask } from './types';
import { EMPLOYEES_SCHEMA, SHOP_SCHEMA } from './schemas';

export const MYSQL_TASKS: TrainingTask[] = [
  // ==================== MySQL BEGINNER TASKS ====================
  {
    id: 'mysql-1',
    title: 'MySQL: LIMIT with OFFSET',
    description: 'Query result pagination',
    difficulty: 'beginner',
    dbType: 'mysql',
    category: 'company',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Display employees (first_name, last_name, salary), sorted by salary DESC, skipping the first 5 and taking the next 10. Use LIMIT 10 OFFSET 5.',
    hint: 'In MySQL syntax: LIMIT count OFFSET offset. This is used for pagination.',
    sampleSolution: 'SELECT first_name, last_name, salary FROM employees ORDER BY salary DESC LIMIT 10 OFFSET 5;',
    verificationQuery: 'SELECT COUNT(*) as count FROM employees;',
  },

  {
    id: 'mysql-2',
    title: 'MySQL: STRAIGHT_JOIN',
    description: 'Forced table join order',
    difficulty: 'beginner',
    dbType: 'mysql',
    category: 'company',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Display employee names and department names using STRAIGHT_JOIN (a MySQL-specific analog of INNER JOIN that forces reading the left table first).',
    hint: 'STRAIGHT_JOIN works like INNER JOIN but guarantees read order: the left table is always read first.',
    sampleSolution:
      'SELECT e.first_name, e.last_name, d.name as department_name FROM employees e STRAIGHT_JOIN departments d ON e.department_id = d.id;',
    verificationQuery: 'SELECT COUNT(*) as count FROM employees e JOIN departments d ON e.department_id = d.id;',
  },

  // ==================== MySQL INTERMEDIATE TASKS ====================
  {
    id: 'mysql-3',
    title: 'MySQL: IF() function',
    description: 'Conditional expression IF in MySQL',
    difficulty: 'intermediate',
    dbType: 'mysql',
    category: 'company',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'For each employee display first_name, salary and category: "High" if salary > 130000, otherwise "Regular". Use IF(salary > 130000, "High", "Regular").',
    hint: 'MySQL IF(condition, true_val, false_val) — compact form of CASE WHEN for two options.',
    sampleSolution:
      "SELECT first_name, salary, IF(salary > 130000, 'Высокая', 'Обычная') as salary_category FROM employees ORDER BY salary DESC;",
    verificationQuery: 'SELECT COUNT(*) as count FROM employees;',
  },

  {
    id: 'mysql-4',
    title: 'MySQL: FIELD() for sorting',
    description: 'Custom order sorting',
    difficulty: 'intermediate',
    dbType: 'mysql',
    category: 'company',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Display employees from departments "Development" (id=1), "Marketing" (id=2), "HR" (id=4) in exactly this order (not alphabetically!). Use ORDER BY FIELD(department_id, 1, 2, 4).',
    hint: 'FIELD(val, v1, v2, v3...) returns the position of val in the list (1, 2, 3...). Used for custom sorting.',
    sampleSolution:
      'SELECT first_name, last_name, department_id FROM employees WHERE department_id IN (1, 2, 4) ORDER BY FIELD(department_id, 1, 2, 4), last_name;',
    verificationQuery: 'SELECT COUNT(*) as count FROM employees WHERE department_id IN (1, 2, 4);',
  },

  {
    id: 'mysql-5',
    title: 'MySQL: GROUP_CONCAT',
    description: 'Concatenate values into string when grouping',
    difficulty: 'intermediate',
    dbType: 'mysql',
    category: 'company',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'For each department display the name and a comma-separated list of employee names (sorted alphabetically). Use GROUP_CONCAT(first_name ORDER BY first_name SEPARATOR ", ").',
    hint: 'GROUP_CONCAT(expr [ORDER BY ...] [SEPARATOR sep]) — MySQL function for concatenating strings in a group.',
    sampleSolution:
      "SELECT d.name, GROUP_CONCAT(e.first_name ORDER BY e.first_name SEPARATOR ', ') as employee_names FROM departments d LEFT JOIN employees e ON d.id = e.department_id GROUP BY d.id, d.name ORDER BY d.name;",
    verificationQuery: 'SELECT COUNT(*) as count FROM departments;',
  },

  {
    id: 'mysql-6',
    title: 'MySQL: DATE_FORMAT',
    description: 'Date formatting in MySQL',
    difficulty: 'intermediate',
    dbType: 'mysql',
    category: 'company',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Display employees: first_name, hire_date and formatted_hire_date in "DD.MM.YYYY" format (e.g. "15.03.2020"). Use DATE_FORMAT(hire_date, "%d.%m.%Y").',
    hint: 'DATE_FORMAT(date, format) formats a date: %d — day, %m — month, %Y — 4-digit year.',
    sampleSolution:
      "SELECT first_name, hire_date, DATE_FORMAT(hire_date, '%d.%m.%Y') as formatted_hire_date FROM employees ORDER BY hire_date;",
    verificationQuery: 'SELECT COUNT(*) as count FROM employees;',
  },

  {
    id: 'mysql-7',
    title: 'MySQL: DATEDIFF',
    description: 'Difference between dates in days',
    difficulty: 'intermediate',
    dbType: 'mysql',
    category: 'company',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Calculate each employee\'s tenure in days as of "2024-01-01". Display first_name and days_worked = DATEDIFF("2024-01-01", hire_date).',
    hint: 'DATEDIFF(date1, date2) returns the difference in days between two dates.',
    sampleSolution:
      'SELECT first_name, DATEDIFF("2024-01-01", hire_date) as days_worked FROM employees ORDER BY days_worked DESC;',
    verificationQuery: 'SELECT COUNT(*) as count FROM employees;',
  },

  {
    id: 'mysql-8',
    title: 'MySQL: INSERT ... ON DUPLICATE KEY UPDATE',
    description: 'UPSERT in MySQL — insert or update',
    difficulty: 'intermediate',
    dbType: 'mysql',
    category: 'company',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Insert a new employee: first_name="Test", last_name="Testov", email="test@company.ru", department_id=1, salary=100000, hire_date="2024-01-01". If the email already exists, update salary to 150000. Use ON DUPLICATE KEY UPDATE.',
    hint: 'INSERT INTO ... VALUES (...) ON DUPLICATE KEY UPDATE salary=150000 — MySQL equivalent of PostgreSQL UPSERT.',
    sampleSolution:
      "INSERT INTO employees (first_name, last_name, email, department_id, salary, hire_date) VALUES ('Тест', 'Тестов', 'test@company.ru', 1, 100000, '2024-01-01') ON DUPLICATE KEY UPDATE salary = 150000;",
    verificationQuery: "SELECT COUNT(*) as count FROM employees WHERE email = 'test@company.ru';",
  },

  {
    id: 'mysql-9',
    title: 'MySQL: VALUES() in ON DUPLICATE KEY UPDATE',
    description: 'Using VALUES() to reference new values',
    difficulty: 'intermediate',
    dbType: 'mysql',
    category: 'company',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Insert an employee with email="test@company.ru". On conflict, update salary to the value you tried to insert. Use VALUES(salary) to reference the new value.',
    hint: 'VALUES(col) inside ON DUPLICATE KEY UPDATE returns the value that was attempted to be inserted.',
    sampleSolution:
      "INSERT INTO employees (first_name, last_name, email, department_id, salary, hire_date) VALUES ('Новый', 'Сотрудник', 'test@company.ru', 1, 120000, '2024-06-01') ON DUPLICATE KEY UPDATE salary = VALUES(salary);",
    verificationQuery: "SELECT COUNT(*) as count FROM employees WHERE email = 'test@company.ru';",
  },

  {
    id: 'mysql-10',
    title: 'MySQL: REPLACE INTO',
    description: 'Replace existing row or insert new',
    difficulty: 'intermediate',
    dbType: 'mysql',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'Use REPLACE INTO to insert a category: name="Toys", description="Kids products". If a category with this unique key exists, it will be deleted and re-inserted.',
    hint: 'REPLACE INTO works like INSERT, but on unique key conflict it deletes the old row and inserts a new one.',
    sampleSolution: "REPLACE INTO categories (name, description) VALUES ('Игрушки', 'Детские товары');",
    verificationQuery: 'SELECT COUNT(*) as count FROM categories;',
  },

  {
    id: 'mysql-11',
    title: 'MySQL: FIND_IN_SET',
    description: 'Search in comma-separated string',
    difficulty: 'intermediate',
    dbType: 'mysql',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'Imagine the orders table has a shipping_city column with comma-separated values. Find all orders where shipping_city contains "Moscow". Use FIND_IN_SET("Moscow", shipping_city).',
    hint: 'FIND_IN_SET(str, str_list) returns the position of str in a comma-separated list, or 0 if not found.',
    sampleSolution:
      "SELECT id, shipping_city FROM orders WHERE FIND_IN_SET(shipping_city, 'Москва,Санкт-Петербург') > 0;",
    verificationQuery: 'SELECT COUNT(*) as count FROM orders;',
  },

  // ==================== MySQL ADVANCED TASKS ====================
  {
    id: 'mysql-12',
    title: 'MySQL: JSON_EXTRACT and ->> operator',
    description: 'Working with JSON in MySQL',
    difficulty: 'advanced',
    dbType: 'mysql',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'Imagine the products table has a JSON column metadata. Find products where metadata->>"$.brand" = "Samsung". Display name and brand. Use the ->> operator to extract JSON value as text.',
    hint: 'MySQL supports JSON type. col->>"$.key" extracts value as text, col->"$.key" as JSON.',
    sampleSolution: "SELECT name, metadata->>'$.brand' as brand FROM products WHERE metadata->>'$.brand' = 'Samsung';",
    verificationQuery: 'SELECT COUNT(*) as count FROM products;',
  },

  {
    id: 'mysql-13',
    title: 'MySQL: JSON_ARRAYAGG and JSON_OBJECTAGG',
    description: 'Aggregating data into JSON format',
    difficulty: 'advanced',
    dbType: 'mysql',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'For each category collect product names into a JSON array. Use JSON_ARRAYAGG(p.name). Display category_id and products_json.',
    hint: 'JSON_ARRAYAGG(expr) creates a JSON array from group values. JSON_OBJECTAGG(key, value) — JSON object.',
    sampleSolution:
      'SELECT c.id as category_id, c.name, JSON_ARRAYAGG(p.name) as products_json FROM categories c LEFT JOIN products p ON c.id = p.category_id GROUP BY c.id, c.name;',
    verificationQuery: 'SELECT COUNT(*) as count FROM categories;',
  },

  {
    id: 'mysql-14',
    title: 'MySQL: WINDOW functions with WINDOW clause',
    description: 'Named windows for reuse',
    difficulty: 'advanced',
    dbType: 'mysql',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'Display orders with rank by amount (total_amount) within each shipping city and a running total. Use WINDOW w AS (PARTITION BY shipping_city ORDER BY order_date) to reuse the window definition.',
    hint: 'MySQL allows defining a window once: WINDOW name AS (...), then using: ROW_NUMBER() OVER w, SUM() OVER w.',
    sampleSolution:
      'SELECT id, shipping_city, order_date, total_amount, ROW_NUMBER() OVER w as rn, SUM(total_amount) OVER w as running_total FROM orders WINDOW w AS (PARTITION BY shipping_city ORDER BY order_date) ORDER BY shipping_city, order_date;',
    verificationQuery: 'SELECT COUNT(*) as count FROM orders;',
  },

  {
    id: 'mysql-15',
    title: 'MySQL: CAST and CONVERT',
    description: 'Data type conversion',
    difficulty: 'advanced',
    dbType: 'mysql',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'Display products: name, price and price_as_char — price converted to CHAR using CAST(price AS CHAR). Also display price_dec = CAST(price AS DECIMAL(10,2)).',
    hint: 'MySQL: CAST(expr AS type) and CONVERT(expr, type) convert data types.',
    sampleSolution:
      'SELECT name, price, CAST(price AS CHAR) as price_as_char, CAST(price AS DECIMAL(10,2)) as price_dec FROM products ORDER BY price DESC;',
    verificationQuery: 'SELECT COUNT(*) as count FROM products;',
  },

  {
    id: 'mysql-16',
    title: 'MySQL: REGEXP_LIKE',
    description: 'Search with regular expressions',
    difficulty: 'advanced',
    dbType: 'mysql',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText: 'Find products whose name starts with a vowel (A, E, I, O, U). Use REGEXP_LIKE(name, "^[AEIOUaeiou]").',
    hint: 'MySQL REGEXP_LIKE(string, pattern) checks matching a regular expression. ^ — start of string, [...] — character set.',
    sampleSolution:
      "SELECT name FROM products WHERE REGEXP_LIKE(name, '^[AEIOUАЕЁИОУЫЭЮЯaeiouаеёиоуыэюя]') ORDER BY name;",
    verificationQuery: 'SELECT COUNT(*) as count FROM products;',
  },

  {
    id: 'mysql-17',
    title: 'MySQL: WITH ROLLUP',
    description: 'Adding summary rows with grouping',
    difficulty: 'advanced',
    dbType: 'mysql',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'Display order count and total amount by shipping city, adding a grand total row (WITH ROLLUP). The total row will have NULL for shipping_city.',
    hint: 'GROUP BY col WITH ROLLUP adds an extra row with aggregates across the entire table.',
    sampleSolution:
      'SELECT shipping_city, COUNT(*) as order_count, SUM(total_amount) as total FROM orders GROUP BY shipping_city WITH ROLLUP;',
    verificationQuery: 'SELECT COUNT(*) as count FROM orders;',
  },

  {
    id: 'mysql-18',
    title: 'MySQL: COALESCE in UPDATE',
    description: 'Update with NULL handling',
    difficulty: 'advanced',
    dbType: 'mysql',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText: 'Update all orders without a status (NULL): set status = "Not specified". Use WHERE status IS NULL.',
    hint: 'WHERE status IS NULL finds rows with NULL value.',
    sampleSolution: "UPDATE orders SET status = 'Не указан' WHERE status IS NULL;",
    verificationQuery: 'SELECT COUNT(*) as count FROM orders WHERE status = "Не указан";',
  },
];
