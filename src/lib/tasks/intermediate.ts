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
    description: 'Join two tables with INNER JOIN',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText: 'Display employee names (first_name, last_name) and their department names (name). Use INNER JOIN.',
    hint: 'INNER JOIN joins rows from two tables where keys match. Only rows with matches in both tables appear in the result. Aliases (e, d) shorten the query: employees e, departments d.',
    sampleSolution:
      'SELECT e.first_name, e.last_name, d.name as department_name FROM employees e INNER JOIN departments d ON e.department_id = d.id;',
    verificationQuery: 'SELECT COUNT(*) as count FROM employees e INNER JOIN departments d ON e.department_id = d.id;',
  },

  {
    id: 'intermediate-2',
    title: 'LEFT JOIN',
    description: 'Join tables with LEFT JOIN',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Display all departments and the number of employees in each. Include departments with no employees (count = 0).',
    hint: 'LEFT JOIN returns ALL rows from the left table, even if there is no match in the right table. For unmatched rows, right table columns will be NULL. COUNT(e.id) does not count NULLs, so departments without employees show 0.',
    sampleSolution:
      'SELECT d.name as department_name, COUNT(e.id) as employee_count FROM departments d LEFT JOIN employees e ON d.id = e.department_id GROUP BY d.id, d.name ORDER BY employee_count DESC;',
    verificationQuery: 'SELECT COUNT(*) as count FROM departments;',
  },

  {
    id: 'intermediate-3',
    title: 'GROUP BY with HAVING',
    description: 'Filter grouped data',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Find departments where the average salary is greater than 125000. Display the department name and average salary.',
    hint: 'GROUP BY + HAVING allows filtering by results of aggregate functions.',
    sampleSolution:
      'SELECT d.name, AVG(e.salary) as avg_salary FROM employees e JOIN departments d ON e.department_id = d.id GROUP BY d.id, d.name HAVING AVG(e.salary) > 125000;',
    verificationQuery:
      'SELECT COUNT(*) as count FROM (SELECT d.id FROM employees e JOIN departments d ON e.department_id = d.id GROUP BY d.id HAVING AVG(e.salary) > 125000);',
  },

  {
    id: 'intermediate-4',
    title: 'Subqueries',
    description: 'Use a subquery in WHERE',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText: 'Find employees whose salary is above the company average. Display first_name, last_name and salary.',
    hint: 'A subquery in WHERE runs ONCE and returns a single value (scalar subquery). First AVG(salary) is computed for the whole table, then the outer query compares each salary with this number. Execution order: subquery then outer query.',
    sampleSolution:
      'SELECT first_name, last_name, salary FROM employees WHERE salary > (SELECT AVG(salary) FROM employees);',
    verificationQuery: 'SELECT COUNT(*) as count FROM employees WHERE salary > (SELECT AVG(salary) FROM employees);',
  },

  {
    id: 'intermediate-5',
    title: 'CASE WHEN',
    description: 'Conditional expression in SELECT',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'For each employee display first_name, last_name, salary and salary category: "High" (>=140000), "Average" (>=110000 and <140000), "Low" (<110000).',
    hint: 'Use CASE WHEN ... THEN ... ELSE ... END.',
    sampleSolution:
      "SELECT first_name, last_name, salary, CASE WHEN salary >= 140000 THEN 'High' WHEN salary >= 110000 THEN 'Average' ELSE 'Low' END as salary_category FROM employees;",
    verificationQuery: 'SELECT COUNT(*) as count FROM employees WHERE salary >= 140000;',
  },

  {
    id: 'intermediate-6',
    title: 'String Functions',
    description: 'String concatenation and transformation',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Create a list of employees in the format "Lastname I. (email)". Use SUBSTR for the first letter of the first name.',
    hint: 'SUBSTR(string, 1, 1) extracts the first character. || is the concatenation operator.',
    sampleSolution:
      "SELECT last_name || ' ' || SUBSTR(first_name, 1, 1) || '. (' || email || ')' as contact_info FROM employees WHERE email IS NOT NULL;",
    verificationQuery: 'SELECT COUNT(*) as count FROM employees WHERE email IS NOT NULL;',
  },

  {
    id: 'intermediate-7',
    title: 'Multiple WHERE Conditions',
    description: 'Combine conditions with AND, OR, IN, BETWEEN',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Find active employees (is_active = 1) from departments "Development" (id=1) or "Marketing" (id=2) with salary from 110000 to 145000.',
    hint: 'Use AND, OR and BETWEEN to combine conditions.',
    sampleSolution:
      'SELECT first_name, last_name, salary FROM employees WHERE is_active = 1 AND department_id IN (1, 2) AND salary BETWEEN 110000 AND 145000 ORDER BY salary DESC;',
    verificationQuery:
      'SELECT COUNT(*) as count FROM employees WHERE is_active = 1 AND department_id IN (1, 2) AND salary BETWEEN 110000 AND 145000;',
  },

  {
    id: 'intermediate-8',
    title: 'Multiple JOINs',
    description: 'Join three or more tables',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText: 'Display employee name, project name and role in the project. Include only active employees.',
    hint: 'Join employees, assignments and projects with two JOINs.',
    sampleSolution:
      'SELECT e.first_name, e.last_name, p.name as project_name, a.role FROM employees e JOIN assignments a ON e.id = a.employee_id JOIN projects p ON a.project_id = p.id WHERE e.is_active = 1 ORDER BY p.name, e.last_name;',
    verificationQuery:
      'SELECT COUNT(*) as count FROM employees e JOIN assignments a ON e.id = a.employee_id JOIN projects p ON a.project_id = p.id WHERE e.is_active = 1;',
  },

  // ==================== NEW TOPIC TASKS ====================
  {
    id: 'intermediate-9',
    title: 'UNION',
    description: 'Combine two query results with UNION',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Get a list of all unique names from first_name and location from departments. Display one column named name.',
    hint: 'Use UNION to combine two SELECT statements with alias name.',
    sampleSolution: 'SELECT first_name as name FROM employees UNION SELECT location as name FROM departments;',
    verificationQuery:
      'SELECT COUNT(*) as count FROM (SELECT first_name as name FROM employees UNION SELECT location as name FROM departments);',
  },

  {
    id: 'intermediate-10',
    title: 'INTERSECT and EXCEPT',
    description: 'Find set intersection and difference',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText: 'Find employees who do NOT participate in any project. Display first_name and last_name.',
    hint: 'Use EXCEPT: all employees MINUS employees in projects.',
    sampleSolution:
      'SELECT first_name, last_name FROM employees EXCEPT SELECT e.first_name, e.last_name FROM employees e JOIN assignments a ON e.id = a.employee_id;',
    verificationQuery:
      'SELECT COUNT(*) as count FROM employees e WHERE e.id NOT IN (SELECT a.employee_id FROM assignments a);',
  },

  {
    id: 'intermediate-11',
    title: 'INSERT, UPDATE, DELETE',
    description: 'Insert, update, and delete data',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    schema: EMPTY_ORDERS_SCHEMA,
    taskText:
      'Add a new order: product "Mouse" (product_id=2), quantity 3, date "2024-01-15", customer "Ivanov". Then update stock for product "Mouse" (decrease by 3). Display the final stock of product "Mouse".',
    hint: 'First INSERT INTO orders, then UPDATE products SET stock = stock - 3, then SELECT stock FROM products WHERE id = 2.',
    sampleSolution:
      "INSERT INTO orders (product_id, quantity, order_date, customer_name) VALUES (2, 3, '2024-01-15', 'Ivanov'); UPDATE products SET stock = stock - 3 WHERE id = 2; SELECT stock FROM products WHERE id = 2;",
    verificationQuery: 'SELECT stock FROM products WHERE id = 2;',
  },

  {
    id: 'intermediate-12',
    title: 'FULL OUTER JOIN',
    description: 'Full outer join of tables',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Display all departments and all employees, including departments without employees and employees without a department. Use FULL OUTER JOIN emulation via UNION of LEFT and RIGHT JOINs. Display department_name and employee_name (first_name).',
    hint: 'SQLite does not support FULL OUTER JOIN. Emulate it: LEFT JOIN UNION RIGHT JOIN with COALESCE.',
    sampleSolution:
      'SELECT d.name as department_name, e.first_name as employee_name FROM departments d LEFT JOIN employees e ON d.id = e.department_id UNION SELECT d.name, e.first_name FROM employees e LEFT JOIN departments d ON e.department_id = d.id;',
    verificationQuery: 'SELECT COUNT(*) as count FROM departments UNION ALL SELECT first_name FROM employees;',
  },

  {
    id: 'intermediate-13',
    title: 'CROSS JOIN',
    description: 'Cartesian product of tables',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Create all possible combinations of departments and projects (Cartesian product). Display department name and project name, sorted by department name.',
    hint: 'CROSS JOIN creates all combinations of rows from two tables.',
    sampleSolution:
      'SELECT d.name as department_name, p.name as project_name FROM departments d CROSS JOIN projects p ORDER BY d.name, p.name;',
    verificationQuery: 'SELECT COUNT(*) as count FROM departments CROSS JOIN projects;',
  },

  // ==================== COALESCE AND NULL FUNCTIONS ====================
  {
    id: 'intermediate-14',
    title: 'COALESCE - NULL Replacement',
    description: 'Use COALESCE for NULL handling',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Display all employees (first_name, last_name). If an employee has no department_id, display "No department". Use COALESCE.',
    hint: 'COALESCE(value, replacement) returns the first non-NULL argument. JOIN with departments and COALESCE(d.name, "No department").',
    sampleSolution:
      "SELECT e.first_name, e.last_name, COALESCE(d.name, 'No department') as department_name FROM employees e LEFT JOIN departments d ON e.department_id = d.id;",
    verificationQuery: 'SELECT COUNT(*) as count FROM employees;',
  },

  {
    id: 'intermediate-15',
    title: 'NULLIF - Conditional NULL',
    description: 'Return NULL when values match',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText: 'Calculate the average salary, excluding employees with a salary of exactly 100000. Use NULLIF.',
    hint: 'NULLIF(salary, 100000) returns NULL for salary 100000, and AVG will ignore those rows.',
    sampleSolution: 'SELECT AVG(NULLIF(salary, 100000)) as avg_salary_excluding_100k FROM employees;',
    verificationQuery: 'SELECT AVG(salary) as avg_all FROM employees WHERE salary != 100000;',
  },

  {
    id: 'intermediate-16',
    title: 'Combining COALESCE with Aggregate Functions',
    description: 'Handle NULL in aggregate results',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'For each department display the name and maximum salary. If a department has no employees, display 0 instead of NULL. Use COALESCE with LEFT JOIN.',
    hint: 'LEFT JOIN departments with employees, COALESCE(MAX(e.salary), 0) for departments without employees.',
    sampleSolution:
      'SELECT d.name, COALESCE(MAX(e.salary), 0) as max_salary FROM departments d LEFT JOIN employees e ON d.id = e.department_id GROUP BY d.id, d.name;',
    verificationQuery: 'SELECT COUNT(*) as count FROM departments;',
  },

  // ==================== TRANSACTIONS ====================
  {
    id: 'intermediate-17',
    title: 'Transactions - BEGIN and COMMIT',
    description: 'Atomic execution of multiple operations',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    schema: EMPTY_ORDERS_SCHEMA,
    taskText:
      'Execute a transaction: add product "Printer" (price=15000, stock=20) and immediately create an order for this product (quantity=2, order_date="2024-02-01", customer_name="Petrov"). Commit the transaction.',
    hint: 'BEGIN; INSERT INTO products ...; INSERT INTO orders ...; COMMIT;',
    sampleSolution:
      "BEGIN; INSERT INTO products (name, price, stock) VALUES ('Printer', 15000, 20); INSERT INTO orders (product_id, quantity, order_date, customer_name) VALUES (6, 2, '2024-02-01', 'Petrov'); COMMIT;",
    verificationQuery: 'SELECT COUNT(*) as count FROM products WHERE name = "Printer";',
  },

  {
    id: 'intermediate-18',
    title: 'Transactions - ROLLBACK',
    description: 'Rollback changes on error',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    schema: EMPTY_ORDERS_SCHEMA,
    taskText:
      'Start a transaction, add product "Scanner" (price=12000, stock=15), then ROLLBACK. Verify the product did not appear in the table (display all products).',
    hint: 'BEGIN; INSERT INTO products ...; ROLLBACK; SELECT * FROM products;',
    sampleSolution:
      "BEGIN; INSERT INTO products (name, price, stock) VALUES ('Scanner', 12000, 15); ROLLBACK; SELECT * FROM products;",
    verificationQuery: 'SELECT COUNT(*) as count FROM products WHERE name = "Scanner";',
  },

  {
    id: 'intermediate-19',
    title: 'Transactions with Condition Checks',
    description: 'Check business rules inside a transaction',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    schema: EMPTY_ORDERS_SCHEMA,
    taskText:
      'Create a transaction: check if there is enough stock for product "Mouse" (id=2) for order quantity=100. If stock >= 100, create the order and update stock. Otherwise ROLLBACK. Display the result.',
    hint: 'Use BEGIN, check stock, if condition fails — ROLLBACK.',
    sampleSolution:
      'BEGIN; SELECT stock FROM products WHERE id = 2; -- stock=50, which is < 100, so ROLLBACK; ROLLBACK; SELECT * FROM products WHERE id = 2;',
    verificationQuery: 'SELECT stock FROM products WHERE id = 2;',
  },

  // ==================== DATE/TIME FUNCTIONS ====================
  {
    id: 'intermediate-20',
    title: 'Date Functions',
    description: 'DATE, strftime and date formatting',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText: 'Display first_name, hire_date and hire year of each employee. Use strftime.',
    hint: 'strftime("%Y", hire_date) extracts the year from a date.',
    sampleSolution: 'SELECT first_name, hire_date, strftime("%Y", hire_date) as hire_year FROM employees;',
    verificationQuery: 'SELECT COUNT(*) as count FROM employees;',
  },

  {
    id: 'intermediate-21',
    title: 'Date Difference',
    description: 'Calculate intervals between dates',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      "Calculate the number of days from each employee's hire date to 2024-01-01. Display first_name and days_worked.",
    hint: 'julianday("2024-01-01") - julianday(hire_date) gives the difference in days.',
    sampleSolution:
      'SELECT first_name, CAST(julianday("2024-01-01") - julianday(hire_date) AS INTEGER) as days_worked FROM employees ORDER BY days_worked DESC;',
    verificationQuery: 'SELECT COUNT(*) as count FROM employees;',
  },

  {
    id: 'intermediate-22',
    title: 'Filtering by Date',
    description: 'Find records in a date range',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText: 'Find employees hired in 2021. Display first_name, last_name and hire_date.',
    hint: 'strftime("%Y", hire_date) = "2021" or hire_date BETWEEN "2021-01-01" AND "2021-12-31".',
    sampleSolution: 'SELECT first_name, last_name, hire_date FROM employees WHERE strftime("%Y", hire_date) = "2021";',
    verificationQuery: 'SELECT COUNT(*) as count FROM employees WHERE strftime("%Y", hire_date) = "2021";',
  },

  {
    id: 'intermediate-23',
    title: 'Dates in Projects',
    description: 'Analyze project durations',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'For completed projects display the name and duration in days. For active projects display "In progress".',
    hint: 'CASE WHEN end_date IS NULL THEN "In progress" ELSE julianday(end_date) - julianday(start_date) END.',
    sampleSolution:
      "SELECT name, CASE WHEN end_date IS NULL THEN 'In progress' ELSE CAST(julianday(end_date) - julianday(start_date) AS INTEGER) END as duration_days FROM projects ORDER BY duration_days DESC;",
    verificationQuery: 'SELECT COUNT(*) as count FROM projects;',
  },

  // ==================== SHOP TASKS ====================
  {
    id: 'ch-35',
    title: 'ClickHouse: groupArray + arrayJoin',
    description: 'Collect products into arrays by category and unnest',
    difficulty: 'intermediate',
    dbType: 'clickhouse',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'For each category collect product names into a products array using groupArray(). Display category name and products. Sort by name. Additionally show that arrayJoin() expands an array back into rows: SELECT arrayJoin(groupArray(DISTINCT shipping_city)) AS city FROM orders;',
    hint: 'groupArray(expr) collects all values in a group into an array. arrayJoin(arr) expands the array into separate rows — the reverse operation.',
    sampleSolution:
      'SELECT c.name, groupArray(p.name) AS products FROM products p JOIN categories c ON p.category_id = c.id GROUP BY c.name ORDER BY c.name;',
    verificationQuery:
      'SELECT COUNT(*) as count FROM categories WHERE (SELECT COUNT(*) FROM products WHERE category_id = categories.id) > 0;',
  },

  {
    id: 'ch-36',
    title: 'ClickHouse: avgIf for Filtered Analytics',
    description: 'Average price of active products only',
    difficulty: 'intermediate',
    dbType: 'clickhouse',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'For each category calculate the average price of only active products (is_active = 1). Use avgIf(price, is_active = 1). Display category name and avg_active_price (round to 2 decimals). Sort by avg_active_price DESC.',
    hint: 'avgIf(expr, condition) calculates average only for rows matching the condition. Similar functions: sumIf, countIf, minIf, maxIf.',
    sampleSolution:
      'SELECT c.name, ROUND(avgIf(p.price, p.is_active = 1), 2) AS avg_active_price FROM products p JOIN categories c ON p.category_id = c.id GROUP BY c.name ORDER BY avg_active_price DESC;',
    verificationQuery: 'SELECT COUNT(*) as count FROM categories;',
  },

  {
    id: 'ch-41',
    title: 'ClickHouse: having + countIf',
    description: 'Categories with more than 3 products',
    difficulty: 'intermediate',
    dbType: 'clickhouse',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'Find categories with more than 3 products. Use GROUP BY category_id, HAVING COUNT(*) > 3. For each matching category display name, product_count and expensive_count (products with price > 5000 using countIf). Sort by product_count DESC.',
    hint: 'HAVING filters groups after GROUP BY. countIf(condition) counts rows matching the condition within a group.',
    sampleSolution:
      'SELECT c.name, COUNT(*) AS product_count, countIf(p.price > 5000) AS expensive_count FROM products p JOIN categories c ON p.category_id = c.id GROUP BY c.name, c.id HAVING COUNT(*) > 3 ORDER BY product_count DESC;',
    verificationQuery:
      'SELECT COUNT(*) as count FROM categories WHERE (SELECT COUNT(*) FROM products WHERE category_id = categories.id) > 3;',
  },

  {
    id: 'ch-43',
    title: 'ClickHouse: groupUniqArray for Unique Lists',
    description: 'Unique shipping cities by customer',
    difficulty: 'intermediate',
    dbType: 'clickhouse',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'For each shipping city collect unique customer identifiers into an array. Use groupUniqArray(customer_id). Display shipping_city, unique_customers (array) and total_orders. Sort by shipping_city.',
    hint: 'groupUniqArray(expr) collects only unique values into an array (unlike groupArray which may contain duplicates).',
    sampleSolution:
      'SELECT shipping_city, groupUniqArray(customer_id) AS unique_customers, COUNT(*) AS total_orders FROM orders GROUP BY shipping_city ORDER BY shipping_city;',
    verificationQuery: 'SELECT COUNT(DISTINCT shipping_city) as count FROM orders;',
  },

  {
    id: 'pg-10',
    title: 'PostgreSQL: EXTRACT',
    description: 'Extract date parts using EXTRACT',
    difficulty: 'intermediate',
    dbType: 'postgresql',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'Extract the month from order_date for each order. Display order_id, order_date and month_num = EXTRACT(MONTH FROM order_date). Count orders in each month (order_count).',
    hint: 'EXTRACT(MONTH FROM order_date) returns the month number (1-12) from a date.',
    sampleSolution:
      'SELECT EXTRACT(MONTH FROM order_date) AS month_num, COUNT(*) AS order_count FROM orders GROUP BY month_num ORDER BY month_num;',
    verificationQuery:
      "SELECT CAST(STRFTIME('%m', order_date) AS INTEGER) AS month_num, COUNT(*) AS order_count FROM orders GROUP BY month_num ORDER BY month_num;",
  },

  {
    id: 'pg-21',
    title: 'PostgreSQL: Multiple CTEs',
    description: 'Multiple CTEs in one query',
    difficulty: 'intermediate',
    dbType: 'postgresql',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'Using two CTEs (WITH ... AS), display product categories with product count and average price. First CTE — category_stats: calculates product_count and avg_price for each category_id. Second CTE — category_info: joins the result with category names. Display name, product_count, avg_price. Sort by product_count DESC.',
    hint: 'WITH cte1 AS (...), cte2 AS (...) SELECT ... — multiple CTEs separated by commas. The second CTE can reference the first.',
    sampleSolution:
      'WITH category_stats AS (SELECT category_id, COUNT(*) AS product_count, ROUND(AVG(price), 2) AS avg_price FROM products GROUP BY category_id), category_info AS (SELECT c.name, cs.product_count, cs.avg_price FROM categories c JOIN category_stats cs ON c.id = cs.category_id) SELECT name, product_count, avg_price FROM category_info ORDER BY product_count DESC;',
    verificationQuery:
      'SELECT COUNT(*) as count FROM categories WHERE (SELECT COUNT(*) FROM products WHERE category_id = categories.id) > 0;',
  },

  {
    id: 'pg-25',
    title: 'PostgreSQL: FILTER in Aggregates',
    description: 'Conditional aggregation with FILTER clause',
    difficulty: 'intermediate',
    dbType: 'postgresql',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'For each product display the average rating only among reviews with comments (comment IS NOT NULL). Use AVG(rating) FILTER (WHERE comment IS NOT NULL). Display product name, total_reviews and avg_with_comment. Only products with reviews. Sort by avg_with_comment DESC.',
    hint: 'FILTER (WHERE condition) inside an aggregate function allows considering only rows that satisfy the condition, without needing CASE.',
    sampleSolution:
      'SELECT p.name, COUNT(r.id) AS total_reviews, ROUND(AVG(r.rating) FILTER (WHERE r.comment IS NOT NULL), 2) AS avg_with_comment FROM products p JOIN reviews r ON p.id = r.product_id GROUP BY p.id, p.name HAVING total_reviews > 0 ORDER BY avg_with_comment DESC;',
    verificationQuery:
      'SELECT COUNT(*) as count FROM products p WHERE EXISTS (SELECT 1 FROM reviews r WHERE r.product_id = p.id);',
  },

  {
    id: 'pg-27',
    title: 'PostgreSQL: ARRAY and ANY Operator',
    description: 'Check array membership with ANY',
    difficulty: 'intermediate',
    dbType: 'postgresql',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'Find all products from categories "Electronics" (id=1), "Sports" (id=4) and "Home & Garden" (id=5). Use category_id = ANY(ARRAY[1, 4, 5]) instead of IN. Display name and price. Sort by name.',
    hint: '= ANY(ARRAY[...]) — PostgreSQL syntax for membership check, equivalent to IN, but works with arrays.',
    sampleSolution: 'SELECT name, price FROM products WHERE category_id = ANY(ARRAY[1, 4, 5]) ORDER BY name;',
    verificationQuery: 'SELECT COUNT(*) as count FROM products WHERE category_id IN (1, 4, 5);',
  },

  {
    id: 'pg-30',
    title: 'PostgreSQL: CASE in ORDER BY',
    description: 'Conditional sorting with CASE',
    difficulty: 'intermediate',
    dbType: 'postgresql',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'Display all products sorted by the following rule: active products first (is_active = TRUE), then inactive. Within each group — by descending price. Use CASE in ORDER BY. Display name, price and is_active.',
    hint: 'ORDER BY CASE WHEN is_active = TRUE THEN 0 ELSE 1 END, price DESC — CASE defines sort priority: 0 for active, 1 for inactive.',
    sampleSolution:
      'SELECT name, price, is_active FROM products ORDER BY CASE WHEN is_active = TRUE THEN 0 ELSE 1 END, price DESC;',
    verificationQuery: 'SELECT COUNT(*) as count FROM products;',
  },

  {
    id: 'pg-9',
    title: 'PostgreSQL: COALESCE',
    description: 'Handle NULL values with COALESCE',
    difficulty: 'intermediate',
    dbType: 'postgresql',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'For each product display: name, price and price with 10% discount (discounted_price). If end_date is NULL, display "Not ended". Use COALESCE for safe NULL handling. Apply this to the table orders: display order_id, shipping_city, and status_or_default = COALESCE(status, \'Not specified\').',
    hint: "COALESCE(status, 'Not specified') returns status if not NULL, otherwise the default string.",
    sampleSolution:
      "SELECT id AS order_id, shipping_city, COALESCE(status, 'Not specified') AS status_or_default FROM orders ORDER BY id;",
    verificationQuery: 'SELECT COUNT(*) as count FROM orders;',
  },

  {
    id: 'shop-i1',
    title: 'Products with Categories',
    description: 'JOIN products + categories',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText: 'Display product name (products.name), category name (categories.name) and price. Use INNER JOIN.',
    hint: 'Join products with categories on category_id.',
    sampleSolution:
      'SELECT p.name as product_name, c.name as category_name, p.price FROM products p JOIN categories c ON p.category_id = c.id ORDER BY c.name, p.price DESC;',
    verificationQuery: 'SELECT COUNT(*) as count FROM products p JOIN categories c ON p.category_id = c.id;',
  },

  {
    id: 'shop-i2',
    title: 'Customers and Their Orders',
    description: 'JOIN orders + customers',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      "Display customer name (first_name, last_name), order date (order_date) and amount (total_amount). Only delivered orders (status = 'delivered').",
    hint: 'JOIN customers with orders on customer_id, add WHERE to filter by status.',
    sampleSolution:
      "SELECT c.first_name, c.last_name, o.order_date, o.total_amount FROM customers c JOIN orders o ON c.id = o.customer_id WHERE o.status = 'delivered' ORDER BY o.order_date DESC;",
    verificationQuery:
      "SELECT COUNT(*) as count FROM customers c JOIN orders o ON c.id = o.customer_id WHERE o.status = 'delivered';",
  },

  {
    id: 'shop-i3',
    title: 'Loyal Customers',
    description: 'GROUP BY + HAVING for customers',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText: 'Find customers with 3 or more orders. Display first_name, last_name and order count.',
    hint: 'GROUP BY customer_id with HAVING COUNT(*) >= 3.',
    sampleSolution:
      'SELECT c.first_name, c.last_name, COUNT(o.id) as order_count FROM customers c JOIN orders o ON c.id = o.customer_id GROUP BY c.id, c.first_name, c.last_name HAVING COUNT(o.id) >= 3 ORDER BY order_count DESC;',
    verificationQuery:
      'SELECT COUNT(*) as count FROM (SELECT o.customer_id FROM orders o GROUP BY o.customer_id HAVING COUNT(o.id) >= 3);',
  },

  {
    id: 'shop-i4',
    title: 'Popular Products',
    description: 'Subquery for average quantity',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'Find products that were ordered in total (quantity) greater than the average quantity of all ordered products. Display product name and total quantity.',
    hint: 'Subquery: SELECT AVG(quantity) FROM order_items. Main query with SUM(quantity) GROUP BY product_id.',
    sampleSolution:
      'SELECT p.name as product_name, SUM(oi.quantity) as total_sold FROM order_items oi JOIN products p ON oi.product_id = p.id GROUP BY p.id, p.name HAVING SUM(oi.quantity) > (SELECT AVG(quantity) FROM order_items) ORDER BY total_sold DESC;',
    verificationQuery:
      'SELECT COUNT(*) as count FROM (SELECT product_id FROM order_items GROUP BY product_id HAVING SUM(quantity) > (SELECT AVG(quantity) FROM order_items));',
  },

  {
    id: 'shop-i5',
    title: 'Customer Segmentation',
    description: 'CASE WHEN for classification',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'Divide customers into segments by total order amount: "VIP" (amount >= 50000), "Active" (>= 10000), "Regular" (< 10000). Display customer name, total amount and segment.',
    hint: 'CTE with order totals, then CASE WHEN for segmentation.',
    sampleSolution:
      "WITH customer_totals AS (SELECT c.first_name, c.last_name, SUM(o.total_amount) as total_spent FROM customers c JOIN orders o ON c.id = o.customer_id GROUP BY c.id, c.first_name, c.last_name) SELECT first_name, last_name, total_spent, CASE WHEN total_spent >= 50000 THEN 'VIP' WHEN total_spent >= 10000 THEN 'Active' ELSE 'Regular' END as segment FROM customer_totals ORDER BY total_spent DESC;",
    verificationQuery:
      'SELECT COUNT(*) as count FROM (SELECT o.customer_id FROM orders o GROUP BY o.customer_id HAVING SUM(o.total_amount) >= 50000);',
  },

  {
    id: 'shop-i6',
    title: 'Products with Reviews',
    description: 'JOIN with aggregation',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'Display product names, average review rating (ROUND to 1 decimal) and review count. Only products with reviews.',
    hint: 'JOIN products with reviews, GROUP BY product_id. Use ROUND(AVG(rating), 1).',
    sampleSolution:
      'SELECT p.name as product_name, ROUND(AVG(r.rating), 1) as avg_rating, COUNT(r.id) as review_count FROM products p JOIN reviews r ON p.id = r.product_id GROUP BY p.id, p.name HAVING COUNT(r.id) > 0 ORDER BY avg_rating DESC, review_count DESC;',
    verificationQuery: 'SELECT COUNT(DISTINCT product_id) as count FROM reviews;',
  },

  // ==================== COMPANY TASKS (PostgreSQL/ClickHouse) ====================
  {
    id: 'ch-37',
    title: 'ClickHouse: multiIf for Categorization',
    description: 'Categorize salaries by ranges',
    difficulty: 'intermediate',
    dbType: 'clickhouse',
    category: 'company',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'For each employee determine the salary range: "low" (< 100000), "average" (100000–120000), "high" (120000–150000), "very high" (> 150000). Use multiIf(). Display first_name, last_name, salary and salary_range. Sort by salary DESC.',
    hint: 'multiIf(cond1, val1, cond2, val2, ..., elseVal) — a chain of conditions, similar to CASE WHEN in SQL. Conditions are checked in order.',
    sampleSolution:
      "SELECT first_name, last_name, salary, multiIf(salary < 100000, 'low', salary < 120000, 'average', salary < 150000, 'high', 'very high') AS salary_range FROM employees ORDER BY salary DESC;",
    verificationQuery: 'SELECT COUNT(*) as count FROM employees;',
  },

  {
    id: 'ch-44',
    title: 'ClickHouse: toYear + toMonth for Analysis',
    description: 'Employees by hire year and month',
    difficulty: 'intermediate',
    dbType: 'clickhouse',
    category: 'company',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Group employees by hire year and month. Use toYear(toDate(hire_date)) and toMonth(toDate(hire_date)). Display hire_year, hire_month, emp_count and avg_salary (round to 2 decimals). Sort by hire_year, hire_month.',
    hint: 'toYear(date) extracts the year, toMonth(date) — the month. toDate() converts a string to Date type.',
    sampleSolution:
      'SELECT toYear(toDate(hire_date)) AS hire_year, toMonth(toDate(hire_date)) AS hire_month, COUNT(*) AS emp_count, ROUND(AVG(salary), 2) AS avg_salary FROM employees GROUP BY hire_year, hire_month ORDER BY hire_year, hire_month;',
    verificationQuery: 'SELECT COUNT(*) as count FROM employees;',
  },

  {
    id: 'pg-1',
    title: 'PostgreSQL: ILIKE',
    description: 'Case-insensitive pattern search',
    difficulty: 'intermediate',
    dbType: 'postgresql',
    category: 'company',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Find all employees whose first name contains the letter "a" in any case. Use the ILIKE operator. Display first_name, last_name.',
    hint: "ILIKE works like LIKE but ignores case: WHERE first_name ILIKE '%a%'",
    sampleSolution: "SELECT first_name, last_name FROM employees WHERE first_name ILIKE '%a%';",
    verificationQuery: "SELECT COUNT(*) as count FROM employees WHERE LOWER(first_name) LIKE '%a%';",
  },

  {
    id: 'pg-17',
    title: 'PostgreSQL: ON CONFLICT DO UPDATE (UPSERT)',
    description: 'Insert or update on unique key conflict',
    difficulty: 'intermediate',
    dbType: 'postgresql',
    category: 'company',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      "Write INSERT for a new employee: first_name = 'Oleg', last_name = 'Savelyev', email = 'ivan@company.ru' (this email already exists in the table), department_id = 1, salary = 175000, hire_date = '2024-03-01', is_active = TRUE. Use ON CONFLICT (email) DO UPDATE SET salary = EXCLUDED.salary — if an employee with this email already exists, update their salary.",
    hint: 'ON CONFLICT (column) DO UPDATE SET ... allows UPSERT: insert a new record or update an existing one on unique key conflict. EXCLUDED refers to the new values.',
    sampleSolution:
      "INSERT INTO employees (first_name, last_name, email, department_id, salary, hire_date, is_active) VALUES ('Oleg', 'Savelyev', 'ivan@company.ru', 1, 175000, '2024-03-01', TRUE) ON CONFLICT (email) DO UPDATE SET salary = EXCLUDED.salary;",
    verificationQuery: "SELECT COUNT(*) as count FROM employees WHERE email = 'ivan@company.ru';",
  },

  {
    id: 'pg-19',
    title: 'PostgreSQL: FULL OUTER JOIN',
    description: 'Full outer join of two tables',
    difficulty: 'intermediate',
    dbType: 'postgresql',
    category: 'company',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Display all employees with their project assignments, including employees without assignments and assignments without employees. Use FULL OUTER JOIN. Display first_name, last_name, project_id, role. Sort by employee_id.',
    hint: 'FULL OUTER JOIN returns all rows from both tables: matching rows are combined, unmatched rows are filled with NULL.',
    sampleSolution:
      'SELECT e.first_name, e.last_name, a.project_id, a.role FROM employees e FULL OUTER JOIN assignments a ON e.id = a.employee_id ORDER BY e.id, a.project_id;',
    verificationQuery: 'SELECT COUNT(*) as count FROM employees e LEFT JOIN assignments a ON e.id = a.employee_id;',
  },

  {
    id: 'pg-2',
    title: 'PostgreSQL: STRING_AGG',
    description: 'String aggregation with STRING_AGG',
    difficulty: 'intermediate',
    dbType: 'postgresql',
    category: 'company',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'For each department display a comma-separated list of employee names. Use STRING_AGG. Result: department name and employee_names string.',
    hint: "STRING_AGG(first_name, ', ' ORDER BY first_name) concatenates names with a comma.",
    sampleSolution:
      "SELECT d.name, STRING_AGG(e.first_name, ', ' ORDER BY e.first_name) AS employee_names FROM departments d JOIN employees e ON d.id = e.department_id GROUP BY d.name ORDER BY d.name;",
    verificationQuery:
      'SELECT d.name, GROUP_CONCAT(e.first_name, ", ") AS employee_names FROM departments d JOIN employees e ON d.id = e.department_id GROUP BY d.name;',
  },

  {
    id: 'pg-24',
    title: 'PostgreSQL: DATE_TRUNC',
    description: 'Truncate date to quarter with DATE_TRUNC',
    difficulty: 'intermediate',
    dbType: 'postgresql',
    category: 'company',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      "Group employees by hire quarter. Use DATE_TRUNC('quarter', hire_date::date) to truncate the date to the start of the quarter. Display hire_quarter, emp_count and avg_salary (round to 2 decimals). Sort by hire_quarter.",
    hint: "DATE_TRUNC('quarter', date) rounds down to the start of the corresponding quarter (January 1, April 1, July 1, or October 1).",
    sampleSolution:
      "SELECT DATE_TRUNC('quarter', hire_date::date) AS hire_quarter, COUNT(*) AS emp_count, ROUND(AVG(salary), 2) AS avg_salary FROM employees GROUP BY hire_quarter ORDER BY hire_quarter;",
    verificationQuery: "SELECT COUNT(DISTINCT STRFTIME('%Y', hire_date)) AS count FROM employees;",
  },

  {
    id: 'pg-29',
    title: 'PostgreSQL: INTERVAL',
    description: 'Time interval arithmetic',
    difficulty: 'intermediate',
    dbType: 'postgresql',
    category: 'company',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      "Find all employees whose work experience exceeds 3 years. Use INTERVAL: hire_date < CURRENT_DATE - INTERVAL '3 years'. Display first_name, last_name and hire_date. Sort by hire_date.",
    hint: "CURRENT_DATE - INTERVAL '3 years' calculates the date 3 years ago. INTERVAL allows working with time intervals: years, months, days, etc.",
    sampleSolution:
      "SELECT first_name, last_name, hire_date FROM employees WHERE hire_date < CURRENT_DATE - INTERVAL '3 years' ORDER BY hire_date;",
    verificationQuery: "SELECT COUNT(*) as count FROM employees WHERE hire_date < DATE('now', '-3 years');",
  },

  {
    id: 'pg-3',
    title: 'PostgreSQL: ARRAY_AGG',
    description: 'Create array with ARRAY_AGG',
    difficulty: 'intermediate',
    dbType: 'postgresql',
    category: 'company',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'For each department display an array of employee email addresses. Use ARRAY_AGG. Result: department name and employee_emails (array).',
    hint: 'ARRAY_AGG(email) returns an array of email addresses for each department.',
    sampleSolution:
      'SELECT d.name, ARRAY_AGG(e.email) AS employee_emails FROM departments d JOIN employees e ON d.id = e.department_id GROUP BY d.name ORDER BY d.name;',
    verificationQuery:
      'SELECT d.name, GROUP_CONCAT(e.email, "|") AS employee_emails FROM departments d JOIN employees e ON d.id = e.department_id GROUP BY d.name;',
  },

  {
    id: 'pg-34',
    title: 'PostgreSQL: BOOL_AND and BOOL_OR',
    description: 'Aggregate boolean functions',
    difficulty: 'intermediate',
    dbType: 'postgresql',
    category: 'company',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'For each department check: are all employees active? Is there at least one inactive? Use BOOL_AND(is_active) to check "all active" and BOOL_OR(NOT is_active) to check "has inactive". Display department name, all_active, has_inactive and emp_count. Sort by department name.',
    hint: 'BOOL_AND(expr) returns TRUE if expr = TRUE for all rows in the group. BOOL_OR(expr) returns TRUE if expr = TRUE for at least one row.',
    sampleSolution:
      'SELECT d.name, BOOL_AND(e.is_active) AS all_active, BOOL_OR(NOT e.is_active) AS has_inactive, COUNT(*) AS emp_count FROM departments d JOIN employees e ON d.id = e.department_id GROUP BY d.name ORDER BY d.name;',
    verificationQuery:
      'SELECT COUNT(*) as count FROM departments d JOIN employees e ON d.id = e.department_id GROUP BY d.name;',
  },

  {
    id: 'pg-4',
    title: 'PostgreSQL: TRUE/FALSE',
    description: 'Use boolean literals TRUE and FALSE',
    difficulty: 'intermediate',
    dbType: 'postgresql',
    category: 'company',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'In PostgreSQL the is_active column can be compared with boolean literals TRUE and FALSE. Find all inactive employees (is_active = FALSE). Display first_name, last_name, is_active.',
    hint: 'WHERE is_active = FALSE — PostgreSQL supports boolean literals directly.',
    sampleSolution: 'SELECT first_name, last_name, is_active FROM employees WHERE is_active = FALSE;',
    verificationQuery: 'SELECT COUNT(*) as count FROM employees WHERE is_active = 0;',
  },

  {
    id: 'pg-5',
    title: 'PostgreSQL: Type Casting (::)',
    description: 'Type casting syntax with ::',
    difficulty: 'intermediate',
    dbType: 'postgresql',
    category: 'company',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Cast salary to INTEGER using PostgreSQL syntax ::INTEGER. Display first_name, last_name and salary as an integer (salary_int). Sort by salary descending.',
    hint: 'salary::INTEGER casts REAL to INTEGER in PostgreSQL.',
    sampleSolution: 'SELECT first_name, last_name, salary::INTEGER AS salary_int FROM employees ORDER BY salary DESC;',
    verificationQuery:
      'SELECT first_name, last_name, CAST(salary AS INTEGER) AS salary_int FROM employees ORDER BY salary DESC;',
  },

  {
    id: 'pg-7',
    title: 'PostgreSQL: IS TRUE / IS FALSE',
    description: 'Check boolean values with IS TRUE and IS FALSE',
    difficulty: 'intermediate',
    dbType: 'postgresql',
    category: 'company',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'In PostgreSQL you can use IS TRUE and IS FALSE to check boolean values. Find all active employees using is_active IS TRUE. Display first_name, last_name, is_active. Sort by last_name.',
    hint: 'WHERE is_active IS TRUE — a more precise check for boolean values than = TRUE.',
    sampleSolution:
      'SELECT first_name, last_name, is_active FROM employees WHERE is_active IS TRUE ORDER BY last_name;',
    verificationQuery: 'SELECT COUNT(*) as count FROM employees WHERE is_active = 1;',
  },

  // ==================== ANALYTICS TASKS (ClickHouse) ====================
  {
    id: 'analytics-i1',
    title: 'JOIN Users and Events',
    description: 'LEFT JOIN users with events',
    difficulty: 'intermediate',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: ANALYTICS_SCHEMA,
    taskText: 'Display username and their event count. Use LEFT JOIN of users and events tables.',
    hint: 'LEFT JOIN ensures all users appear in the result, even without events.',
    sampleSolution:
      'SELECT u.username, count(e.event_id) as event_count FROM users u LEFT JOIN events e ON u.user_id = e.user_id GROUP BY u.user_id, u.username ORDER BY event_count DESC;',
    verificationQuery: 'SELECT COUNT(*) as count FROM users;',
  },

  {
    id: 'analytics-i2',
    title: 'HAVING - Group Filtering',
    description: 'GROUP BY + HAVING for aggregate filtering',
    difficulty: 'intermediate',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: ANALYTICS_SCHEMA,
    taskText: 'Find countries with more than 5 events. Use GROUP BY country + HAVING with a condition.',
    hint: 'HAVING count(*) > 5 filters groups after aggregation.',
    sampleSolution:
      'SELECT country, count(*) as event_count FROM events GROUP BY country HAVING count(*) > 5 ORDER BY event_count DESC;',
    verificationQuery:
      'SELECT COUNT(*) as count FROM (SELECT country FROM events GROUP BY country HAVING count(*) > 5);',
  },

  {
    id: 'analytics-i3',
    title: 'toStartOfDay - Daily Grouping',
    description: 'ClickHouse toStartOfDay() function',
    difficulty: 'intermediate',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: ANALYTICS_SCHEMA,
    taskText: 'Count events by day (events table). Use the ClickHouse function toStartOfDay() for grouping.',
    hint: 'toStartOfDay(event_time) rounds DateTime down to the start of the day.',
    sampleSolution:
      'SELECT toStartOfDay(event_time) as day, count(*) as event_count FROM events GROUP BY day ORDER BY day;',
    verificationQuery: 'SELECT COUNT(DISTINCT date(event_time)) as days FROM events;',
  },

  {
    id: 'analytics-i4',
    title: 'toStartOfMonth - Purchase Analytics',
    description: 'Group purchases by month',
    difficulty: 'intermediate',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: ANALYTICS_SCHEMA,
    taskText: 'Display purchase month, purchase count and total amount by month. Use toStartOfMonth() for grouping.',
    hint: 'toStartOfMonth(purchase_date) returns the first day of the month for each purchase.',
    sampleSolution:
      'SELECT toStartOfMonth(purchase_date) as month, count(*) as purchase_count, sum(amount) as total_amount FROM purchases GROUP BY month ORDER BY month;',
    verificationQuery: 'SELECT COUNT(DISTINCT purchase_date) as days FROM purchases;',
  },

  {
    id: 'analytics-i5',
    title: 'multiIf - Multiple Conditions',
    description: 'ClickHouse multiIf() for classification',
    difficulty: 'intermediate',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: ANALYTICS_SCHEMA,
    taskText:
      'Classify users by age: "young" (<25), "middle" (25-34), "senior" (>=35). Display username, age and category. Use multiIf().',
    hint: "multiIf(age < 25, 'young', age <= 34, 'middle', 'senior') — works like CASE WHEN with multiple conditions.",
    sampleSolution:
      "SELECT username, age, multiIf(age < 25, 'young', age <= 34, 'middle', 'senior') as age_category FROM users ORDER BY age;",
    verificationQuery: 'SELECT COUNT(*) as count FROM users;',
  },

  {
    id: 'ch-1',
    title: 'sumIf - Conditional Sum',
    description: 'Conditional sum with sumIf',
    difficulty: 'intermediate',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: CLICKHOUSE_EVENTS_SCHEMA,
    taskText:
      'Calculate the total duration of only page_view events. Use sumIf(). Display the result as total_page_view_duration.',
    hint: 'sumIf(expr, condition) sums only rows matching the condition.',
    sampleSolution: "SELECT sumIf(duration, event_type = 'page_view') as total_page_view_duration FROM events;",
    verificationQuery: 'SELECT 1 as count;',
  },

  {
    id: 'ch-2',
    title: 'countIf - Conditional Count',
    description: 'Conditional count with countIf',
    difficulty: 'intermediate',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: CLICKHOUSE_EVENTS_SCHEMA,
    taskText: 'Count premium users from Moscow. Use countIf(). Display the result as premium_moscow.',
    hint: 'countIf(condition) counts rows matching the condition.',
    sampleSolution: "SELECT countIf(is_premium = 1 AND city = 'Moscow') as premium_moscow FROM users;",
    verificationQuery: 'SELECT 1 as count;',
  },

  {
    id: 'ch-3',
    title: 'toStartOfMonth - Monthly Grouping',
    description: 'Group by month with toStartOfMonth',
    difficulty: 'intermediate',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: CLICKHOUSE_EVENTS_SCHEMA,
    taskText:
      'Group purchases by month. For each month display purchase count (cnt) and total amount (total). Use toStartOfMonth().',
    hint: 'toStartOfMonth(date) truncates date to the first day of the month.',
    sampleSolution:
      'SELECT toStartOfMonth(purchase_date) as month, count() as cnt, SUM(amount) as total FROM purchases GROUP BY month ORDER BY month;',
    verificationQuery: 'SELECT 1 as count;',
  },

  {
    id: 'ch-33',
    title: 'ClickHouse: dateDiff with INTERVAL',
    description: 'Days between first and last event per user',
    difficulty: 'intermediate',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: CLICKHOUSE_EVENTS_SCHEMA,
    taskText:
      "For each user calculate the number of days between their first and last event. Use dateDiff('day', MIN(event_time), MAX(event_time)). Display user_id, first_event, last_event and days_span. Sort by user_id.",
    hint: "dateDiff(unit, start, end) calculates the difference between two dates. Supported units: 'day', 'hour', 'minute', 'second', etc.",
    sampleSolution:
      "SELECT user_id, MIN(event_time) AS first_event, MAX(event_time) AS last_event, dateDiff('day', MIN(event_time), MAX(event_time)) AS days_span FROM events GROUP BY user_id ORDER BY user_id;",
    verificationQuery: 'SELECT COUNT(*) as count FROM events;',
  },

  {
    id: 'ch-39',
    title: 'ClickHouse: uniqExact vs COUNT DISTINCT',
    description: 'Count unique users per day',
    difficulty: 'intermediate',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: CLICKHOUSE_EVENTS_SCHEMA,
    taskText:
      'For each day count unique users in two ways: uniqExact(user_id) and COUNT(DISTINCT user_id). Display event_date, unique_exact and unique_countd. uniqExact is more precise but slower. Sort by event_date.',
    hint: 'uniqExact() counts unique values exactly (using a hash table). COUNT(DISTINCT) in ClickHouse can be approximate. For small data the result is the same.',
    sampleSolution:
      'SELECT toDate(event_time) AS event_date, uniqExact(user_id) AS unique_exact, count(DISTINCT user_id) AS unique_countd FROM events GROUP BY event_date ORDER BY event_date;',
    verificationQuery: 'SELECT COUNT(*) as count FROM events;',
  },

  {
    id: 'ch-4',
    title: 'groupArray - Arrays from Groups',
    description: 'Create arrays from groups with groupArray',
    difficulty: 'intermediate',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: CLICKHOUSE_EVENTS_SCHEMA,
    taskText:
      'For each user collect unique visited pages into an array. Use groupArray(DISTINCT page). Display user_id and visited_pages.',
    hint: 'groupArray(expr) creates an array from all values in the group.',
    sampleSolution:
      'SELECT user_id, groupArray(DISTINCT page) as visited_pages FROM events GROUP BY user_id ORDER BY user_id;',
    verificationQuery: 'SELECT 1 as count;',
  },

  {
    id: 'ch-46',
    title: 'ClickHouse: has() for Array Search',
    description: 'Users who visited a specific page',
    difficulty: 'intermediate',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: CLICKHOUSE_EVENTS_SCHEMA,
    taskText:
      "Find users who visited the page '/home'. Use a subquery: first collect each user's visited pages into an array using groupArray(DISTINCT page), then filter with has(visited_pages, '/home'). Display user_id and visited_pages. Sort by user_id.",
    hint: 'has(array, value) returns 1 if the array contains the value, and 0 otherwise. Works with arrays created by groupArray.',
    sampleSolution:
      "SELECT user_id, groupArray(DISTINCT page) AS visited_pages FROM events GROUP BY user_id HAVING has(groupArray(DISTINCT page), '/home') ORDER BY user_id;",
    verificationQuery: 'SELECT COUNT(*) as count FROM events;',
  },

  {
    id: 'ch-5',
    title: 'multiIf - Multiple Conditions',
    description: 'Multiple conditions with multiIf',
    difficulty: 'intermediate',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: CLICKHOUSE_EVENTS_SCHEMA,
    taskText:
      'Classify users by age group: "young" (up to 25), "middle" (25-34), "experienced" (35-44), "senior" (45+). Use multiIf(). Display username, age and age_group.',
    hint: 'multiIf(cond1, val1, cond2, val2, ..., elseVal) evaluates conditions sequentially.',
    sampleSolution:
      "SELECT username, age, multiIf(age < 25, 'young', age < 35, 'middle', age < 45, 'experienced', 'senior') as age_group FROM users ORDER BY age;",
    verificationQuery: 'SELECT COUNT(*) as count FROM users;',
  },

  {
    id: 'ch-6',
    title: 'formatDateTime - Date Formatting',
    description: 'Date formatting with formatDateTime',
    difficulty: 'intermediate',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: CLICKHOUSE_EVENTS_SCHEMA,
    taskText:
      "Group events by hour. Use formatDateTime(event_time, '%Y-%m-%d %H:00') for grouping. Display event_time, hour_bucket and event count (events_count).",
    hint: 'formatDateTime(date, format) formats dates using strftime-style patterns.',
    sampleSolution:
      "SELECT event_time, formatDateTime(event_time, '%Y-%m-%d %H:00') as hour_bucket, COUNT() as events_count FROM events GROUP BY event_time, hour_bucket ORDER BY event_time;",
    verificationQuery: 'SELECT 1 as count;',
  },

  {
    id: 'ch-intermediate-1',
    title: 'sumIf and countIf',
    description: 'Conditional aggregations',
    difficulty: 'intermediate',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: ANALYTICS_SCHEMA,
    taskText:
      "For each user display name, total purchase count and total amount of only completed purchases (purchases, status = 'completed').",
    hint: "Use sumIf(amount, status = 'completed') and countIf(status = 'completed').",
    sampleSolution:
      "SELECT u.username, countIf(p.status = 'completed') as completed_count, sumIf(p.amount, p.status = 'completed') as total_spent FROM users u LEFT JOIN purchases p ON u.user_id = p.user_id GROUP BY u.user_id, u.username ORDER BY total_spent DESC;",
    verificationQuery: 'SELECT COUNT(*) as count FROM users;',
  },

  {
    id: 'ch-intermediate-2',
    title: 'toStartOfMonth',
    description: 'Monthly grouping',
    difficulty: 'intermediate',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: ANALYTICS_SCHEMA,
    taskText: 'Count purchases and total amount by month (purchases table). Use toStartOfMonth.',
    hint: 'toStartOfMonth(purchase_date) returns the start of the month for grouping.',
    sampleSolution:
      'SELECT toStartOfMonth(purchase_date) as month, count(*) as purchase_count, sum(amount) as total_amount FROM purchases GROUP BY month ORDER BY month;',
    verificationQuery: 'SELECT COUNT(DISTINCT toStartOfMonth(purchase_date)) as months FROM purchases;',
  },

  {
    id: 'ch-intermediate-3',
    title: 'avgIf',
    description: 'Conditional average',
    difficulty: 'intermediate',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: ANALYTICS_SCHEMA,
    taskText: 'Find the average duration of only page_view events, grouped by device.',
    hint: "avgIf(duration, event_type = 'page_view')",
    sampleSolution:
      "SELECT device, avgIf(duration, event_type = 'page_view') as avg_duration FROM events WHERE event_type = 'page_view' GROUP BY device ORDER BY avg_duration DESC;",
    verificationQuery: "SELECT COUNT(DISTINCT device) as devices FROM events WHERE event_type = 'page_view';",
  },

  {
    id: 'ch-intermediate-4',
    title: 'multiIf',
    description: 'Multiple conditions',
    difficulty: 'intermediate',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: ANALYTICS_SCHEMA,
    taskText:
      'Classify users by age: "young" (<25), "middle" (25-34), "senior" (>=35). Display name, age and category.',
    hint: "multiIf(age < 25, 'young', age <= 34, 'middle', 'senior')",
    sampleSolution:
      "SELECT username, age, multiIf(age < 25, 'young', age <= 34, 'middle', 'senior') as age_category FROM users ORDER BY age;",
    verificationQuery: 'SELECT COUNT(*) as count FROM users;',
  },

  {
    id: 'pg-11',
    title: 'ILIKE - Case-Insensitive Search',
    description: 'Case-insensitive pattern matching',
    difficulty: 'intermediate',
    dbType: 'postgresql',
    category: 'analytics',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Find all employees whose first name contains the substring "an" in any case. Use ILIKE. Display first_name and last_name.',
    hint: 'ILIKE performs case-insensitive pattern matching in PostgreSQL.',
    sampleSolution: "SELECT first_name, last_name FROM employees WHERE first_name ILIKE '%an%';",
    verificationQuery:
      "SELECT COUNT(*) as count FROM employees WHERE first_name LIKE '%an%' OR first_name LIKE '%An%';",
  },

  {
    id: 'pg-12',
    title: 'EXTRACT - Date Part Extraction',
    description: 'Extract date components with EXTRACT',
    difficulty: 'intermediate',
    dbType: 'postgresql',
    category: 'analytics',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Extract the year from hire_date for each employee. Display first_name, last_name and hire_year = EXTRACT(YEAR FROM hire_date). Sort by hire_year.',
    hint: 'EXTRACT(YEAR FROM column) returns the year part of a date.',
    sampleSolution:
      'SELECT first_name, last_name, EXTRACT(YEAR FROM hire_date) as hire_year FROM employees ORDER BY hire_year;',
    verificationQuery: 'SELECT COUNT(*) as count FROM employees;',
  },

  {
    id: 'pg-13',
    title: 'STRING_AGG - String Aggregation',
    description: 'String aggregation with STRING_AGG',
    difficulty: 'intermediate',
    dbType: 'postgresql',
    category: 'analytics',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'For each department concatenate employee names (first_name + last_name) with commas. Use STRING_AGG. Display department name and employees.',
    hint: 'STRING_AGG(expr, delimiter) concatenates non-null input values into a string.',
    sampleSolution:
      "SELECT d.name as department, STRING_AGG(e.first_name || ' ' || e.last_name, ', ') as employees FROM departments d JOIN employees e ON d.id = e.department_id GROUP BY d.name;",
    verificationQuery: 'SELECT COUNT(*) as count FROM departments;',
  },

  // ==================== EXAM TASKS ====================
  {
    id: 'ch-exam-4',
    title: 'Exam: ClickHouse sumIf for Project Hours',
    description: 'Lead developer hours by project',
    difficulty: 'intermediate',
    dbType: 'clickhouse',
    category: 'exam',
    examGroup: 'ch-exam-intermediate',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      "For each project calculate: lead developer hours (sumIf(hours_worked, role = 'Lead Developer')) and total hours. Use the assignments table. Display project_id, lead_hours and total_hours. Sort by project_id.",
    hint: 'sumIf(expr, condition) sums expr only for rows where condition = true. This is more compact than CASE WHEN inside SUM.',
    sampleSolution:
      "SELECT project_id, sumIf(hours_worked, role = 'Lead Developer') AS lead_hours, SUM(hours_worked) AS total_hours FROM assignments GROUP BY project_id ORDER BY project_id;",
    verificationQuery: 'SELECT COUNT(*) as count FROM assignments;',
  },

  {
    id: 'ch-exam-5',
    title: 'Exam: ClickHouse groupArray',
    description: 'Employee list by department',
    difficulty: 'intermediate',
    dbType: 'clickhouse',
    category: 'exam',
    examGroup: 'ch-exam-intermediate',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      "For each department collect employee names into an array. Use groupArray(first_name || ' ' || last_name). Display department and employees (array). Sort by department.",
    hint: 'groupArray(expr) creates an array from expr values in each group. Element order is not guaranteed. For unique values use groupUniqArray.',
    sampleSolution:
      "SELECT d.name AS department, groupArray(e.first_name || ' ' || e.last_name) AS employees FROM departments d JOIN employees e ON d.id = e.department_id GROUP BY d.name ORDER BY d.name;",
    verificationQuery: 'SELECT COUNT(*) as count FROM departments;',
  },

  {
    id: 'ch-exam-6',
    title: 'Exam: ClickHouse multiIf for Salary Groups',
    description: 'Salary groups with multiIf',
    difficulty: 'intermediate',
    dbType: 'clickhouse',
    category: 'exam',
    examGroup: 'ch-exam-intermediate',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Divide employees into salary groups using multiIf: A (< 100K), B (100K–120K), C (120K–140K), D (140K–160K), E (160K+). Display first_name, last_name, salary and bracket. Sort by salary.',
    hint: 'multiIf(cond1, val1, cond2, val2, ..., elseVal) — a chain of conditions. More convenient than nested if(). Conditions are evaluated sequentially.',
    sampleSolution:
      "SELECT first_name, last_name, salary, multiIf(salary < 100000, 'A', salary < 120000, 'B', salary < 140000, 'C', salary < 160000, 'D', 'E') AS bracket FROM employees ORDER BY salary;",
    verificationQuery: 'SELECT COUNT(*) as count FROM employees;',
  },

  {
    id: 'exam-i1',
    title: 'Exam: Multi-Table JOIN',
    description: 'Test - JOIN of three tables',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    category: 'exam',
    examGroup: 'exam-intermediate',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Display employee names, project names and hours worked, but only for projects with status "active". Sort by hours descending.',
    hint: "JOIN employees, assignments, projects. WHERE status = 'active'.",
    sampleSolution:
      "SELECT e.first_name, e.last_name, p.name as project_name, a.hours_worked FROM employees e JOIN assignments a ON e.id = a.employee_id JOIN projects p ON a.project_id = p.id WHERE p.status = 'active' ORDER BY a.hours_worked DESC;",
    verificationQuery:
      "SELECT COUNT(*) as count FROM employees e JOIN assignments a ON e.id = a.employee_id JOIN projects p ON a.project_id = p.id WHERE p.status = 'active';",
  },

  {
    id: 'exam-i2',
    title: 'Exam: Subquery with EXISTS',
    description: 'Test - correlated subquery',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    category: 'exam',
    examGroup: 'exam-intermediate',
    schema: EMPLOYEES_SCHEMA,
    taskText: 'Find departments that have at least one inactive employee (is_active = 0). Display the department name.',
    hint: 'WHERE EXISTS (SELECT 1 FROM employees WHERE department_id = d.id AND is_active = 0).',
    sampleSolution:
      'SELECT d.name FROM departments d WHERE EXISTS (SELECT 1 FROM employees e WHERE e.department_id = d.id AND e.is_active = 0);',
    verificationQuery: 'SELECT 2 as expected_count;',
  },

  {
    id: 'exam-i3',
    title: 'Exam: Complex CASE WHEN',
    description: 'Test - CASE in SELECT + GROUP BY',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    category: 'exam',
    examGroup: 'exam-intermediate',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Create a report: for each department display name, employee count and budget status: "Surplus" (budget > total salary), "Deficit" (otherwise).',
    hint: 'CTE for salary total, then JOIN with CASE WHEN.',
    sampleSolution:
      "WITH dept_salaries AS (SELECT department_id, SUM(salary) as total_salary FROM employees GROUP BY department_id) SELECT d.name, COUNT(e.id) as emp_count, ds.total_salary, d.budget, CASE WHEN d.budget > ds.total_salary THEN 'Surplus' ELSE 'Deficit' END as budget_status FROM departments d LEFT JOIN employees e ON d.id = e.department_id LEFT JOIN dept_salaries ds ON d.id = ds.department_id GROUP BY d.id, d.name, d.budget, ds.total_salary ORDER BY d.name;",
    verificationQuery: 'SELECT COUNT(*) as count FROM departments;',
  },

  {
    id: 'exam-i4',
    title: 'Exam: IN Subquery',
    description: 'Test - WHERE IN with subquery',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    category: 'exam',
    examGroup: 'exam-intermediate',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Find employees who work on active projects but work less than 100 hours. Display first_name, last_name, hours_worked.',
    hint: 'WHERE employee_id IN (SELECT employee_id FROM assignments JOIN projects ...) AND hours_worked < 100.',
    sampleSolution:
      "SELECT DISTINCT e.first_name, e.last_name, a.hours_worked FROM employees e JOIN assignments a ON e.id = a.employee_id JOIN projects p ON a.project_id = p.id WHERE p.status = 'active' AND a.hours_worked < 100 ORDER BY a.hours_worked;",
    verificationQuery:
      "SELECT COUNT(*) as count FROM (SELECT DISTINCT e.id FROM employees e JOIN assignments a ON e.id = a.employee_id JOIN projects p ON a.project_id = p.id WHERE p.status = 'active' AND a.hours_worked < 100);",
  },

  {
    id: 'exam-i5',
    title: 'Exam: Complex Aggregation',
    description: 'Test - GROUP BY + HAVING + JOIN',
    difficulty: 'intermediate',
    dbType: 'sqlite',
    category: 'exam',
    examGroup: 'exam-intermediate',
    schema: SHOP_SCHEMA,
    taskText:
      'Find cities where the total order amount exceeds 20000 rubles. Display shipping_city and total order amount.',
    hint: 'GROUP BY shipping_city with HAVING SUM(total_amount) > 20000.',
    sampleSolution:
      'SELECT shipping_city, SUM(total_amount) as total FROM orders GROUP BY shipping_city HAVING SUM(total_amount) > 20000 ORDER BY total DESC;',
    verificationQuery:
      'SELECT COUNT(*) as count FROM (SELECT shipping_city FROM orders GROUP BY shipping_city HAVING SUM(total_amount) > 20000);',
  },

  {
    id: 'pg-exam-4',
    title: 'Exam: PostgreSQL STRING_AGG',
    description: 'Employee list by department',
    difficulty: 'intermediate',
    dbType: 'postgresql',
    category: 'exam',
    examGroup: 'pg-exam-intermediate',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      "For each department display a comma-separated list of employee names. Use STRING_AGG(first_name || ' ' || last_name, ', '). Display department and employees. Sort by department.",
    hint: 'STRING_AGG(expr, delimiter) concatenates string values in a group with a delimiter. Works only with text expressions.',
    sampleSolution:
      "SELECT d.name AS department, STRING_AGG(e.first_name || ' ' || e.last_name, ', ') AS employees FROM departments d LEFT JOIN employees e ON d.id = e.department_id GROUP BY d.name ORDER BY d.name;",
    verificationQuery: 'SELECT COUNT(*) as count FROM departments;',
  },

  {
    id: 'pg-exam-5',
    title: 'Exam: PostgreSQL EXTRACT for Year Grouping',
    description: 'Hire analysis by year',
    difficulty: 'intermediate',
    dbType: 'postgresql',
    category: 'exam',
    examGroup: 'pg-exam-intermediate',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Group employees by hire year. Use EXTRACT(YEAR FROM hire_date::date). For each year display hire_year, emp_count and avg_salary (round to 2 decimals). Sort by hire_year.',
    hint: 'EXTRACT(field FROM source) extracts a date part: YEAR, MONTH, DAY, HOUR, etc. ::date casts the string to date type.',
    sampleSolution:
      'SELECT EXTRACT(YEAR FROM hire_date::date) AS hire_year, COUNT(*) AS emp_count, ROUND(AVG(salary), 2) AS avg_salary FROM employees GROUP BY hire_year ORDER BY hire_year;',
    verificationQuery: "SELECT COUNT(DISTINCT STRFTIME('%Y', hire_date)) as count FROM employees;",
  },

  {
    id: 'pg-exam-6',
    title: 'Exam: PostgreSQL ARRAY_AGG for Arrays',
    description: 'Collect project names by department',
    difficulty: 'intermediate',
    dbType: 'postgresql',
    category: 'exam',
    examGroup: 'pg-exam-intermediate',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'For each department collect all project names into an array. Use ARRAY_AGG(p.name). Display department and projects (array). Sort by department. Include departments without projects (LEFT JOIN).',
    hint: 'ARRAY_AGG(expr) creates an array from group values. If no rows — result is NULL (can wrap in COALESCE with LEFT JOIN).',
    sampleSolution:
      'SELECT d.name AS department, ARRAY_AGG(p.name) AS projects FROM departments d LEFT JOIN projects p ON d.id = p.department_id GROUP BY d.name ORDER BY d.name;',
    verificationQuery: 'SELECT COUNT(*) as count FROM departments;',
  },
];
