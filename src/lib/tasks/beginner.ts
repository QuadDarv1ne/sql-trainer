/**
 * Beginner Task Definitions
 * Auto-generated from training-tasks.ts
 */

import type { TrainingTask } from './types';
import { ANALYTICS_SCHEMA, CLICKHOUSE_EVENTS_SCHEMA, EMPLOYEES_SCHEMA, SHOP_SCHEMA } from './schemas';

export const BEGINNER_TASKS: TrainingTask[] = [
  // ==================== BEGINNER TASKS ====================
  {
    id: 'beginner-1',
    title: 'Basic SELECT',
    description: 'Select all columns from a table',
    difficulty: 'beginner',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText: 'Retrieve all data from the departments table (all columns, all rows).',
    hint: 'The asterisk (*) after SELECT means "all columns". It is convenient for quick table inspection, but in real projects it is better to list columns explicitly.',
    progressiveHints: [
      {
        level: 1,
        text: 'You need to select all data from the departments table',
        xpPenalty: 0,
      },
      {
        level: 2,
        text: 'Use the SELECT statement to retrieve data',
        xpPenalty: 0,
      },
      {
        level: 3,
        text: 'The asterisk (*) after SELECT means "all columns". It is convenient for quick table inspection, but in real projects it is better to list columns explicitly.',
        xpPenalty: 0,
      },
    ],
    sampleSolution: 'SELECT * FROM departments;',
    verificationQuery: 'SELECT COUNT(*) as count FROM departments;',
  },

  {
    id: 'beginner-2',
    title: 'Selecting Columns',
    description: 'Select specific columns from a table',
    difficulty: 'beginner',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText: 'Retrieve the first names and last names of all employees from the employees table.',
    hint: 'List the required columns separated by commas after SELECT.',
    progressiveHints: [
      {
        level: 1,
        text: 'You need to select specific columns from the employees table',
        xpPenalty: 0,
      },
      {
        level: 2,
        text: 'Use SELECT with a comma-separated list of columns',
        xpPenalty: 0,
      },
      {
        level: 3,
        text: 'List the required columns separated by commas after SELECT.',
        xpPenalty: 0,
      },
    ],
    sampleSolution: 'SELECT first_name, last_name FROM employees;',
    verificationQuery: 'SELECT COUNT(*) as count FROM employees;',
  },

  {
    id: 'beginner-3',
    title: 'WHERE Filtering',
    description: 'Filter rows using WHERE',
    difficulty: 'beginner',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText: 'Find all employees with salary greater than 130000. Display their first_name, last_name and salary.',
    hint: 'WHERE filters rows BEFORE returning results - only those where the condition is true. Comparison operators: =, !=, <, >, <=, >=.',
    progressiveHints: [
      {
        level: 1,
        text: 'You need to filter employees by a salary condition',
        xpPenalty: 0,
      },
      {
        level: 2,
        text: 'Use WHERE with the > operator for salary filtering',
        xpPenalty: 0,
      },
      {
        level: 3,
        text: 'WHERE filters rows BEFORE returning results - only those where the condition is true. Comparison operators: =, !=, <, >, <=, >=.',
        xpPenalty: 0,
      },
    ],
    sampleSolution: 'SELECT first_name, last_name, salary FROM employees WHERE salary > 130000;',
    verificationQuery: 'SELECT COUNT(*) as count FROM employees WHERE salary > 130000;',
  },

  {
    id: 'beginner-4',
    title: 'ORDER BY Sorting',
    description: 'Sort results by a column',
    difficulty: 'beginner',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText: 'Display the list of employees (first_name, last_name, salary), sorted by salary descending.',
    hint: 'Use ORDER BY with DESC for descending order.',
    progressiveHints: [
      {
        level: 1,
        text: 'You need to sort query results by a specific column',
        xpPenalty: 0,
      },
      {
        level: 2,
        text: 'Use ORDER BY for sorting and DESC for descending',
        xpPenalty: 0,
      },
      {
        level: 3,
        text: 'Use ORDER BY with DESC for descending order.',
        xpPenalty: 0,
      },
    ],
    sampleSolution: 'SELECT first_name, last_name, salary FROM employees ORDER BY salary DESC;',
    verificationQuery: 'SELECT MAX(salary) as max_salary FROM employees;',
  },

  {
    id: 'beginner-5',
    title: 'LIMIT Results',
    description: 'Limit the number of returned rows',
    difficulty: 'beginner',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText: 'Retrieve the 5 highest-paid employees (first_name, last_name, salary).',
    hint: 'Combine ORDER BY for sorting and LIMIT for limiting.',
    progressiveHints: [
      {
        level: 1,
        text: 'You need to find top employees by salary and limit the number of rows',
        xpPenalty: 0,
      },
      {
        level: 2,
        text: 'Sort by salary descending and use LIMIT 5',
        xpPenalty: 0,
      },
      {
        level: 3,
        text: 'Combine ORDER BY for sorting and LIMIT for limiting.',
        xpPenalty: 0,
      },
    ],
    sampleSolution: 'SELECT first_name, last_name, salary FROM employees ORDER BY salary DESC LIMIT 5;',
    verificationQuery: 'SELECT salary FROM employees ORDER BY salary DESC LIMIT 1;',
  },

  {
    id: 'beginner-6',
    title: 'DISTINCT Values',
    description: 'Get unique column values',
    difficulty: 'beginner',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText: 'Get a list of all unique cities (location) from the departments table.',
    hint: 'Use DISTINCT before the column name.',
    progressiveHints: [
      {
        level: 1,
        text: 'You need to get only unique values from a column',
        xpPenalty: 0,
      },
      {
        level: 2,
        text: 'Use the DISTINCT keyword to remove duplicates',
        xpPenalty: 0,
      },
      {
        level: 3,
        text: 'Use DISTINCT before the column name.',
        xpPenalty: 0,
      },
    ],
    sampleSolution: 'SELECT DISTINCT location FROM departments;',
    verificationQuery: 'SELECT COUNT(DISTINCT location) as count FROM departments;',
  },

  {
    id: 'beginner-7',
    title: 'Aggregate Functions COUNT and SUM',
    description: 'Use aggregate functions for calculations',
    difficulty: 'beginner',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText: 'Count the total number of employees and the sum of all salaries in the company.',
    hint: 'Use COUNT(*) to count rows and SUM(column) for the sum.',
    progressiveHints: [
      {
        level: 1,
        text: 'You need to calculate aggregate values for the entire employees table',
        xpPenalty: 0,
      },
      {
        level: 2,
        text: 'Use aggregate functions for counting and summing',
        xpPenalty: 0,
      },
      {
        level: 3,
        text: 'Use COUNT(*) to count rows and SUM(column) for the sum.',
        xpPenalty: 0,
      },
    ],
    sampleSolution: 'SELECT COUNT(*) as total_employees, SUM(salary) as total_salary FROM employees;',
    verificationQuery: 'SELECT COUNT(*) as total_employees FROM employees;',
  },

  {
    id: 'beginner-8',
    title: 'Average AVG',
    description: 'Calculate the average value of a column',
    difficulty: 'beginner',
    dbType: 'sqlite',
    schema: EMPLOYEES_SCHEMA,
    taskText: 'Calculate the average employee salary for each department. Display department_id and average salary.',
    hint: 'GROUP BY collapses rows with the same column value into one group. Aggregate functions (AVG, COUNT, SUM) compute results within each group. With GROUP BY, SELECT can only include GROUP BY columns or aggregate functions.',
    progressiveHints: [
      {
        level: 1,
        text: 'You need to group employees by department and calculate the average for each group',
        xpPenalty: 0,
      },
      {
        level: 2,
        text: 'Use GROUP BY department_id and AVG(salary) for calculation',
        xpPenalty: 0,
      },
      {
        level: 3,
        text: 'GROUP BY collapses rows with the same column value into one group. Aggregate functions (AVG, COUNT, SUM) compute results within each group. With GROUP BY, SELECT can only include GROUP BY columns or aggregate functions.',
        xpPenalty: 0,
      },
    ],
    sampleSolution: 'SELECT department_id, AVG(salary) as avg_salary FROM employees GROUP BY department_id;',
    verificationQuery:
      'SELECT COUNT(DISTINCT department_id) as dept_count FROM employees WHERE department_id IS NOT NULL;',
  },

  // ==================== SHOP TASKS ====================
  {
    id: 'ch-34',
    title: 'ClickHouse: toYYYYMM and Monthly Grouping',
    description: 'Monthly order statistics',
    difficulty: 'beginner',
    dbType: 'clickhouse',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'Group orders by month using the toYYYYMM(order_date) function. For each month, display month and order_count. Sort by month.',
    hint: 'toYYYYMM(date) converts a date to a number in YYYYMM format, convenient for monthly grouping.',
    sampleSolution:
      'SELECT toYYYYMM(order_date) AS month, COUNT(*) AS order_count FROM orders GROUP BY month ORDER BY month;',
    verificationQuery: 'SELECT COUNT(*) as count FROM orders;',
  },

  {
    id: 'pg-23',
    title: 'PostgreSQL: CONCAT_WS',
    description: 'Concatenate strings with a separator using CONCAT_WS',
    difficulty: 'beginner',
    dbType: 'postgresql',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      "For each customer display full name (first_name and last_name separated by space) and email. Use CONCAT_WS(' ', first_name, last_name) for concatenation with separator. Display full_name and email. Sort by full_name.",
    hint: 'CONCAT_WS(separator, str1, str2, ...) joins strings with a separator, automatically skipping NULL values.',
    sampleSolution:
      "SELECT CONCAT_WS(' ', first_name, last_name) AS full_name, email FROM customers ORDER BY full_name;",
    verificationQuery: 'SELECT COUNT(*) as count FROM customers;',
  },

  {
    id: 'shop-b1',
    title: 'Category Catalog',
    description: 'View store categories table',
    difficulty: 'beginner',
    dbType: 'sqlite',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText: 'Retrieve all product categories (name, description) from the categories table.',
    hint: 'Use SELECT with the required columns FROM categories.',
    sampleSolution: 'SELECT name, description FROM categories;',
    verificationQuery: 'SELECT COUNT(*) as count FROM categories;',
  },

  {
    id: 'shop-b2',
    title: 'Products and Prices',
    description: 'Retrieve products with prices',
    difficulty: 'beginner',
    dbType: 'sqlite',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'Display product names (name), prices (price) and stock quantity (stock_quantity) from the products table. Sort by price descending.',
    hint: 'SELECT with ORDER BY price DESC for descending sort.',
    sampleSolution: 'SELECT name, price, stock_quantity FROM products ORDER BY price DESC;',
    verificationQuery: 'SELECT COUNT(*) as count FROM products;',
  },

  {
    id: 'shop-b3',
    title: 'Expensive Products',
    description: 'Filter products by price',
    difficulty: 'beginner',
    dbType: 'sqlite',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText: 'Find all products costing more than 10000 rubles. Display name, price, and category_id.',
    hint: 'Use WHERE price > 10000.',
    sampleSolution: 'SELECT name, price, category_id FROM products WHERE price > 10000 ORDER BY price DESC;',
    verificationQuery: 'SELECT COUNT(*) as count FROM products WHERE price > 10000;',
  },

  {
    id: 'shop-b4',
    title: 'Top 5 Most Expensive',
    description: 'LIMIT with sorting',
    difficulty: 'beginner',
    dbType: 'sqlite',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText: 'Display the 5 most expensive products: name, price. Sort by price descending.',
    hint: 'ORDER BY price DESC LIMIT 5.',
    sampleSolution: 'SELECT name, price FROM products ORDER BY price DESC LIMIT 5;',
    verificationQuery: 'SELECT price FROM products ORDER BY price DESC LIMIT 1;',
  },

  {
    id: 'shop-b5',
    title: 'Orders by Status',
    description: 'GROUP BY for counting orders',
    difficulty: 'beginner',
    dbType: 'sqlite',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText: 'Count the number of orders for each status. Display status and order count.',
    hint: 'GROUP BY status with COUNT(*).',
    sampleSolution: 'SELECT status, COUNT(*) as order_count FROM orders GROUP BY status ORDER BY order_count DESC;',
    verificationQuery: 'SELECT COUNT(DISTINCT status) as count FROM orders;',
  },

  {
    id: 'shop-b6',
    title: 'Average Price by Category',
    description: 'AVG + GROUP BY by category',
    difficulty: 'beginner',
    dbType: 'sqlite',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'Calculate the average price and product count for each category. Display category_id, average price, and count.',
    hint: 'AVG(price) and COUNT(*) with GROUP BY category_id.',
    sampleSolution:
      'SELECT category_id, ROUND(AVG(price)) as avg_price, COUNT(*) as product_count FROM products GROUP BY category_id ORDER BY avg_price DESC;',
    verificationQuery: 'SELECT COUNT(DISTINCT category_id) as count FROM products;',
  },

  {
    id: 'shop-b7',
    title: 'Unique Customer Cities',
    description: 'DISTINCT for cities',
    difficulty: 'beginner',
    dbType: 'sqlite',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText: 'Display a list of unique customer cities (city) from the customers table. Sort alphabetically.',
    hint: 'SELECT DISTINCT city FROM customers ORDER BY city.',
    sampleSolution: 'SELECT DISTINCT city FROM customers ORDER BY city;',
    verificationQuery: 'SELECT COUNT(DISTINCT city) as count FROM customers;',
  },

  // ==================== COMPANY TASKS (PostgreSQL/ClickHouse) ====================
  {
    id: 'ch-40',
    title: 'ClickHouse: bar() for Visualization',
    description: 'Visual department budget comparison',
    difficulty: 'beginner',
    dbType: 'clickhouse',
    category: 'company',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Display each department budget with a visual bar. Use bar(budget / 500000, 0, 10, 20) — parameter 20 sets the bar width in characters. Display name, budget and budget_bar. Sort by budget DESC.',
    hint: 'bar(value, min, max, width) draws a text bar using ▏..▉ characters proportional to the value. Useful for console visualization.',
    sampleSolution:
      'SELECT name, budget, bar(budget / 500000, 0, 10, 20) AS budget_bar FROM departments ORDER BY budget DESC;',
    verificationQuery: 'SELECT COUNT(*) as count FROM departments;',
  },

  {
    id: 'pg-22',
    title: 'PostgreSQL: NULLIF',
    description: 'Prevent division by zero with NULLIF',
    difficulty: 'beginner',
    dbType: 'postgresql',
    category: 'company',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'For each department, calculate budget per employee (budget / number of employees). Use NULLIF(COUNT(e.id), 0) to avoid division by zero if a department has no employees. Display department name, budget, emp_count and budget_per_employee. Sort by budget_per_employee DESC.',
    hint: 'NULLIF(col, 0) returns NULL if col = 0. Dividing by NULL yields NULL instead of a division by zero error.',
    sampleSolution:
      'SELECT d.name, d.budget, COUNT(e.id) AS emp_count, ROUND(d.budget / NULLIF(COUNT(e.id), 0), 2) AS budget_per_employee FROM departments d LEFT JOIN employees e ON d.id = e.department_id GROUP BY d.id, d.name, d.budget ORDER BY budget_per_employee DESC;',
    verificationQuery: 'SELECT COUNT(*) as count FROM departments;',
  },

  // ==================== ANALYTICS TASKS (ClickHouse) ====================
  {
    id: 'analytics-b1',
    title: 'Sampling Events with LIMIT',
    description: 'Basic SELECT from events table',
    difficulty: 'beginner',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: ANALYTICS_SCHEMA,
    taskText: 'Display all events from the events table, limiting the result to 10 rows. Use ClickHouse syntax.',
    hint: 'Use SELECT * FROM events LIMIT 10.',
    sampleSolution: 'SELECT * FROM events LIMIT 10;',
    verificationQuery: 'SELECT COUNT(*) as count FROM events;',
  },

  {
    id: 'analytics-b2',
    title: 'Filter by Device',
    description: 'WHERE filter by device',
    difficulty: 'beginner',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: ANALYTICS_SCHEMA,
    taskText:
      "Find all events from 'mobile' device. Display event_id, user_id, event_type and event_time. Sort by event_time.",
    hint: "Use WHERE device = 'mobile' and ORDER BY event_time.",
    sampleSolution:
      "SELECT event_id, user_id, event_type, event_time FROM events WHERE device = 'mobile' ORDER BY event_time;",
    verificationQuery: "SELECT COUNT(*) as count FROM events WHERE device = 'mobile';",
  },

  {
    id: 'analytics-b3',
    title: 'Group by Event Type',
    description: 'GROUP BY with count() for counting events',
    difficulty: 'beginner',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: ANALYTICS_SCHEMA,
    taskText:
      'Count the number of events of each type (event_type). Display event_type and count. Use the ClickHouse count() function.',
    hint: 'SELECT event_type, count(*) as event_count FROM events GROUP BY event_type ORDER BY event_count DESC.',
    sampleSolution:
      'SELECT event_type, count(*) as event_count FROM events GROUP BY event_type ORDER BY event_count DESC;',
    verificationQuery: 'SELECT COUNT(DISTINCT event_type) as count FROM events;',
  },

  {
    id: 'analytics-b4',
    title: 'Top Countries by Events',
    description: 'ORDER BY + LIMIT for top results',
    difficulty: 'beginner',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: ANALYTICS_SCHEMA,
    taskText:
      'Find the top 3 countries by number of events. Display country and count. Use GROUP BY, ORDER BY DESC and LIMIT.',
    hint: 'Group by country, sort descending, and limit to 3 rows.',
    sampleSolution:
      'SELECT country, count(*) as event_count FROM events GROUP BY country ORDER BY event_count DESC LIMIT 3;',
    verificationQuery: 'SELECT COUNT(DISTINCT country) as count FROM events;',
  },

  {
    id: 'analytics-b5',
    title: 'uniq - Unique Users',
    description: 'ClickHouse uniq() for counting unique values',
    difficulty: 'beginner',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: ANALYTICS_SCHEMA,
    taskText:
      'Count the number of unique users (user_id) for each device (device). Use the ClickHouse uniq() function.',
    hint: 'uniq(user_id) counts unique user_id values in each group.',
    sampleSolution:
      'SELECT device, uniq(user_id) as unique_users, count(*) as total_events FROM events GROUP BY device ORDER BY unique_users DESC;',
    verificationQuery: 'SELECT COUNT(DISTINCT device) as count FROM events;',
  },

  {
    id: 'ch-32',
    title: 'ClickHouse: neighbour() for Adjacent Rows',
    description: 'Find events with duration close to previous event',
    difficulty: 'beginner',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: CLICKHOUSE_EVENTS_SCHEMA,
    taskText:
      'For each event (except the first), find the previous duration using neighbour(duration, -1). Display id, event_type, duration and prev_duration. Filter where duration > 0, prev_duration > 0 and ABS(duration - prev_duration) < 10. Sort by id.',
    hint: 'neighbour(col, offset) returns the value from the adjacent row: offset = -1 for previous row, offset = 1 for next row.',
    sampleSolution:
      'SELECT id, event_type, duration, neighbour(duration, -1) AS prev_duration FROM events WHERE duration > 0 AND neighbour(duration, -1) > 0 AND abs(duration - neighbour(duration, -1)) < 10 ORDER BY id;',
    verificationQuery: 'SELECT COUNT(*) as count FROM events WHERE duration > 0;',
  },

  {
    id: 'ch-38',
    title: 'ClickHouse: formatDateTime for Pretty Dates',
    description: 'Format event date and time',
    difficulty: 'beginner',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: CLICKHOUSE_EVENTS_SCHEMA,
    taskText:
      "Display events with formatted date: id, event_type and formatted_time in 'DD.MM.YYYY HH:MM' format. Use formatDateTime(event_time, '%d.%m.%Y %H:%i'). Sort by event_time.",
    hint: 'formatDateTime(date, format) formats DateTime per template. %d = day, %m = month, %Y = year, %H = hours, %i = minutes.',
    sampleSolution:
      "SELECT id, event_type, formatDateTime(event_time, '%d.%m.%Y %H:%i') AS formatted_time FROM events ORDER BY event_time;",
    verificationQuery: 'SELECT COUNT(*) as count FROM events;',
  },

  {
    id: 'ch-beginner-1',
    title: 'Basic SELECT',
    description: 'Select data from a table',
    difficulty: 'beginner',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: ANALYTICS_SCHEMA,
    taskText: 'Display all events from the events table (first 10).',
    hint: 'Use SELECT * FROM events LIMIT 10.',
    sampleSolution: 'SELECT * FROM events LIMIT 10;',
    verificationQuery: 'SELECT COUNT(*) as count FROM events;',
  },

  {
    id: 'ch-beginner-2',
    title: 'toDate and toDateTime',
    description: 'Working with date functions',
    difficulty: 'beginner',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: ANALYTICS_SCHEMA,
    taskText: 'Display user_id, event_type and event date (date only, no time) for all events. Use toDate().',
    hint: 'toDate(event_time) converts DateTime to a date.',
    sampleSolution: 'SELECT user_id, event_type, toDate(event_time) as event_date FROM events LIMIT 20;',
    verificationQuery: 'SELECT COUNT(*) as count FROM events;',
  },

  {
    id: 'ch-beginner-3',
    title: 'WHERE Filtering',
    description: 'Filtering with conditions',
    difficulty: 'beginner',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: ANALYTICS_SCHEMA,
    taskText: 'Find all events with device = "mobile". Display event_id, user_id, event_type.',
    hint: "Use WHERE device = 'mobile'.",
    sampleSolution: "SELECT event_id, user_id, event_type FROM events WHERE device = 'mobile';",
    verificationQuery: "SELECT COUNT(*) as count FROM events WHERE device = 'mobile';",
  },

  {
    id: 'pg-14',
    title: 'BOOLEAN Type and TRUE/FALSE',
    description: 'PostgreSQL boolean type usage',
    difficulty: 'beginner',
    dbType: 'postgresql',
    category: 'analytics',
    schema: EMPLOYEES_SCHEMA,
    taskText: 'Find all active employees using IS TRUE. Display first_name and last_name. Sort by last_name.',
    hint: 'PostgreSQL supports native BOOLEAN type with TRUE/FALSE values.',
    sampleSolution: 'SELECT first_name, last_name FROM employees WHERE is_active IS TRUE ORDER BY last_name;',
    verificationQuery: 'SELECT COUNT(*) as count FROM employees WHERE is_active = 1;',
  },

  // ==================== EXAM TASKS ====================
  {
    id: 'ch-exam-1',
    title: 'Exam: ClickHouse toStartOfMonth',
    description: 'Employee count by hire month',
    difficulty: 'beginner',
    dbType: 'clickhouse',
    category: 'exam',
    examGroup: 'ch-exam-beginner',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Group employees by hire month using toStartOfMonth(toDate(hire_date)). Display hire_month and emp_count. Sort by hire_month.',
    hint: 'toStartOfMonth(date) returns the first day of the month. Useful for monthly grouping.',
    sampleSolution:
      'SELECT toStartOfMonth(toDate(hire_date)) AS hire_month, COUNT(*) AS emp_count FROM employees GROUP BY hire_month ORDER BY hire_month;',
    verificationQuery: 'SELECT COUNT(*) as count FROM employees;',
  },

  {
    id: 'ch-exam-2',
    title: 'Exam: ClickHouse if() for Categorization',
    description: 'Salary categorization using if()',
    difficulty: 'beginner',
    dbType: 'clickhouse',
    category: 'exam',
    examGroup: 'ch-exam-beginner',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'For each employee, determine salary category using nested if(): low (< 110000), medium (110000-140000), high (> 140000). Display first_name, last_name, salary and salary_category. Sort by salary DESC.',
    hint: 'if(condition, then, else) is a conditional expression. For multiple conditions, nest: if(c1, v1, if(c2, v2, else)). Or use multiIf.',
    sampleSolution:
      "SELECT first_name, last_name, salary, if(salary < 110000, 'low', if(salary < 140000, 'medium', 'high')) AS salary_category FROM employees ORDER BY salary DESC;",
    verificationQuery: 'SELECT COUNT(*) as count FROM employees;',
  },

  {
    id: 'ch-exam-3',
    title: 'Exam: ClickHouse formatDateTime',
    description: 'Format hire date',
    difficulty: 'beginner',
    dbType: 'clickhouse',
    category: 'exam',
    examGroup: 'ch-exam-beginner',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      "Display employees: first_name, last_name and formatted_date — hire_date in 'YYYY-MM-DD' format. Use formatDateTime(toDateTime(hire_date), '%Y-%m-%d'). Sort by hire_date.",
    hint: 'formatDateTime(datetime, format) formats DateTime. %Y = 4-digit year, %m = month (01-12), %d = day (01-31).',
    sampleSolution:
      "SELECT first_name, last_name, formatDateTime(toDateTime(hire_date), '%Y-%m-%d') AS formatted_date FROM employees ORDER BY hire_date;",
    verificationQuery: 'SELECT COUNT(*) as count FROM employees;',
  },

  {
    id: 'exam-b1',
    title: 'Exam: Data Filtering',
    description: 'Test - WHERE, comparison operators',
    difficulty: 'beginner',
    dbType: 'sqlite',
    category: 'exam',
    examGroup: 'exam-beginner',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Find all employees with salary from 100000 to 130000 inclusive. Display first_name, last_name, salary. Sort by salary.',
    hint: 'Use WHERE salary BETWEEN 100000 AND 130000.',
    sampleSolution:
      'SELECT first_name, last_name, salary FROM employees WHERE salary BETWEEN 100000 AND 130000 ORDER BY salary;',
    verificationQuery: 'SELECT COUNT(*) as count FROM employees WHERE salary BETWEEN 100000 AND 130000;',
  },

  {
    id: 'exam-b2',
    title: 'Exam: Sorting and Limiting',
    description: 'Test - ORDER BY, LIMIT, OFFSET',
    difficulty: 'beginner',
    dbType: 'sqlite',
    category: 'exam',
    examGroup: 'exam-beginner',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Display the 3 lowest-paid employees (first_name, last_name, salary) from the "HR" department (department_id = 4).',
    hint: 'WHERE department_id = 4, ORDER BY salary ASC, LIMIT 3.',
    sampleSolution:
      'SELECT first_name, last_name, salary FROM employees WHERE department_id = 4 ORDER BY salary ASC LIMIT 3;',
    verificationQuery: 'SELECT 3 as expected_count;',
  },

  {
    id: 'exam-b3',
    title: 'Exam: Pattern Search',
    description: 'Test - LIKE patterns',
    difficulty: 'beginner',
    dbType: 'sqlite',
    category: 'exam',
    examGroup: 'exam-beginner',
    schema: EMPLOYEES_SCHEMA,
    taskText: 'Find all employees whose last name ends in "ova". Display first_name, last_name. Sort by last name.',
    hint: "Use WHERE last_name LIKE '%ova'.",
    sampleSolution: "SELECT first_name, last_name FROM employees WHERE last_name LIKE '%ova' ORDER BY last_name;",
    verificationQuery: "SELECT COUNT(*) as count FROM employees WHERE last_name LIKE '%ova';",
  },

  {
    id: 'exam-b4',
    title: 'Exam: Aggregation with Filter',
    description: 'Test - COUNT, SUM with WHERE',
    difficulty: 'beginner',
    dbType: 'sqlite',
    category: 'exam',
    examGroup: 'exam-beginner',
    schema: EMPLOYEES_SCHEMA,
    taskText: 'Count active employees (is_active = 1) and their average salary in one query.',
    hint: 'WHERE is_active = 1, then COUNT(*) and AVG(salary).',
    sampleSolution:
      'SELECT COUNT(*) as active_count, ROUND(AVG(salary)) as avg_salary FROM employees WHERE is_active = 1;',
    verificationQuery: 'SELECT 22 as expected_count;',
  },

  {
    id: 'exam-b5',
    title: 'Exam: Grouping',
    description: 'Test - GROUP BY with multiple aggregates',
    difficulty: 'beginner',
    dbType: 'sqlite',
    category: 'exam',
    examGroup: 'exam-beginner',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'For each department city, display: number of departments and total budget. Display location, count, total_budget.',
    hint: 'GROUP BY location with COUNT(*) and SUM(budget).',
    sampleSolution:
      'SELECT location, COUNT(*) as dept_count, SUM(budget) as total_budget FROM departments GROUP BY location ORDER BY total_budget DESC;',
    verificationQuery: 'SELECT COUNT(DISTINCT location) as count FROM departments;',
  },

  {
    id: 'pg-exam-1',
    title: 'Exam: PostgreSQL TRUE/FALSE Conditions',
    description: 'Find employees with salary above threshold',
    difficulty: 'beginner',
    dbType: 'postgresql',
    category: 'exam',
    examGroup: 'pg-exam-beginner',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Display first_name, last_name and salary of employees with salary > 120000. Add a high_salary column with TRUE or FALSE (salary > 120000). Sort by salary DESC.',
    hint: 'In PostgreSQL, (salary > 120000) returns TRUE or FALSE. Use it directly in SELECT as a computed column.',
    sampleSolution:
      'SELECT first_name, last_name, salary, (salary > 120000) AS high_salary FROM employees WHERE salary > 120000 ORDER BY salary DESC;',
    verificationQuery: 'SELECT COUNT(*) as count FROM employees WHERE salary > 120000;',
  },

  {
    id: 'pg-exam-2',
    title: 'Exam: PostgreSQL ILIKE Search',
    description: 'Find employees with letter "a" in name',
    difficulty: 'beginner',
    dbType: 'postgresql',
    category: 'exam',
    examGroup: 'pg-exam-beginner',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Find all employees with the letter "a" in first_name (case-insensitive). Use ILIKE for case-insensitive search. Display first_name and last_name. Sort by first_name.',
    hint: 'ILIKE performs case-insensitive pattern search: % = any character sequence, _ = single character.',
    sampleSolution: "SELECT first_name, last_name FROM employees WHERE first_name ILIKE '%a%' ORDER BY first_name;",
    verificationQuery: "SELECT COUNT(*) as count FROM employees WHERE first_name LIKE '%a%' OR first_name LIKE '%A%';",
  },

  {
    id: 'pg-exam-3',
    title: 'Exam: PostgreSQL COALESCE for NULL',
    description: 'Replace NULL values with default text',
    difficulty: 'beginner',
    dbType: 'postgresql',
    category: 'exam',
    examGroup: 'pg-exam-beginner',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      "Display projects: name, start_date, end_date and status. Replace NULL in end_date with 'In Progress' using COALESCE. Sort by name.",
    hint: 'COALESCE(val1, val2, ...) returns the first non-NULL argument. Useful for replacing NULL with default values.',
    sampleSolution:
      "SELECT name, start_date, COALESCE(end_date, 'In Progress') AS end_date, status FROM projects ORDER BY name;",
    verificationQuery: 'SELECT COUNT(*) as count FROM projects;',
  },

  // ==================== CLICKHOUSE REAL-WORLD ANALYTICS ====================
  {
    id: 'ch-analytics-real-1',
    title: 'ClickHouse: Daily Active Users (DAU)',
    description: 'Count unique users per day',
    difficulty: 'beginner',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: ANALYTICS_SCHEMA,
    taskText:
      'Count unique users (user_id) for each day. Use toDate(event_time) for daily grouping and uniq() for counting uniques. Display day and dau. Sort by day.',
    hint: 'uniq(user_id) is a fast approximate count of unique values in ClickHouse. toDate(event_time) extracts the date from DateTime.',
    sampleSolution: 'SELECT toDate(event_time) AS day, uniq(user_id) AS dau FROM events GROUP BY day ORDER BY day;',
    verificationQuery: 'SELECT COUNT(*) as count FROM events;',
  },

  {
    id: 'ch-analytics-real-2',
    title: 'ClickHouse: Distribution by Device',
    description: 'Event share by device type',
    difficulty: 'beginner',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: ANALYTICS_SCHEMA,
    taskText:
      'Count events and percentage (%) for each device. Use count() for counting and count() * 100.0 / (SELECT count() FROM events) for percentage. Display device, events_count and events_pct.',
    hint: 'For percentage, use a window function: count() * 100.0 / sum(count()) OVER () gives the percentage of the total.',
    sampleSolution:
      'SELECT device, count(*) AS events_count, round(count(*) * 100.0 / sum(count()) OVER (), 1) AS events_pct FROM events GROUP BY device ORDER BY events_count DESC;',
    verificationQuery: 'SELECT COUNT(DISTINCT device) as count FROM events;',
  },

  {
    id: 'ch-analytics-real-3',
    title: 'ClickHouse: Conversion by Event Type',
    description: 'Funnel: views, clicks, purchases',
    difficulty: 'beginner',
    dbType: 'clickhouse',
    category: 'analytics',
    schema: ANALYTICS_SCHEMA,
    taskText:
      'Count the number of events for each type using countIf(). Display page_views (event_type = "page_view"), clicks (event_type = "click"), and purchases (event_type = "purchase").',
    hint: 'countIf(event_type = "page_view") counts only page views. Use multiple countIf in one query for a funnel.',
    sampleSolution:
      "SELECT countIf(event_type = 'page_view') AS page_views, countIf(event_type = 'click') AS clicks, countIf(event_type = 'purchase') AS purchases FROM events;",
    verificationQuery: 'SELECT COUNT(*) as count FROM events;',
  },
];
