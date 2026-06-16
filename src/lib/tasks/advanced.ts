/**
 * Advanced Task Definitions
 * Auto-generated from training-tasks.ts
 */

import type { TrainingTask } from './types';
import {
  ANALYTICS_SCHEMA,
  CLICKHOUSE_EVENTS_SCHEMA,
  EMPLOYEES_SCHEMA,
  EMPTY_ORDERS_SCHEMA,
  INDEX_DEMO_SCHEMA,
  SHOP_SCHEMA,
} from './schemas';

export const ADVANCED_TASKS: TrainingTask[] = [
  // ==================== ADVANCED TASKS ====================
  {
    id: 'advanced-1',
    title: 'Window Functions - ROW_NUMBER',
    description: 'Number rows with ROW_NUMBER',
    difficulty: 'advanced',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Assign each employee a rank by salary within their department (1 — highest salary). Display: department_id, first_name, last_name, salary, rank.',
    hint: 'Window functions calculate a value for each row without collapsing groups like GROUP BY. PARTITION BY divides rows into groups (like GROUP BY), ORDER BY within the window defines the order. ROW_NUMBER() assigns a unique number 1, 2, 3... to each row within a partition.',
    sampleSolution:
      'SELECT department_id, first_name, last_name, salary, ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY salary DESC) as rank FROM employees WHERE department_id IS NOT NULL ORDER BY department_id, rank;',
    verificationQuery: 'SELECT COUNT(*) as count FROM employees WHERE department_id IS NOT NULL;',
  },

  {
    id: 'advanced-2',
    title: 'Window Functions - RANK and DENSE_RANK',
    description: 'Ranking with and without gaps',
    difficulty: 'advanced',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      "Display departments, total hours worked per department and each project's share of total department hours. Use SUM() with a window function.",
    hint: 'SUM(hours_worked) OVER (PARTITION BY department_id) gives the sum per department.',
    sampleSolution:
      'SELECT p.name as project_name, d.name as department_name, a.hours_worked, SUM(a.hours_worked) OVER (PARTITION BY p.department_id) as dept_total_hours, ROUND(CAST(a.hours_worked AS REAL) / SUM(a.hours_worked) OVER (PARTITION BY p.department_id) * 100, 1) as percentage FROM assignments a JOIN projects p ON a.project_id = p.id JOIN departments d ON p.department_id = d.id ORDER BY d.name, a.hours_worked DESC;',
    verificationQuery:
      'SELECT COUNT(DISTINCT p.department_id) as count FROM assignments a JOIN projects p ON a.project_id = p.id;',
  },

  {
    id: 'advanced-3',
    title: 'CTE (WITH clause)',
    description: 'Common table expressions',
    difficulty: 'advanced',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Using a CTE, find departments where the total budget is greater than the total salary of all its employees.',
    hint: 'A CTE (WITH) is a named subquery that makes complex queries more readable. Unlike a subquery in FROM, a CTE can be used multiple times in a query and is easier to read. First define the salary totals by department in a CTE, then compare with the budget.',
    sampleSolution:
      'WITH dept_salaries AS (SELECT department_id, SUM(salary) as total_salary FROM employees WHERE department_id IS NOT NULL GROUP BY department_id) SELECT d.name, d.budget, ds.total_salary, d.budget - ds.total_salary as surplus FROM departments d JOIN dept_salaries ds ON d.id = ds.department_id WHERE d.budget > ds.total_salary;',
    verificationQuery:
      'SELECT COUNT(*) as count FROM (SELECT d.id FROM departments d JOIN (SELECT department_id, SUM(salary) as total_salary FROM employees WHERE department_id IS NOT NULL GROUP BY department_id) ds ON d.id = ds.department_id WHERE d.budget > ds.total_salary);',
  },

  {
    id: 'advanced-4',
    title: 'Recursive CTE',
    description: 'Recursive queries for hierarchical data',
    difficulty: 'advanced',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Create a recursive CTE that generates a number table from 1 to 10, and for each number display its square and cube.',
    hint: 'Base case: SELECT 1 as n. Recursion: SELECT n+1 FROM cte WHERE n < 10.',
    sampleSolution:
      'WITH RECURSIVE numbers AS (SELECT 1 as n UNION ALL SELECT n + 1 FROM numbers WHERE n < 10) SELECT n, n * n as square, n * n * n as cube FROM numbers;',
    verificationQuery: 'SELECT 10 as expected_count;',
  },

  {
    id: 'advanced-5',
    title: 'Self Join',
    description: 'Join a table with itself',
    difficulty: 'advanced',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Find all pairs of employees from the same department with a salary difference greater than 5000. Display both employee names and the salary difference.',
    hint: 'Join employees with itself on department_id, but with different aliases. Exclude matches and duplicates.',
    sampleSolution:
      'SELECT e1.first_name as emp1_name, e1.last_name as emp1_last, e2.first_name as emp2_name, e2.last_name as emp2_last, ABS(e1.salary - e2.salary) as salary_diff FROM employees e1 JOIN employees e2 ON e1.department_id = e2.department_id AND e1.id < e2.id WHERE ABS(e1.salary - e2.salary) > 5000 ORDER BY salary_diff DESC;',
    verificationQuery:
      'SELECT COUNT(*) as count FROM employees e1 JOIN employees e2 ON e1.department_id = e2.department_id AND e1.id < e2.id WHERE ABS(e1.salary - e2.salary) > 5000;',
  },

  {
    id: 'advanced-6',
    title: 'Complex Query with Subqueries',
    description: 'Combine subqueries and JOIN',
    difficulty: 'advanced',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Find employees who work on completed projects and have worked more than 150 hours. Display employee name, project name, role and hours.',
    hint: 'Subquery for completed projects, then JOIN with assignments and employees.',
    sampleSolution:
      "SELECT e.first_name, e.last_name, p.name as project_name, a.role, a.hours_worked FROM employees e JOIN assignments a ON e.id = a.employee_id JOIN projects p ON a.project_id = p.id WHERE p.status = 'completed' AND a.hours_worked > 150 ORDER BY a.hours_worked DESC;",
    verificationQuery:
      "SELECT COUNT(*) as count FROM employees e JOIN assignments a ON e.id = a.employee_id JOIN projects p ON a.project_id = p.id WHERE p.status = 'completed' AND a.hours_worked > 150;",
  },

  {
    id: 'advanced-7',
    title: 'Multiple CTEs and Analytics',
    description: 'Multi-level CTEs with window functions',
    difficulty: 'advanced',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'For each department display: name, employee count, average salary, employee with highest salary and total project hours.',
    hint: 'Use multiple CTEs: one for employee statistics, another for project hours.',
    sampleSolution:
      "WITH emp_stats AS (SELECT department_id, COUNT(*) as emp_count, AVG(salary) as avg_salary, MAX(salary) as max_salary FROM employees WHERE department_id IS NOT NULL GROUP BY department_id), top_earners AS (SELECT e.department_id, e.first_name, e.last_name, e.salary, ROW_NUMBER() OVER (PARTITION BY e.department_id ORDER BY e.salary DESC) as rn FROM employees e WHERE e.department_id IS NOT NULL), project_hours AS (SELECT p.department_id, SUM(a.hours_worked) as total_hours FROM projects p JOIN assignments a ON p.id = a.project_id GROUP BY p.department_id) SELECT d.name as department, es.emp_count, ROUND(es.avg_salary) as avg_salary, te.first_name || ' ' || te.last_name as top_earner, te.salary as top_salary, COALESCE(ph.total_hours, 0) as total_project_hours FROM departments d LEFT JOIN emp_stats es ON d.id = es.department_id LEFT JOIN top_earners te ON d.id = te.department_id AND te.rn = 1 LEFT JOIN project_hours ph ON d.id = ph.department_id ORDER BY es.emp_count DESC;",
    verificationQuery: 'SELECT COUNT(*) as count FROM departments;',
  },

  {
    id: 'advanced-8',
    title: 'HAVING vs WHERE and NULL Handling',
    description: 'Filter NULL values and complex aggregation',
    difficulty: 'advanced',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Find projects that involve employees from 3 or more different departments. Display project name and unique department count.',
    hint: 'JOIN projects → assignments → employees, GROUP BY project, HAVING COUNT(DISTINCT department_id) >= 3.',
    sampleSolution:
      'SELECT p.name as project_name, COUNT(DISTINCT e.department_id) as dept_count FROM projects p JOIN assignments a ON p.id = a.project_id JOIN employees e ON a.employee_id = e.id GROUP BY p.id, p.name HAVING COUNT(DISTINCT e.department_id) >= 3;',
    verificationQuery: 'SELECT 0 as expected_count;',
  },

  // ==================== NEW TOPIC TASKS ====================
  {
    id: 'advanced-9',
    title: 'Views (VIEW)',
    description: 'Create and use VIEW',
    difficulty: 'advanced',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Create a view active_employees that shows only active employees (is_active = 1). Then select all data from this view.',
    hint: 'CREATE VIEW name AS SELECT ... FROM ... WHERE is_active = 1, then SELECT * FROM name.',
    sampleSolution:
      'CREATE VIEW active_employees AS SELECT * FROM employees WHERE is_active = 1; SELECT * FROM active_employees;',
    verificationQuery: 'SELECT COUNT(*) as count FROM employees WHERE is_active = 1;',
  },

  {
    id: 'advanced-10',
    title: 'Indexes (INDEX)',
    description: 'Create and use indexes',
    difficulty: 'advanced',
    dbType: 'sqlite',
    schema: INDEX_DEMO_SCHEMA,
    taskText:
      'Create an index idx_books_author on the books table on column author. Then create a composite index idx_books_genre_year on genre and published_year. Display all indexes for the books table.',
    hint: 'CREATE INDEX idx_name ON table(column). To view: SELECT * FROM sqlite_master WHERE type="index" AND tbl_name="books".',
    sampleSolution:
      "CREATE INDEX idx_books_author ON books(author); CREATE INDEX idx_books_genre_year ON books(genre, published_year); SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='books';",
    verificationQuery: "SELECT COUNT(*) as count FROM sqlite_master WHERE type='index' AND tbl_name='books';",
  },

  {
    id: 'advanced-11',
    title: 'Correlated Subquery with EXISTS',
    description: 'Subquery depending on outer query',
    difficulty: 'advanced',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Find departments that have employees with salary greater than 140000. Display the department name. Use EXISTS.',
    hint: 'EXISTS (SELECT 1 FROM employees WHERE department_id = departments.id AND salary > 140000).',
    sampleSolution:
      'SELECT d.name FROM departments d WHERE EXISTS (SELECT 1 FROM employees e WHERE e.department_id = d.id AND e.salary > 140000);',
    verificationQuery:
      'SELECT COUNT(*) as count FROM departments d WHERE EXISTS (SELECT 1 FROM employees e WHERE e.department_id = d.id AND e.salary > 140000);',
  },

  // ==================== SUBQUERIES IN SELECT/FROM ====================
  {
    id: 'advanced-12',
    title: 'Scalar Subquery in SELECT',
    description: 'Subquery returning a single value in SELECT',
    difficulty: 'advanced',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'For each employee display first_name, salary and the difference between their salary and the maximum salary in the company.',
    hint: 'A subquery (SELECT MAX(salary) FROM employees) in SELECT returns the maximum salary for each row.',
    sampleSolution:
      'SELECT first_name, salary, (SELECT MAX(salary) FROM employees) - salary as diff_from_max FROM employees ORDER BY diff_from_max;',
    verificationQuery: 'SELECT COUNT(*) as count FROM employees;',
  },

  {
    id: 'advanced-13',
    title: 'Table Subquery in FROM',
    description: 'Use a subquery as a table',
    difficulty: 'advanced',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Find employees whose salary is above the average for their department. Use a subquery in FROM to calculate average salaries by department.',
    hint: 'Create a subquery with AVG(salary) GROUP BY department_id in FROM, then JOIN with employees.',
    sampleSolution:
      'SELECT e.first_name, e.last_name, e.salary, e.department_id, dept_avg.avg_salary FROM employees e JOIN (SELECT department_id, AVG(salary) as avg_salary FROM employees WHERE department_id IS NOT NULL GROUP BY department_id) dept_avg ON e.department_id = dept_avg.department_id WHERE e.salary > dept_avg.avg_salary ORDER BY e.department_id, e.salary DESC;',
    verificationQuery:
      'SELECT COUNT(*) as count FROM employees e JOIN (SELECT department_id, AVG(salary) as avg_salary FROM employees WHERE department_id IS NOT NULL GROUP BY department_id) dept_avg ON e.department_id = dept_avg.department_id WHERE e.salary > dept_avg.avg_salary;',
  },

  {
    id: 'advanced-14',
    title: 'Subquery in WHERE with IN',
    description: 'Filter by a list of values from a subquery',
    difficulty: 'advanced',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText: 'Find employees who work on projects with status "active". Use IN with a subquery.',
    hint: 'Subquery SELECT employee_id FROM assignments JOIN projects WHERE status = "active".',
    sampleSolution:
      "SELECT first_name, last_name FROM employees WHERE id IN (SELECT a.employee_id FROM assignments a JOIN projects p ON a.project_id = p.id WHERE p.status = 'active');",
    verificationQuery:
      "SELECT COUNT(*) as count FROM employees WHERE id IN (SELECT a.employee_id FROM assignments a JOIN projects p ON a.project_id = p.id WHERE p.status = 'active');",
  },

  // ==================== WINDOW FUNCTIONS LAG/LEAD ====================
  {
    id: 'advanced-15',
    title: 'LAG - Access Previous Row',
    description: 'Get value from previous row',
    difficulty: 'advanced',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      "For each employee display first_name, salary and the previous employee's salary (when sorted by salary).",
    hint: 'LAG(salary) OVER (ORDER BY salary) returns the salary of the previous row.',
    sampleSolution:
      'SELECT first_name, salary, LAG(salary) OVER (ORDER BY salary) as prev_salary FROM employees WHERE department_id IS NOT NULL ORDER BY salary;',
    verificationQuery: 'SELECT COUNT(*) as count FROM employees WHERE department_id IS NOT NULL;',
  },

  {
    id: 'advanced-16',
    title: 'LEAD - Access Next Row',
    description: 'Get value from next row',
    difficulty: 'advanced',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      "For each employee display first_name, salary and the difference from the next employee's salary (when sorted by salary).",
    hint: 'LEAD(salary) OVER (ORDER BY salary) - salary gives the difference.',
    sampleSolution:
      'SELECT first_name, salary, LEAD(salary) OVER (ORDER BY salary) - salary as diff_to_next FROM employees WHERE department_id IS NOT NULL ORDER BY salary;',
    verificationQuery: 'SELECT COUNT(*) as count FROM employees WHERE department_id IS NOT NULL;',
  },

  {
    id: 'advanced-17',
    title: 'FIRST_VALUE and LAST_VALUE',
    description: 'First and last value in window',
    difficulty: 'advanced',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'For each department display the employee, their salary, and the minimum and maximum salary in that department.',
    hint: 'FIRST_VALUE(salary) OVER (PARTITION BY department_id ORDER BY salary) and LAST_VALUE with ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING.',
    sampleSolution:
      'SELECT first_name, department_id, salary, FIRST_VALUE(salary) OVER (PARTITION BY department_id ORDER BY salary) as min_dept_salary, LAST_VALUE(salary) OVER (PARTITION BY department_id ORDER BY salary ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as max_dept_salary FROM employees WHERE department_id IS NOT NULL ORDER BY department_id, salary;',
    verificationQuery: 'SELECT COUNT(*) as count FROM employees WHERE department_id IS NOT NULL;',
  },

  // ==================== TRIGGERS ====================
  {
    id: 'advanced-18',
    title: 'Trigger AFTER INSERT',
    description: 'Automatic action after insert',
    difficulty: 'advanced',
    dbType: 'sqlite',
    schema: EMPTY_ORDERS_SCHEMA,
    taskText:
      'Create a trigger that automatically decreases product stock when an order is created. Then create an order and verify the stock was updated.',
    hint: 'CREATE TRIGGER after_order_insert AFTER INSERT ON orders BEGIN UPDATE products SET stock = stock - NEW.quantity WHERE id = NEW.product_id; END;',
    sampleSolution:
      "CREATE TRIGGER after_order_insert AFTER INSERT ON orders BEGIN UPDATE products SET stock = stock - NEW.quantity WHERE id = NEW.product_id; END; INSERT INTO orders (product_id, quantity, order_date, customer_name) VALUES (1, 2, '2024-03-01', 'Sidorov'); SELECT stock FROM products WHERE id = 1;",
    verificationQuery: 'SELECT stock FROM products WHERE id = 1;',
  },

  {
    id: 'advanced-19',
    title: 'Trigger BEFORE UPDATE',
    description: 'Validate data before update',
    difficulty: 'advanced',
    dbType: 'sqlite',
    schema: EMPTY_ORDERS_SCHEMA,
    taskText:
      'Create a trigger that prevents negative stock. Try setting stock=-5 for product id=1 and see the result.',
    hint: 'CREATE TRIGGER before_product_update BEFORE UPDATE ON products WHEN NEW.stock < 0 BEGIN SELECT RAISE(ABORT, "Stock cannot be negative"); END;',
    sampleSolution:
      'CREATE TRIGGER before_product_update BEFORE UPDATE ON products WHEN NEW.stock < 0 BEGIN SELECT RAISE(ABORT, "Stock cannot be negative"); END; UPDATE products SET stock = -5 WHERE id = 1;',
    verificationQuery: 'SELECT stock FROM products WHERE id = 1;',
  },

  // ==================== FULL-TEXT SEARCH ====================
  {
    id: 'advanced-20',
    title: 'FTS5 - Full-Text Search',
    description: 'Create FTS5 table and text search',
    difficulty: 'advanced',
    dbType: 'sqlite',
    schema: '',
    taskText:
      'Create an FTS5 table articles with columns title and content. Add 3 articles. Find articles containing the word "database".',
    hint: 'CREATE VIRTUAL TABLE articles USING fts5(title, content). Search: SELECT * FROM articles WHERE articles MATCH "database".',
    sampleSolution:
      "CREATE VIRTUAL TABLE articles USING fts5(title, content); INSERT INTO articles VALUES ('SQL Basics', 'A database is a system for storing data'); INSERT INTO articles VALUES ('NoSQL Approaches', 'Document-oriented databases'); INSERT INTO articles VALUES ('Programming', 'Python for web development'); SELECT title FROM articles WHERE articles MATCH 'database';",
    verificationQuery: "SELECT COUNT(*) as count FROM articles WHERE articles MATCH 'database';",
  },

  {
    id: 'advanced-21',
    title: 'FTS5 - Advanced Search',
    description: 'Search with prefixes and logical operators',
    difficulty: 'advanced',
    dbType: 'sqlite',
    schema: '',
    taskText:
      'Using the FTS5 articles table from the previous task, find articles containing "data" AND "stor". Use prefix search.',
    hint: 'MATCH "data AND stor*" for prefix search.',
    sampleSolution: "SELECT title FROM articles WHERE articles MATCH 'data AND stor*';",
    verificationQuery: "SELECT COUNT(*) as count FROM articles WHERE articles MATCH 'data AND stor*';",
  },

  // ==================== JSON FUNCTIONS ====================
  {
    id: 'advanced-22',
    title: 'JSON - Data Extraction',
    description: 'json_extract for JSON values',
    difficulty: 'advanced',
    dbType: 'sqlite',
    schema: '',
    taskText:
      'Create a users table with a data column of type TEXT (JSON). Add users with fields name, age, city. Extract the name and city of each user.',
    hint: 'json_extract(data, "$.name") or data->"$.name" for extraction.',
    sampleSolution:
      'CREATE TABLE users (id INTEGER PRIMARY KEY, data TEXT); INSERT INTO users (data) VALUES (\'{"name": "Alexey", "age": 30, "city": "Moscow"}\'); INSERT INTO users (data) VALUES (\'{"name": "Maria", "age": 25, "city": "Saint Petersburg"}\'); SELECT json_extract(data, \'$.name\') as name, json_extract(data, \'$.city\') as city FROM users;',
    verificationQuery: 'SELECT COUNT(*) as count FROM users;',
  },

  {
    id: 'advanced-23',
    title: 'JSON - Filtering and Aggregation',
    description: 'Filter by JSON fields and create JSON',
    difficulty: 'advanced',
    dbType: 'sqlite',
    schema: '',
    taskText: 'Using the users table, find users older than 25. Create a JSON object with their name and city.',
    hint: 'json_extract(data, "$.age") > 25 for filtering. json_object("name", ..., "city", ...) for creating JSON.',
    sampleSolution:
      "SELECT json_object('name', json_extract(data, '$.name'), 'city', json_extract(data, '$.city')) as user_info FROM users WHERE json_extract(data, '$.age') > 25;",
    verificationQuery: "SELECT COUNT(*) as count FROM users WHERE json_extract(data, '$.age') > 25;",
  },

  {
    id: 'advanced-24',
    title: 'JSON - Arrays',
    description: 'Working with JSON arrays',
    difficulty: 'advanced',
    dbType: 'sqlite',
    schema: '',
    taskText: 'Create an orders table with a JSON array items. Find orders containing product "Laptop". Use json_each.',
    hint: 'json_each(items) returns a table of elements. EXISTS or JOIN with json_each.',
    sampleSolution:
      'CREATE TABLE orders (id INTEGER PRIMARY KEY, items TEXT); INSERT INTO orders (items) VALUES (\'["Laptop", "Mouse"]\'); INSERT INTO orders (items) VALUES (\'["Keyboard", "Monitor"]\'); INSERT INTO orders (items) VALUES (\'["Laptop", "Headphones"]\'); SELECT o.id FROM orders o, json_each(o.items) WHERE json_each.value = \'Laptop\';',
    verificationQuery: "SELECT COUNT(*) as count FROM orders o, json_each(o.items) WHERE json_each.value = 'Laptop';",
  },

  // ==================== STORED PROCEDURES (SQLite doesn't support them, so we use a simulation) ====================
  {
    id: 'advanced-25',
    title: 'Stored Procedure Simulation',
    description: 'Use CTEs and complex queries instead of procedures',
    difficulty: 'advanced',
    dbType: 'sqlite',
    schema: EMPTY_ORDERS_SCHEMA,
    taskText:
      'Create a "procedure" using CTE: for given product_id=1 check stock, if > 0 create an order and decrease stock. Use a sequence of queries.',
    hint: 'Multiple queries: SELECT stock, INSERT INTO orders, UPDATE products. Check stock > 0.',
    sampleSolution:
      "SELECT stock FROM products WHERE id = 1; INSERT INTO orders (product_id, quantity, order_date, customer_name) SELECT 1, 1, '2024-04-01', 'Kozlov' FROM products WHERE id = 1 AND stock > 0; UPDATE products SET stock = stock - 1 WHERE id = 1 AND stock > 0; SELECT * FROM orders;",
    verificationQuery: 'SELECT COUNT(*) as count FROM orders WHERE customer_name = "Kozlov";',
  },

  // ==================== SHOP TASKS ====================
  {
    id: 'pg-28',
    title: 'PostgreSQL: @> (Containment) Operator',
    description: 'Check element containment in array',
    difficulty: 'advanced',
    dbType: 'postgresql',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'Find products whose description contains the word "smartphone". Use string_to_array(description, \' \') to split the description into a word array and operator @> to check membership. Display name and description.',
    hint: 'string_to_array(text, delimiter) splits a string into an array. Operator @> checks if the left array contains all elements of the right array.',
    sampleSolution:
      "SELECT name, description FROM products WHERE string_to_array(description, ' ') @> ARRAY['smartphone'];",
    verificationQuery: "SELECT COUNT(*) as count FROM products WHERE description LIKE '%smartphone%';",
  },

  {
    id: 'pg-32',
    title: 'PostgreSQL: Correlated Subquery',
    description: 'Subquery depending on outer row',
    difficulty: 'advanced',
    dbType: 'postgresql',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'Find products whose price is above the average price in their category. Use a correlated subquery: WHERE price > (SELECT AVG(price) FROM products WHERE category_id = p.category_id). Display name, price and category. Sort by category and price DESC.',
    hint: 'A correlated subquery executes again for each row of the outer query, substituting p.category_id of the current row.',
    sampleSolution:
      'SELECT p.name, p.price, c.name AS category FROM products p JOIN categories c ON p.category_id = c.id WHERE p.price > (SELECT AVG(p2.price) FROM products p2 WHERE p2.category_id = p.category_id) ORDER BY c.name, p.price DESC;',
    verificationQuery:
      'SELECT COUNT(*) as count FROM products p WHERE p.price > (SELECT AVG(p2.price) FROM products p2 WHERE p2.category_id = p.category_id);',
  },

  {
    id: 'pg-8',
    title: 'PostgreSQL: DISTINCT ON',
    description: 'Select first row for each group',
    difficulty: 'advanced',
    dbType: 'postgresql',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'For each customer find the most expensive order. Use DISTINCT ON (customer_id). Display customer_id, order_id, total_amount. Sort by customer_id.',
    hint: 'DISTINCT ON (customer_id) selects the first row for each unique customer_id with the specified ordering.',
    sampleSolution:
      'SELECT DISTINCT ON (customer_id) customer_id, id AS order_id, total_amount FROM orders ORDER BY customer_id, total_amount DESC;',
    verificationQuery:
      'SELECT customer_id, id AS order_id, total_amount FROM orders o1 WHERE total_amount = (SELECT MAX(total_amount) FROM orders WHERE customer_id = o1.customer_id) ORDER BY customer_id;',
  },

  {
    id: 'pg-adv-3',
    title: 'PostgreSQL: FILTER in Aggregation',
    description: 'Conditional aggregation with FILTER (WHERE)',
    difficulty: 'advanced',
    dbType: 'postgresql',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'For each shipping city from orders display: total order count, delivered order count and average amount of only delivered orders. Use FILTER (WHERE ...).',
    hint: 'COUNT(*) FILTER (WHERE condition) counts only rows matching the condition. AVG(col) FILTER (WHERE cond) averages only rows matching the condition.',
    sampleSolution:
      "SELECT shipping_city, COUNT(*) AS total_orders, COUNT(*) FILTER (WHERE status = 'delivered') AS delivered_orders, AVG(total_amount) FILTER (WHERE status = 'delivered') AS avg_delivered_amount FROM orders GROUP BY shipping_city ORDER BY total_orders DESC;",
    verificationQuery: 'SELECT COUNT(DISTINCT shipping_city) as count FROM orders;',
  },

  {
    id: 'shop-a1',
    title: 'Product Sales Ranking',
    description: 'ROW_NUMBER for sales ranking',
    difficulty: 'advanced',
    dbType: 'sqlite',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'Assign each product a rank by total revenue (unit_price * quantity). Display: product name, category, total revenue and rank.',
    hint: 'CTE for product revenue, then ROW_NUMBER() OVER (ORDER BY revenue DESC).',
    sampleSolution:
      'WITH product_revenue AS (SELECT p.name, c.name as category_name, SUM(oi.unit_price * oi.quantity) as revenue FROM order_items oi JOIN products p ON oi.product_id = p.id JOIN categories c ON p.category_id = c.id GROUP BY p.id, p.name, c.name) SELECT name, category_name, revenue, ROW_NUMBER() OVER (ORDER BY revenue DESC) as rank FROM product_revenue ORDER BY rank;',
    verificationQuery: 'SELECT COUNT(DISTINCT product_id) as count FROM order_items;',
  },

  {
    id: 'shop-a2',
    title: 'Monthly Revenue',
    description: 'CTE + GROUP BY by month',
    difficulty: 'advanced',
    dbType: 'sqlite',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'Display monthly store revenue for 2023. For each month: month (in "YYYY-MM" format), total order amount and order count.',
    hint: 'SUBSTR(order_date, 1, 7) extracts "YYYY-MM". GROUP BY this value. WHERE order_date LIKE "2023%".',
    sampleSolution:
      "SELECT SUBSTR(order_date, 1, 7) as month, SUM(total_amount) as total_revenue, COUNT(*) as order_count FROM orders WHERE order_date LIKE '2023%' GROUP BY SUBSTR(order_date, 1, 7) ORDER BY month;",
    verificationQuery:
      "SELECT COUNT(DISTINCT SUBSTR(order_date, 1, 7)) as count FROM orders WHERE order_date LIKE '2023%';",
  },

  {
    id: 'shop-a3',
    title: 'Customer Analytics',
    description: 'Multiple CTEs for LTV report',
    difficulty: 'advanced',
    dbType: 'sqlite',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'For each customer display: name, order count, total purchase amount, average check, first and last order date. Only customers with orders.',
    hint: 'Single CTE: GROUP BY customer_id with MIN/MAX/COUNT/SUM/AVG.',
    sampleSolution:
      'SELECT c.first_name, c.last_name, c.city, COUNT(o.id) as order_count, SUM(o.total_amount) as total_spent, ROUND(AVG(o.total_amount)) as avg_check, MIN(o.order_date) as first_order, MAX(o.order_date) as last_order FROM customers c JOIN orders o ON c.id = o.customer_id GROUP BY c.id, c.first_name, c.last_name, c.city ORDER BY total_spent DESC;',
    verificationQuery: 'SELECT COUNT(DISTINCT customer_id) as count FROM orders;',
  },

  {
    id: 'shop-a4',
    title: 'Comparing Products in Category',
    description: 'Self-join for price comparison',
    difficulty: 'advanced',
    dbType: 'sqlite',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'Find pairs of products from the same category with a price difference greater than 10000 rubles. Display both product names, category and price difference.',
    hint: 'Self-join products on category_id with condition p1.id < p2.id and ABS(p1.price - p2.price) > 10000.',
    sampleSolution:
      'SELECT p1.name as product_1, p2.name as product_2, c.name as category, ABS(p1.price - p2.price) as price_diff FROM products p1 JOIN products p2 ON p1.category_id = p2.category_id AND p1.id < p2.id JOIN categories c ON p1.category_id = c.id WHERE ABS(p1.price - p2.price) > 10000 ORDER BY price_diff DESC;',
    verificationQuery:
      'SELECT COUNT(*) as count FROM products p1 JOIN products p2 ON p1.category_id = p2.category_id AND p1.id < p2.id WHERE ABS(p1.price - p2.price) > 10000;',
  },

  {
    id: 'shop-a5',
    title: 'Full Category Report',
    description: 'Multiple CTEs + window functions',
    difficulty: 'advanced',
    dbType: 'sqlite',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'For each category display: name, product count, average price, total revenue, review count and average rating. Sort by descending revenue.',
    hint: '3 CTEs: product stats, revenue stats, review stats. JOIN on category_id.',
    sampleSolution:
      'WITH prod_stats AS (SELECT category_id, COUNT(*) as product_count, ROUND(AVG(price)) as avg_price FROM products GROUP BY category_id), revenue_stats AS (SELECT p.category_id, SUM(oi.unit_price * oi.quantity) as total_revenue FROM order_items oi JOIN products p ON oi.product_id = p.id GROUP BY p.category_id), review_stats AS (SELECT p.category_id, COUNT(r.id) as review_count, ROUND(AVG(r.rating), 1) as avg_rating FROM reviews r JOIN products p ON r.product_id = p.id GROUP BY p.category_id) SELECT c.name as category, ps.product_count, ps.avg_price, COALESCE(rs.total_revenue, 0) as total_revenue, COALESCE(rv.review_count, 0) as review_count, COALESCE(rv.avg_rating, 0) as avg_rating FROM categories c LEFT JOIN prod_stats ps ON c.id = ps.category_id LEFT JOIN revenue_stats rs ON c.id = rs.category_id LEFT JOIN review_stats rv ON c.id = rv.category_id ORDER BY total_revenue DESC;',
    verificationQuery: 'SELECT COUNT(*) as count FROM categories;',
  },

  {
    id: 'shop-a6',
    title: 'Order Dynamics (LAG)',
    description: 'Window function LAG for comparison',
    difficulty: 'advanced',
    dbType: 'sqlite',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'For each customer display all orders with the previous order amount. Display: customer name, order date, amount and previous amount (prev_amount). Use LAG.',
    hint: 'LAG(total_amount) OVER (PARTITION BY customer_id ORDER BY order_date) gives the previous amount.',
    sampleSolution:
      'SELECT c.first_name, c.last_name, o.order_date, o.total_amount, LAG(o.total_amount) OVER (PARTITION BY o.customer_id ORDER BY o.order_date) as prev_amount FROM orders o JOIN customers c ON o.customer_id = c.id ORDER BY c.last_name, o.order_date;',
    verificationQuery: 'SELECT COUNT(*) as count FROM orders o JOIN customers c ON o.customer_id = c.id;',
  },

  // ==================== COMPANY TASKS (PostgreSQL/ClickHouse) ====================
  {
    id: 'pg-18',
    title: 'PostgreSQL: LATERAL JOIN',
    description: 'Subquery in FROM depending on outer table',
    difficulty: 'advanced',
    dbType: 'postgresql',
    category: 'company',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'For each department find the employee with the highest salary. Use LATERAL JOIN: the subquery references the departments.id column from the outer query. Display department name, first_name, last_name and salary. Sort by department name.',
    hint: 'CROSS JOIN LATERAL (SELECT ... WHERE department_id = d.id ORDER BY salary DESC LIMIT 1) allows the subquery to use d.id from the outer table.',
    sampleSolution:
      'SELECT d.name, top_emp.first_name, top_emp.last_name, top_emp.salary FROM departments d CROSS JOIN LATERAL (SELECT e.first_name, e.last_name, e.salary FROM employees e WHERE e.department_id = d.id ORDER BY e.salary DESC LIMIT 1) top_emp ORDER BY d.name;',
    verificationQuery:
      'SELECT COUNT(*) as count FROM departments WHERE (SELECT COUNT(*) FROM employees WHERE department_id = departments.id) > 0;',
  },

  {
    id: 'pg-20',
    title: 'PostgreSQL: Window Functions - RANGE',
    description: 'Salary difference from department average',
    difficulty: 'advanced',
    dbType: 'postgresql',
    category: 'company',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'For each employee calculate the difference between their salary and the department average salary. Use window function AVG(salary) OVER (PARTITION BY department_id). Display first_name, last_name, department, salary and salary_diff (round to 2 decimals). Sort by department and difference.',
    hint: 'AVG(salary) OVER (PARTITION BY department_id) calculates the average salary per department for each row. Subtract it from the current salary.',
    sampleSolution:
      'SELECT e.first_name, e.last_name, d.name AS department, e.salary, ROUND(e.salary - AVG(e.salary) OVER (PARTITION BY e.department_id), 2) AS salary_diff FROM employees e JOIN departments d ON e.department_id = d.id ORDER BY d.name, salary_diff;',
    verificationQuery: 'SELECT COUNT(*) as count FROM employees e JOIN departments d ON e.department_id = d.id;',
  },

  {
    id: 'pg-31',
    title: 'PostgreSQL: HAVING with Subquery',
    description: 'Filter groups by subquery result',
    difficulty: 'advanced',
    dbType: 'postgresql',
    category: 'company',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Find departments where the average employee salary is above the overall company average salary. Use a scalar subquery inside HAVING. Display department name and avg_salary (round to 2 decimals). Sort by avg_salary DESC.',
    hint: 'HAVING AVG(e.salary) > (SELECT AVG(salary) FROM employees) — the subquery calculates the overall average, and HAVING filters departments whose average is higher.',
    sampleSolution:
      'SELECT d.name, ROUND(AVG(e.salary), 2) AS avg_salary FROM employees e JOIN departments d ON e.department_id = d.id GROUP BY d.name HAVING AVG(e.salary) > (SELECT AVG(salary) FROM employees) ORDER BY avg_salary DESC;',
    verificationQuery:
      'SELECT COUNT(*) as count FROM (SELECT d.name FROM employees e JOIN departments d ON e.department_id = d.id GROUP BY d.name HAVING AVG(e.salary) > (SELECT AVG(salary) FROM employees));',
  },

  {
    id: 'pg-6',
    title: 'PostgreSQL: RETURNING',
    description: 'Use RETURNING to get data after INSERT',
    difficulty: 'advanced',
    dbType: 'postgresql',
    category: 'company',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      "Write INSERT for a new employee: first_name = 'Test', last_name = 'Testov', email = 'test@company.ru', department_id = 1, salary = 100000, hire_date = '2024-01-01', is_active = TRUE. Use RETURNING * to return all columns of the inserted record.",
    hint: 'INSERT INTO ... VALUES (...) RETURNING * returns the inserted row in full.',
    sampleSolution:
      "INSERT INTO employees (first_name, last_name, email, department_id, salary, hire_date, is_active) VALUES ('Test', 'Testov', 'test@company.ru', 1, 100000, '2024-01-01', TRUE) RETURNING *;",
    verificationQuery: "SELECT COUNT(*) as count FROM employees WHERE email = 'test@company.ru';",
  },

  {
    id: 'pg-adv-1',
    title: 'PostgreSQL: DISTINCT ON - Unique Rows',
    description: 'Use DISTINCT ON to select first row in group',
    difficulty: 'advanced',
    dbType: 'postgresql',
    category: 'company',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'For each department display one employee with the highest salary. Use DISTINCT ON (department_id). Result: department_id, first_name, last_name, salary. Sort by department_id, salary DESC.',
    hint: 'DISTINCT ON (col) returns the first row for each unique value of col. ORDER BY must start with the same column.',
    sampleSolution:
      'SELECT DISTINCT ON (department_id) department_id, first_name, last_name, salary FROM employees WHERE is_active = 1 ORDER BY department_id, salary DESC;',
    verificationQuery: 'SELECT COUNT(DISTINCT department_id) as count FROM employees WHERE is_active = 1;',
  },

  {
    id: 'pg-adv-2',
    title: 'PostgreSQL: UPSERT with ON CONFLICT',
    description: 'Insert or update with ON CONFLICT',
    difficulty: 'advanced',
    dbType: 'postgresql',
    category: 'company',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Write INSERT INTO for the employees table with ON CONFLICT DO UPDATE SET. Try to insert an employee with id=1 (Ivan Petrov) but with salary 200000. On conflict update salary and hire_date.',
    hint: 'Syntax: INSERT INTO ... VALUES (...) ON CONFLICT (id) DO UPDATE SET salary = EXCLUDED.salary, hire_date = EXCLUDED.hire_date',
    sampleSolution:
      "INSERT INTO employees (id, first_name, last_name, email, department_id, salary, hire_date, is_active) VALUES (1, 'Ivan', 'Petrov', 'ivan_new@company.ru', 1, 200000, '2024-01-01', 1) ON CONFLICT (id) DO UPDATE SET salary = EXCLUDED.salary, hire_date = EXCLUDED.hire_date;",
    verificationQuery: 'SELECT COUNT(*) as count FROM employees WHERE salary >= 200000;',
  },

  {
    id: 'pg-adv-4',
    title: 'PostgreSQL: GENERATE_SERIES + CROSS JOIN LATERAL',
    description: 'Row generation and lateral join',
    difficulty: 'advanced',
    dbType: 'postgresql',
    category: 'company',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Using CROSS JOIN LATERAL, for each department display its name and the top 3 employee salaries (first_name, last_name, salary). The subquery should have LIMIT 3 ORDER BY salary DESC.',
    hint: 'CROSS JOIN LATERAL allows a subquery to reference columns of the preceding table. Structure: FROM departments CROSS JOIN LATERAL (SELECT ... FROM employees WHERE ... LIMIT 3) sub',
    sampleSolution:
      'SELECT d.name AS department, sub.first_name, sub.last_name, sub.salary FROM departments d CROSS JOIN LATERAL (SELECT first_name, last_name, salary FROM employees e WHERE e.department_id = d.id AND e.is_active = 1 ORDER BY e.salary DESC LIMIT 3) sub ORDER BY d.name, sub.salary DESC;',
    verificationQuery: 'SELECT COUNT(DISTINCT department_id) as count FROM employees WHERE is_active = 1;',
  },

  // ==================== SQL CONSTRAINTS & DATA TYPES ====================
  {
    id: 'advanced-constraints-1',
    title: 'Constraints: PRIMARY KEY and NOT NULL',
    description: 'Create table with primary key and required fields',
    difficulty: 'advanced',
    dbType: 'sqlite',
    schema: '',
    taskText:
      'Create a students table with columns: id (INTEGER PRIMARY KEY), name (TEXT NOT NULL), email (TEXT NOT NULL). Add one student. Display all students.',
    hint: 'PRIMARY KEY automatically makes the column unique and NOT NULL. NOT NULL prevents inserting NULL values.',
    sampleSolution:
      "CREATE TABLE students (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL); INSERT INTO students (name, email) VALUES ('Ivanov', 'ivan@test.ru'); SELECT * FROM students;",
    verificationQuery: 'SELECT COUNT(*) as count FROM students;',
  },

  {
    id: 'advanced-constraints-2',
    title: 'UNIQUE Constraint',
    description: 'Prevent duplicates in a column',
    difficulty: 'advanced',
    dbType: 'sqlite',
    schema: '',
    taskText:
      'Create a products table with columns: id (INTEGER PRIMARY KEY), name (TEXT UNIQUE), price (REAL). Try to insert two products with the same name. Display all products.',
    hint: 'UNIQUE prevents duplicate values. An error will occur when trying to insert a duplicate.',
    sampleSolution:
      "CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT UNIQUE, price REAL); INSERT INTO products (name, price) VALUES ('Laptop', 50000), ('Mouse', 1500); SELECT * FROM products;",
    verificationQuery: 'SELECT COUNT(*) as count FROM products;',
  },

  {
    id: 'advanced-constraints-3',
    title: 'CHECK Constraint',
    description: 'Validate allowed values on insert',
    difficulty: 'advanced',
    dbType: 'sqlite',
    schema: '',
    taskText:
      'Create an orders table with columns: id (INTEGER PRIMARY KEY), quantity (INTEGER CHECK (quantity > 0)), price (REAL CHECK (price >= 0)). Insert an order with quantity=5, price=1000. Display all orders.',
    hint: 'CHECK (condition) validates data on INSERT and UPDATE. If the condition is false — the insert is rejected.',
    sampleSolution:
      'CREATE TABLE orders (id INTEGER PRIMARY KEY, quantity INTEGER CHECK (quantity > 0), price REAL CHECK (price >= 0)); INSERT INTO orders (quantity, price) VALUES (5, 1000); SELECT * FROM orders;',
    verificationQuery: 'SELECT COUNT(*) as count FROM orders;',
  },

  {
    id: 'advanced-constraints-4',
    title: 'FOREIGN KEY',
    description: 'Link tables with referential integrity',
    difficulty: 'advanced',
    dbType: 'sqlite',
    schema: '',
    taskText:
      'Create a departments table (id INTEGER PRIMARY KEY, name TEXT). Create an employees table (id INTEGER PRIMARY KEY, name TEXT, dept_id INTEGER REFERENCES departments(id)). Insert a department and an employee. Try to insert an employee with a non-existent dept_id.',
    hint: 'FOREIGN KEY (REFERENCES) ensures referential integrity: you cannot reference a non-existent record.',
    sampleSolution:
      "CREATE TABLE departments (id INTEGER PRIMARY KEY, name TEXT); CREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, dept_id INTEGER REFERENCES departments(id)); INSERT INTO departments VALUES (1, 'IT'); INSERT INTO employees VALUES (1, 'Ivanov', 1); SELECT e.name, d.name as dept FROM employees e JOIN departments d ON e.dept_id = d.id;",
    verificationQuery: 'SELECT COUNT(*) as count FROM employees;',
  },

  {
    id: 'advanced-datatypes-1',
    title: 'Data Types: INTEGER vs REAL vs TEXT',
    description: 'Understand SQLite data type differences',
    difficulty: 'advanced',
    dbType: 'sqlite',
    schema: '',
    taskText:
      'Create a demo_types table with columns: int_col INTEGER, real_col REAL, text_col TEXT. Insert values: 42, 3.14, "Hello". Display all. Note: SQLite is dynamically typed.',
    hint: 'INTEGER — whole numbers, REAL — fractional numbers, TEXT — strings. SQLite allows storing any type in any column, but it is better to follow the declared type.',
    sampleSolution:
      "CREATE TABLE demo_types (int_col INTEGER, real_col REAL, text_col TEXT); INSERT INTO demo_types VALUES (42, 3.14, 'Hello'); SELECT * FROM demo_types;",
    verificationQuery: 'SELECT COUNT(*) as count FROM demo_types;',
  },

  {
    id: 'advanced-datatypes-2',
    title: 'Data Types: BOOLEAN and DATE in SQLite',
    description: 'How SQLite stores booleans and dates',
    difficulty: 'advanced',
    dbType: 'sqlite',
    schema: '',
    taskText:
      'Create a demo_dates table with columns: is_active INTEGER (0 or 1), created_at TEXT (date in YYYY-MM-DD format). Insert a record. Display only active records.',
    hint: 'SQLite does not have native BOOLEAN — use INTEGER 0/1. Dates are stored as TEXT in ISO format or as Julian Day Number.',
    sampleSolution:
      "CREATE TABLE demo_dates (is_active INTEGER, created_at TEXT); INSERT INTO demo_dates VALUES (1, '2024-01-15'), (0, '2024-02-20'); SELECT * FROM demo_dates WHERE is_active = 1;",
    verificationQuery: 'SELECT COUNT(*) as count FROM demo_dates WHERE is_active = 1;',
  },

  {
    id: 'advanced-explain-1',
    title: 'Reading Execution Plan (EXPLAIN)',
    description: 'Understand how DBMS executes a query',
    difficulty: 'advanced',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Execute EXPLAIN QUERY PLAN for the query SELECT * FROM employees WHERE department_id = 1. Study the output: SCAN TABLE means full scan, SEARCH means index usage. Which type is used?',
    hint: 'EXPLAIN QUERY PLAN shows the execution strategy. SCAN TABLE = slow full scan of all rows. SEARCH USING INDEX = fast index lookup.',
    sampleSolution: 'EXPLAIN QUERY PLAN SELECT * FROM employees WHERE department_id = 1;',
    verificationQuery: 'SELECT COUNT(*) as count FROM employees;',
  },

  {
    id: 'advanced-explain-2',
    title: 'Index Impact on Execution Plan',
    description: 'Compare EXPLAIN before and after index creation',
    difficulty: 'advanced',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'First execute EXPLAIN QUERY PLAN for SELECT * FROM employees WHERE department_id = 1. Then create index CREATE INDEX idx_dept ON employees(department_id). Execute EXPLAIN again — the plan should change from SCAN to SEARCH.',
    hint: 'Without index: SCAN TABLE (iterating all rows). With index: SEARCH USING INDEX (fast lookup). The difference is especially noticeable on large tables.',
    sampleSolution:
      'EXPLAIN QUERY PLAN SELECT * FROM employees WHERE department_id = 1; CREATE INDEX idx_dept ON employees(department_id); EXPLAIN QUERY PLAN SELECT * FROM employees WHERE department_id = 1;',
    verificationQuery: "SELECT COUNT(*) as count FROM sqlite_master WHERE type='index' AND name='idx_dept';",
  },

  // ==================== ANALYTICS TASKS (ClickHouse) ====================
  {
    id: 'analytics-a1',
    title: 'countIf and sumIf - Conditional Aggregates',
    description: 'ClickHouse countIf() and sumIf() functions',
    difficulty: 'advanced',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: ANALYTICS_SCHEMA,
    taskText: 'For each device count clicks (countIf), views (countIf) and total view duration (sumIf).',
    hint: "countIf(event_type = 'click') counts only clicks. sumIf(duration, event_type = 'page_view') sums duration only for views.",
    sampleSolution:
      "SELECT device, countIf(event_type = 'click') as clicks, countIf(event_type = 'page_view') as views, sumIf(duration, event_type = 'page_view') as total_duration FROM events GROUP BY device ORDER BY clicks DESC;",
    verificationQuery: 'SELECT COUNT(DISTINCT device) as count FROM events;',
  },

  {
    id: 'analytics-a2',
    title: 'sumIf for Completed Purchases',
    description: 'JOIN + sumIf for status filtering',
    difficulty: 'advanced',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: ANALYTICS_SCHEMA,
    taskText:
      'For each user display: total purchase count, sum of only completed purchases (sumIf) and average check. Use LEFT JOIN purchases.',
    hint: "sumIf(p.amount, p.status = 'completed') sums only completed purchases.",
    sampleSolution:
      "SELECT u.username, count(p.purchase_id) as total_purchases, sumIf(p.amount, p.status = 'completed') as completed_amount, avg(p.amount) as avg_check FROM users u LEFT JOIN purchases p ON u.user_id = p.user_id GROUP BY u.user_id, u.username ORDER BY completed_amount DESC;",
    verificationQuery: 'SELECT COUNT(*) as count FROM users;',
  },

  {
    id: 'analytics-a3',
    title: 'groupArray - Arrays in ClickHouse',
    description: 'ClickHouse groupArray() function',
    difficulty: 'advanced',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: ANALYTICS_SCHEMA,
    taskText: 'For each user collect an array of unique pages they visited (only page_view). Use groupArray().',
    hint: 'groupArray(DISTINCT page) creates an array of unique pages for each user_id.',
    sampleSolution:
      "SELECT user_id, groupArray(DISTINCT page) as visited_pages, count(*) as view_count FROM events WHERE event_type = 'page_view' GROUP BY user_id ORDER BY view_count DESC;",
    verificationQuery: "SELECT COUNT(DISTINCT user_id) as count FROM events WHERE event_type = 'page_view';",
  },

  {
    id: 'analytics-a4',
    title: 'Window Function ROW_NUMBER',
    description: 'ROW_NUMBER() OVER for ranking',
    difficulty: 'advanced',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: ANALYTICS_SCHEMA,
    taskText:
      "Number each user's purchases by date (newest to oldest). Display username, product_id, amount, purchase_date and row number.",
    hint: 'ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY purchase_date DESC) numbers purchases within each user.',
    sampleSolution:
      'SELECT u.username, p.product_id, p.amount, p.purchase_date, ROW_NUMBER() OVER (PARTITION BY p.user_id ORDER BY p.purchase_date DESC) as rn FROM purchases p JOIN users u ON p.user_id = u.user_id ORDER BY u.user_id, rn;',
    verificationQuery: 'SELECT COUNT(*) as count FROM purchases;',
  },

  {
    id: 'analytics-a5',
    title: 'CTE + ClickHouse Functions',
    description: 'WITH (CTE) + countIf for complex analysis',
    difficulty: 'advanced',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: ANALYTICS_SCHEMA,
    taskText:
      'Using a CTE (WITH), find users with more than one click. Display their names and click count. Use countIf().',
    hint: 'First create a CTE with clicks per user, then filter WHERE click_count > 1.',
    sampleSolution:
      "WITH user_clicks AS (SELECT user_id, countIf(event_type = 'click') as click_count FROM events GROUP BY user_id) SELECT u.username, uc.click_count FROM user_clicks uc JOIN users u ON uc.user_id = u.user_id WHERE uc.click_count > 1 ORDER BY uc.click_count DESC;",
    verificationQuery:
      "SELECT COUNT(*) as count FROM (SELECT user_id FROM events WHERE event_type = 'click' GROUP BY user_id HAVING count(*) > 1);",
  },

  {
    id: 'ch-42',
    title: 'ClickHouse: sumIf + toStartOfDay',
    description: 'Daily page view analytics',
    difficulty: 'advanced',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: CLICKHOUSE_EVENTS_SCHEMA,
    taskText:
      "For each day calculate total page_view duration and click count. Use toStartOfDay(event_time) for grouping by day, sumIf(duration, event_type = 'page_view') for duration sum and countIf(event_type = 'click') for click count. Display day, total_view_duration, click_count. Sort by day.",
    hint: 'toStartOfDay(datetime) rounds to the start of the day. sumIf() and countIf() are conditional aggregate functions in ClickHouse.',
    sampleSolution:
      "SELECT toStartOfDay(event_time) AS day, sumIf(duration, event_type = 'page_view') AS total_view_duration, countIf(event_type = 'click') AS click_count FROM events GROUP BY day ORDER BY day;",
    verificationQuery: 'SELECT COUNT(*) as count FROM events;',
  },

  {
    id: 'ch-45',
    title: 'ClickHouse: Conditional Aggregation countIf',
    description: 'Click-Through Rate (CTR) by day',
    difficulty: 'advanced',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: CLICKHOUSE_EVENTS_SCHEMA,
    taskText:
      'For each day calculate CTR (Click-Through Rate) — the ratio of clicks to views. Use countIf for each type. Display event_date, page_views, clicks and ctr (round to 3 decimals). Avoid division by zero with NULLIF. Sort by event_date.',
    hint: 'CTR = clicks / page_views. NULLIF(page_views, 0) prevents division by zero by returning NULL. ROUND(..., 3) rounds to 3 decimals.',
    sampleSolution:
      "SELECT toDate(event_time) AS event_date, countIf(event_type = 'page_view') AS page_views, countIf(event_type = 'click') AS clicks, ROUND(countIf(event_type = 'click') / NULLIF(countIf(event_type = 'page_view'), 0), 3) AS ctr FROM events GROUP BY event_date ORDER BY event_date;",
    verificationQuery: 'SELECT COUNT(*) as count FROM events;',
  },

  {
    id: 'ch-advanced-1',
    title: 'Nested Subqueries',
    description: 'Subqueries with aggregation',
    difficulty: 'advanced',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: ANALYTICS_SCHEMA,
    taskText: 'Find users who spent more than the average purchase amount. Display username and total amount.',
    hint: "Subquery: SELECT avg(total) FROM (SELECT user_id, sum(amount) as total FROM purchases WHERE status = 'completed' GROUP BY user_id).",
    sampleSolution:
      "SELECT u.username, sum(p.amount) as total_spent FROM users u JOIN purchases p ON u.user_id = p.user_id WHERE p.status = 'completed' GROUP BY u.user_id, u.username HAVING sum(p.amount) > (SELECT avg(total) FROM (SELECT user_id, sum(amount) as total FROM purchases WHERE status = 'completed' GROUP BY user_id)) ORDER BY total_spent DESC;",
    verificationQuery:
      "SELECT COUNT(*) as count FROM (SELECT user_id, sum(amount) as total FROM purchases WHERE status = 'completed' GROUP BY user_id HAVING total > (SELECT avg(total) FROM (SELECT user_id, sum(amount) as total FROM purchases WHERE status = 'completed' GROUP BY user_id)));",
  },

  {
    id: 'ch-advanced-2',
    title: 'uniqExact and toYYYYMM',
    description: 'Unique values and date formatting',
    difficulty: 'advanced',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: ANALYTICS_SCHEMA,
    taskText: 'For each month count unique users who made purchases. Use uniqExact and toYYYYMM.',
    hint: 'uniqExact(user_id) counts unique values. toYYYYMM(purchase_date) formats the date.',
    sampleSolution:
      "SELECT toYYYYMM(purchase_date) as month, uniqExact(user_id) as unique_buyers, count(*) as total_purchases, sum(amount) as revenue FROM purchases WHERE status = 'completed' GROUP BY month ORDER BY month;",
    verificationQuery:
      "SELECT COUNT(DISTINCT toYYYYMM(purchase_date)) as months FROM purchases WHERE status = 'completed';",
  },

  {
    id: 'ch-advanced-3',
    title: 'if and Conditional Expressions',
    description: 'if function in SELECT',
    difficulty: 'advanced',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: ANALYTICS_SCHEMA,
    taskText: 'For each device count clicks and views, and also conversion rate (clicks / views * 100). Use if.',
    hint: "if(event_type = 'click', 1, 0) returns 1 for clicks and 0 for others.",
    sampleSolution:
      "SELECT device, sum(if(event_type = 'click', 1, 0)) as clicks, sum(if(event_type = 'page_view', 1, 0)) as views, round(sum(if(event_type = 'click', 1, 0)) * 100.0 / sum(if(event_type = 'page_view', 1, 0)), 2) as ctr FROM events GROUP BY device ORDER BY ctr DESC;",
    verificationQuery: 'SELECT COUNT(DISTINCT device) as devices FROM events;',
  },

  {
    id: 'ch-analytics-adv-1',
    title: 'ClickHouse: Conversion Funnel by Pages',
    description: 'Event funnel: from course views to purchase',
    difficulty: 'advanced',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: SHOP_SCHEMA,
    taskText:
      'Create a conversion funnel for the orders table. Count orders for each status (new, processing, shipped, delivered, cancelled) in lifecycle order. Use countIf for each status in one query.',
    hint: 'countIf(cond) counts rows matching the condition. Use a single SELECT with multiple countIf for each status.',
    sampleSolution:
      "SELECT countIf(status = 'new') AS new_orders, countIf(status = 'processing') AS processing_orders, countIf(status = 'shipped') AS shipped_orders, countIf(status = 'delivered') AS delivered_orders, countIf(status = 'cancelled') AS cancelled_orders FROM orders;",
    verificationQuery: "SELECT count(*) as count FROM orders WHERE status = 'delivered';",
  },

  {
    id: 'ch-analytics-adv-2',
    title: 'ClickHouse: Revenue with multiIf',
    description: 'Classify orders by amount with multiIf',
    difficulty: 'advanced',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: SHOP_SCHEMA,
    taskText:
      'For each order in the orders table create a category based on total_amount: "Small" (< 5000), "Medium" (5000-10000), "Large" (10001-50000), "Premium" (> 50000). Display order id, total_amount and category. Use multiIf.',
    hint: 'multiIf(cond1, val1, cond2, val2, ..., elseVal) works like a CASE WHEN chain. Order of conditions matters — from most specific to general.',
    sampleSolution:
      "SELECT id, total_amount, multiIf(total_amount < 5000, 'Small', total_amount <= 10000, 'Medium', total_amount <= 50000, 'Large', 'Premium') AS order_category FROM orders ORDER BY total_amount DESC;",
    verificationQuery: 'SELECT COUNT(*) as count FROM orders WHERE total_amount > 50000;',
  },

  {
    id: 'ch-analytics-adv-3',
    title: 'ClickHouse: Top-N with bar Visualization',
    description: 'Text data visualization with bar()',
    difficulty: 'advanced',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: SHOP_SCHEMA,
    taskText:
      'Display top-5 products by price from the products table. For each product show name, price and a visual bar using bar(price, 70000, 20). Sort by price DESC, limit 5.',
    hint: 'bar(value, max_value, width) creates a text bar from █ characters. max_value is the value that fills the full bar width.',
    sampleSolution: 'SELECT name, price, bar(price, 70000, 20) AS price_bar FROM products ORDER BY price DESC LIMIT 5;',
    verificationQuery: 'SELECT COUNT(*) as count FROM products WHERE price > 10000;',
  },

  {
    id: 'ch-analytics-adv-4',
    title: 'ClickHouse: Weekly Aggregation',
    description: 'Group data by weeks',
    difficulty: 'advanced',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: SHOP_SCHEMA,
    taskText:
      'From the orders table count orders and total_amount for each month. Use toStartOfMonth(order_date) for grouping. Display month, order count and total revenue. Sort by month.',
    hint: 'toStartOfMonth(date) rounds date to the start of the month. Use SUM and COUNT with GROUP BY.',
    sampleSolution:
      'SELECT toStartOfMonth(order_date) AS month, COUNT(*) AS order_count, SUM(total_amount) AS revenue FROM orders GROUP BY month ORDER BY month;',
    verificationQuery: 'SELECT COUNT(DISTINCT SUBSTR(order_date, 1, 7)) as count FROM orders;',
  },

  {
    id: 'pg-15',
    title: 'ARRAY_AGG with ORDER BY in Aggregation',
    description: 'Collect values into arrays with ordering',
    difficulty: 'advanced',
    dbType: 'postgresql',
    category: 'analytics',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'For each department collect employee names into an array (ARRAY_AGG). Inside ARRAY_AGG sort names alphabetically. Display department name and team_members.',
    hint: 'ARRAY_AGG collects values into a PostgreSQL array.',
    sampleSolution:
      'SELECT d.name, ARRAY_AGG(e.first_name ORDER BY e.first_name) as team_members FROM departments d JOIN employees e ON d.id = e.department_id GROUP BY d.name;',
    verificationQuery: 'SELECT COUNT(*) as count FROM departments;',
  },

  {
    id: 'pg-16',
    title: 'RETURNING - Return Data from INSERT',
    description: 'Return inserted data with RETURNING clause',
    difficulty: 'advanced',
    dbType: 'postgresql',
    category: 'analytics',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      "Insert a new employee: first_name = 'Test', last_name = 'Testov', email = 'test@company.ru', department_id = 1, salary = 100000. Use RETURNING * to return all columns of the inserted record.",
    hint: 'RETURNING returns data from modified rows after INSERT/UPDATE/DELETE.',
    sampleSolution:
      "INSERT INTO employees (first_name, last_name, email, department_id, salary) VALUES ('Test', 'Testov', 'test@company.ru', 1, 100000) RETURNING *;",
    verificationQuery: "SELECT COUNT(*) as count FROM employees WHERE email = 'test@company.ru';",
  },

  {
    id: 'pg-26',
    title: 'PostgreSQL: GENERATE_SERIES',
    description: 'Generate number series with GENERATE_SERIES',
    difficulty: 'advanced',
    dbType: 'postgresql',
    category: 'analytics',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'For each year from 2019 to 2022 inclusive display the number of hired employees. Use GENERATE_SERIES(2019, 2022) as a table and LEFT JOIN with employees, extracting the year from hire_date via EXTRACT. Display hire_year and hired_count. Sort by hire_year.',
    hint: 'GENERATE_SERIES(start, end) creates a virtual table with a series of numbers. Use LEFT JOIN to keep all years even if no one was hired in some.',
    sampleSolution:
      'SELECT gs.year AS hire_year, COUNT(e.id) AS hired_count FROM GENERATE_SERIES(2019, 2022) AS gs(year) LEFT JOIN employees e ON EXTRACT(YEAR FROM e.hire_date) = gs.year GROUP BY gs.year ORDER BY gs.year;',
    verificationQuery: "SELECT COUNT(DISTINCT STRFTIME('%Y', hire_date)) AS count FROM employees;",
  },

  {
    id: 'pg-33',
    title: 'PostgreSQL: Recursive CTE (WITH RECURSIVE)',
    description: 'Hierarchical query with recursive CTE',
    difficulty: 'advanced',
    dbType: 'postgresql',
    category: 'analytics',
    schema: SHOP_SCHEMA,
    taskText:
      'Using a recursive CTE (WITH RECURSIVE), get the hierarchy of all product categories. Start with root categories (parent_id IS NULL), then recursively join subcategories (parent_id = parent id). Display id, name, parent_id and level. Sort by level, then by id.',
    hint: 'WITH RECURSIVE cte AS (base query UNION ALL recursive query) — the base part selects root elements, the recursive part selects their descendants.',
    sampleSolution:
      'WITH RECURSIVE category_tree AS (SELECT id, name, parent_id, 0 AS level FROM categories WHERE parent_id IS NULL UNION ALL SELECT c.id, c.name, c.parent_id, ct.level + 1 FROM categories c JOIN category_tree ct ON c.parent_id = ct.id) SELECT id, name, parent_id, level FROM category_tree ORDER BY level, id;',
    verificationQuery: 'SELECT COUNT(*) as count FROM categories;',
  },

  // ==================== EXAM TASKS ====================
  {
    id: 'ch-exam-7',
    title: 'Exam: ClickHouse countIf + avgIf for Reviews',
    description: 'Analyze reviews by product categories',
    difficulty: 'advanced',
    dbType: 'clickhouse',
    category: 'exam',
    examGroup: 'ch-exam-advanced',
    schema: SHOP_SCHEMA,
    taskText:
      'For each product category calculate: count of good reviews (rating >= 4) via countIf, average rating via avgIf. Join reviews with products on product_id, then with categories. Display category, good_reviews and avg_rating (round to 2). Sort by avg_rating DESC.',
    hint: 'countIf(condition) counts rows by condition. avgIf(expr, condition) averages by condition. Conditions can reference different columns.',
    sampleSolution:
      'SELECT c.name AS category, countIf(r.rating >= 4) AS good_reviews, ROUND(avgIf(r.rating, r.rating > 0), 2) AS avg_rating FROM categories c JOIN products p ON c.id = p.category_id JOIN reviews r ON p.id = r.product_id GROUP BY c.name ORDER BY avg_rating DESC;',
    verificationQuery:
      'SELECT COUNT(*) as count FROM categories WHERE (SELECT COUNT(*) FROM products p JOIN reviews r ON p.id = r.product_id WHERE p.category_id = categories.id) > 0;',
  },

  {
    id: 'ch-exam-8',
    title: 'Exam: ClickHouse toStartOfDay + countIf',
    description: 'Daily order analysis',
    difficulty: 'advanced',
    dbType: 'clickhouse',
    category: 'exam',
    examGroup: 'ch-exam-advanced',
    schema: SHOP_SCHEMA,
    taskText:
      "For each day analyze orders: count of delivered (countIf(status = 'delivered')), cancelled (countIf(status = 'cancelled')) and new (countIf(status = 'new')). Use toStartOfDay(toDateTime(order_date)) for grouping. Display order_day, delivered, cancelled and new_orders. Sort by order_day.",
    hint: 'toStartOfDay(datetime) rounds to the start of the day. countIf(condition) counts rows matching the condition within a group.',
    sampleSolution:
      "SELECT toStartOfDay(toDateTime(order_date)) AS order_day, countIf(status = 'delivered') AS delivered, countIf(status = 'cancelled') AS cancelled, countIf(status = 'new') AS new_orders FROM orders GROUP BY order_day ORDER BY order_day;",
    verificationQuery: 'SELECT COUNT(*) as count FROM orders;',
  },

  {
    id: 'ch-exam-9',
    title: 'Exam: ClickHouse uniqExact + groupUniqArray',
    description: 'Unique customers by shipping city',
    difficulty: 'advanced',
    dbType: 'clickhouse',
    category: 'exam',
    examGroup: 'ch-exam-advanced',
    schema: SHOP_SCHEMA,
    taskText:
      'For each shipping city display: count of unique customers (uniqExact(customer_id)), array of unique customer ids (groupUniqArray(customer_id)) and total order count. Use the orders table. Sort by unique_customers DESC.',
    hint: 'uniqExact(expr) counts exact number of unique values (using a hash table). groupUniqArray(expr) collects unique values into an array.',
    sampleSolution:
      'SELECT shipping_city, uniqExact(customer_id) AS unique_customers, groupUniqArray(customer_id) AS customer_list, COUNT(*) AS total_orders FROM orders GROUP BY shipping_city ORDER BY unique_customers DESC;',
    verificationQuery: 'SELECT COUNT(DISTINCT shipping_city) as count FROM orders;',
  },

  {
    id: 'exam-a1',
    title: 'Exam: Window Functions',
    description: 'Test - ROW_NUMBER, RANK, LEAD',
    difficulty: 'advanced',
    dbType: 'sqlite',
    category: 'exam',
    examGroup: 'exam-advanced',
    schema: SHOP_SCHEMA,
    taskText:
      'Assign each order a rank by amount (total_amount) within each shipping city. Display: shipping_city, order_date, total_amount, rank. Top-3 per city.',
    hint: 'ROW_NUMBER() OVER (PARTITION BY shipping_city ORDER BY total_amount DESC) and filter rank <= 3.',
    sampleSolution:
      'WITH ranked AS (SELECT shipping_city, order_date, total_amount, ROW_NUMBER() OVER (PARTITION BY shipping_city ORDER BY total_amount DESC) as rank FROM orders WHERE total_amount IS NOT NULL) SELECT * FROM ranked WHERE rank <= 3 ORDER BY shipping_city, rank;',
    verificationQuery:
      'SELECT COUNT(*) as count FROM (SELECT shipping_city, ROW_NUMBER() OVER (PARTITION BY shipping_city ORDER BY total_amount DESC) as rn FROM orders WHERE total_amount IS NOT NULL) WHERE rn <= 3;',
  },

  {
    id: 'exam-a2',
    title: 'Exam: Multiple CTEs',
    description: 'Test - CTE + JOIN + aggregation',
    difficulty: 'advanced',
    dbType: 'sqlite',
    category: 'exam',
    examGroup: 'exam-advanced',
    schema: SHOP_SCHEMA,
    taskText:
      'Create a report: for each customer — total purchase amount, item count (pieces), unique orders. Only VIP customers (is_vip = 1).',
    hint: 'CTE: customer_id, SUM(oi.quantity * oi.unit_price), COUNT(DISTINCT oi.order_id). JOIN with customers WHERE is_vip = 1.',
    sampleSolution:
      'WITH customer_stats AS (SELECT o.customer_id, SUM(o.total_amount) as total_spent, COUNT(o.id) as order_count FROM orders o GROUP BY o.customer_id) SELECT c.first_name, c.last_name, cs.total_spent, cs.order_count FROM customers c JOIN customer_stats cs ON c.id = cs.customer_id WHERE c.is_vip = 1 ORDER BY cs.total_spent DESC;',
    verificationQuery:
      'SELECT COUNT(*) as count FROM customers c JOIN (SELECT customer_id FROM orders GROUP BY customer_id) o ON c.id = o.customer_id WHERE c.is_vip = 1;',
  },

  {
    id: 'exam-a3',
    title: 'Exam: Recursive CTE in Practice',
    description: 'Test - recursion with business logic',
    difficulty: 'advanced',
    dbType: 'sqlite',
    category: 'exam',
    examGroup: 'exam-advanced',
    schema: SHOP_SCHEMA,
    taskText:
      'Using a recursive CTE, calculate the running total of orders for each customer by date: each row should contain date, order amount and running total. For customer id=1.',
    hint: "Base case: customer's first order. Recursion: add total_amount to running_total. ORDER BY order_date.",
    sampleSolution:
      'WITH RECURSIVE order_seq AS (SELECT o.id, o.order_date, o.total_amount, o.total_amount as running_total, ROW_NUMBER() OVER (ORDER BY o.order_date) as rn FROM orders o WHERE o.customer_id = 1 ORDER BY o.order_date), running AS (SELECT id, order_date, total_amount, running_total, rn FROM order_seq WHERE rn = 1 UNION ALL SELECT os.id, os.order_date, os.total_amount, r.running_total + os.total_amount, os.rn FROM order_seq os JOIN running r ON os.rn = r.rn + 1) SELECT order_date, total_amount, running_total FROM running ORDER BY order_date;',
    verificationQuery: 'SELECT 6 as expected_count;',
  },

  {
    id: 'exam-a4',
    title: 'Exam: Full Analytics Report',
    description: 'Test - complex query using all knowledge',
    difficulty: 'advanced',
    dbType: 'sqlite',
    category: 'exam',
    examGroup: 'exam-advanced',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Create a department report: name, active/inactive count, average salary of active employees, department budget, budget to salary ratio (in %). Only departments with 3+ employees.',
    hint: 'CTE for counting active/inactive, then JOIN with departments. HAVING COUNT(*) >= 3. ROUND for percentages.',
    sampleSolution:
      'WITH dept_emp AS (SELECT department_id, SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_count, SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive_count, AVG(CASE WHEN is_active = 1 THEN salary END) as active_avg_salary, SUM(salary) as total_salary FROM employees GROUP BY department_id HAVING COUNT(*) >= 3) SELECT d.name, de.active_count, de.inactive_count, ROUND(de.active_avg_salary) as active_avg_salary, d.budget, ROUND(CAST(d.budget AS REAL) / de.total_salary * 100, 1) as budget_ratio_pct FROM departments d JOIN dept_emp de ON d.id = de.department_id ORDER BY budget_ratio_pct DESC;',
    verificationQuery:
      'SELECT COUNT(*) as count FROM (SELECT department_id FROM employees GROUP BY department_id HAVING COUNT(*) >= 3);',
  },

  {
    id: 'exam-a5',
    title: 'Exam: Complex Business Problem',
    description: 'Test - real-world scenario',
    difficulty: 'advanced',
    dbType: 'sqlite',
    category: 'exam',
    examGroup: 'exam-advanced',
    schema: SHOP_SCHEMA,
    taskText:
      'Find "growing" customers: those whose last order amount is greater than the previous one. Display: first_name, last_name, previous and last order amounts, difference.',
    hint: 'CTE with LAG(total_amount) OVER (PARTITION BY customer_id ORDER BY order_date). WHERE last_amount > prev_amount.',
    sampleSolution:
      'WITH order_with_prev AS (SELECT o.customer_id, o.order_date, o.total_amount, LAG(o.total_amount) OVER (PARTITION BY o.customer_id ORDER BY o.order_date) as prev_amount, ROW_NUMBER() OVER (PARTITION BY o.customer_id ORDER BY o.order_date DESC) as rn FROM orders o) SELECT c.first_name, c.last_name, op.prev_amount as prev_order, op.total_amount as last_order, op.total_amount - op.prev_amount as diff FROM order_with_prev op JOIN customers c ON op.customer_id = c.id WHERE op.rn = 1 AND op.prev_amount IS NOT NULL AND op.total_amount > op.prev_amount ORDER BY diff DESC;',
    verificationQuery:
      'SELECT COUNT(*) as count FROM (SELECT o.customer_id, LAG(o.total_amount) OVER (PARTITION BY o.customer_id ORDER BY o.order_date) as prev_amount, ROW_NUMBER() OVER (PARTITION BY o.customer_id ORDER BY o.order_date DESC) as rn FROM orders o) WHERE rn = 1 AND prev_amount IS NOT NULL AND total_amount > prev_amount;',
  },

  {
    id: 'pg-exam-7',
    title: 'Exam: PostgreSQL DISTINCT ON',
    description: 'Latest review for each product',
    difficulty: 'advanced',
    dbType: 'postgresql',
    category: 'exam',
    examGroup: 'pg-exam-advanced',
    schema: SHOP_SCHEMA,
    taskText:
      'Get the latest review for each product. Use DISTINCT ON (product_id) with ORDER BY product_id, review_date DESC. Display product_id, customer_id, rating, comment and review_date.',
    hint: 'DISTINCT ON (expr) returns the first row for each unique value of the expression. The order is determined by ORDER BY — the DISTINCT ON expression must be first in ORDER BY.',
    sampleSolution:
      'SELECT DISTINCT ON (product_id) product_id, customer_id, rating, comment, review_date FROM reviews ORDER BY product_id, review_date DESC;',
    verificationQuery: 'SELECT COUNT(DISTINCT product_id) as count FROM reviews;',
  },

  {
    id: 'pg-exam-8',
    title: 'Exam: PostgreSQL RETURNING',
    description: 'Insert with result return',
    difficulty: 'advanced',
    dbType: 'postgresql',
    category: 'exam',
    examGroup: 'pg-exam-advanced',
    schema: SHOP_SCHEMA,
    taskText:
      "Insert a new category: name = 'Toys', description = 'Children toys and games'. Use RETURNING * to return the inserted row in full.",
    hint: 'RETURNING returns data from the modified row (INSERT, UPDATE, DELETE). RETURNING * returns all columns. You can specify specific ones: RETURNING id, name.',
    sampleSolution: "INSERT INTO categories (name, description) VALUES ('Toys', 'Kids toys and games') RETURNING *;",
    verificationQuery: 'SELECT COUNT(*) as count FROM categories;',
  },

  {
    id: 'pg-exam-9',
    title: 'Exam: PostgreSQL LATERAL JOIN',
    description: 'Top product in each category',
    difficulty: 'advanced',
    dbType: 'postgresql',
    category: 'exam',
    examGroup: 'pg-exam-advanced',
    schema: SHOP_SCHEMA,
    taskText:
      'For each category find the product with the highest total order quantity. Use CROSS JOIN LATERAL: the subquery should reference categories.id. In the subquery join products with order_items, group by product_id, sum quantity and take LIMIT 1. Display category, product_name and total_ordered.',
    hint: 'LATERAL allows a subquery in FROM to reference columns of preceding tables in FROM. CROSS JOIN LATERAL — each outer row is combined with the subquery result.',
    sampleSolution:
      'SELECT c.name AS category, top.product_name, top.total_ordered FROM categories c CROSS JOIN LATERAL (SELECT p.name AS product_name, COALESCE(SUM(oi.quantity), 0) AS total_ordered FROM products p LEFT JOIN order_items oi ON p.id = oi.product_id WHERE p.category_id = c.id GROUP BY p.id, p.name ORDER BY total_ordered DESC LIMIT 1) top ORDER BY c.name;',
    verificationQuery:
      'SELECT COUNT(*) as count FROM categories WHERE (SELECT COUNT(*) FROM products WHERE category_id = categories.id) > 0;',
  },
];
