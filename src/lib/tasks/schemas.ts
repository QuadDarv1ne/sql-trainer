/**
 * Database schemas used across training tasks.
 */

export const EMPLOYEES_SCHEMA = `
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
INSERT INTO departments (id, name, location, budget) VALUES (1, 'Engineering', 'Moscow', 5000000);
INSERT INTO departments (id, name, location, budget) VALUES (2, 'Marketing', 'Saint Petersburg', 3000000);
INSERT INTO departments (id, name, location, budget) VALUES (3, 'Sales', 'Kazan', 2500000);
INSERT INTO departments (id, name, location, budget) VALUES (4, 'HR', 'Moscow', 1500000);
INSERT INTO departments (id, name, location, budget) VALUES (5, 'Finance', 'Moscow', 2000000);

-- Employees
INSERT INTO employees (id, first_name, last_name, email, department_id, salary, hire_date, is_active) VALUES (1, 'John', 'Petrov', 'john@company.com', 1, 150000, '2020-03-15', 1);
INSERT INTO employees (id, first_name, last_name, email, department_id, salary, hire_date, is_active) VALUES (2, 'Mary', 'Sidorova', 'mary@company.com', 1, 140000, '2020-06-01', 1);
INSERT INTO employees (id, first_name, last_name, email, department_id, salary, hire_date, is_active) VALUES (3, 'Alex', 'Kozlov', 'alex@company.com', 1, 160000, '2019-11-20', 1);
INSERT INTO employees (id, first_name, last_name, email, department_id, salary, hire_date, is_active) VALUES (4, 'Helen', 'Novikova', 'helen@company.com', 2, 120000, '2021-01-10', 1);
INSERT INTO employees (id, first_name, last_name, email, department_id, salary, hire_date, is_active) VALUES (5, 'Dmitry', 'Volkov', 'dmitry@company.com', 2, 110000, '2021-04-22', 1);
INSERT INTO employees (id, first_name, last_name, email, department_id, salary, hire_date, is_active) VALUES (6, 'Olga', 'Morozova', 'olga@company.com', 3, 130000, '2020-08-15', 1);
INSERT INTO employees (id, first_name, last_name, email, department_id, salary, hire_date, is_active) VALUES (7, 'Sergey', 'Lebedev', 'sergey@company.com', 3, 125000, '2020-09-01', 1);
INSERT INTO employees (id, first_name, last_name, email, department_id, salary, hire_date, is_active) VALUES (8, 'Anna', 'Sokolova', 'anna@company.com', 4, 100000, '2022-02-14', 1);
INSERT INTO employees (id, first_name, last_name, email, department_id, salary, hire_date, is_active) VALUES (9, 'Nikolay', 'Kuznetsov', 'nikolay@company.com', 4, 95000, '2022-03-20', 1);
INSERT INTO employees (id, first_name, last_name, email, department_id, salary, hire_date, is_active) VALUES (10, 'Victoria', 'Popova', 'victoria@company.com', 5, 135000, '2019-07-10', 1);
INSERT INTO employees (id, first_name, last_name, email, department_id, salary, hire_date, is_active) VALUES (11, 'Paul', 'Vasiliev', 'paul@company.com', 1, 145000, '2021-05-15', 1);
INSERT INTO employees (id, first_name, last_name, email, department_id, salary, hire_date, is_active) VALUES (12, 'Tatiana', 'Zaitseva', 'tatiana@company.com', 1, 130000, '2021-08-01', 1);
INSERT INTO employees (id, first_name, last_name, email, department_id, salary, hire_date, is_active) VALUES (13, 'Andrew', 'Pavlov', 'andrew@company.com', 2, 105000, '2022-01-05', 0);
INSERT INTO employees (id, first_name, last_name, email, department_id, salary, hire_date, is_active) VALUES (14, 'Julia', 'Semenova', 'julia@company.com', 2, 115000, '2021-10-10', 1);
INSERT INTO employees (id, first_name, last_name, email, department_id, salary, hire_date, is_active) VALUES (15, 'Roman', 'Golubev', 'roman@company.com', 3, 120000, '2020-12-01', 1);
INSERT INTO employees (id, first_name, last_name, email, department_id, salary, hire_date, is_active) VALUES (16, 'Catherine', 'Vinogradova', 'catherine@company.com', 3, 128000, '2020-07-20', 1);
INSERT INTO employees (id, first_name, last_name, email, department_id, salary, hire_date, is_active) VALUES (17, 'Maxim', 'Bogdanov', 'maxim@company.com', 4, 98000, '2022-06-15', 1);
INSERT INTO employees (id, first_name, last_name, email, department_id, salary, hire_date, is_active) VALUES (18, 'Xenia', 'Vorobieva', 'xenia@company.com', 5, 140000, '2019-09-25', 1);
INSERT INTO employees (id, first_name, last_name, email, department_id, salary, hire_date, is_active) VALUES (19, 'Artem', 'Filippov', 'artem@company.com', 1, 155000, '2019-04-10', 1);
INSERT INTO employees (id, first_name, last_name, email, department_id, salary, hire_date, is_active) VALUES (20, 'Daria', 'Davydova', 'daria@company.com', 5, 125000, '2021-11-30', 0);
INSERT INTO employees (id, first_name, last_name, email, department_id, salary, hire_date, is_active) VALUES (21, 'Igor', 'Belykh', 'igor@company.com', 1, 148000, '2020-01-15', 1);
INSERT INTO employees (id, first_name, last_name, email, department_id, salary, hire_date, is_active) VALUES (22, 'Natalia', 'Tarasova', 'natalia@company.com', 2, 118000, '2021-03-10', 1);
INSERT INTO employees (id, first_name, last_name, email, department_id, salary, hire_date, is_active) VALUES (23, 'Vladimir', 'Orlov', 'vladimir@company.com', 3, 132000, '2020-05-22', 1);
INSERT INTO employees (id, first_name, last_name, email, department_id, salary, hire_date, is_active) VALUES (24, 'Svetlana', 'Kiseleva', 'svetlana@company.com', 4, 102000, '2022-04-01', 1);

-- Projects
INSERT INTO projects (id, name, department_id, start_date, end_date, status) VALUES (1, 'Web Platform', 1, '2023-01-15', '2023-08-30', 'completed');
INSERT INTO projects (id, name, department_id, start_date, end_date, status) VALUES (2, 'Mobile App', 1, '2023-06-01', NULL, 'active');
INSERT INTO projects (id, name, department_id, start_date, end_date, status) VALUES (3, 'Q1 Ad Campaign', 2, '2023-01-01', '2023-03-31', 'completed');
INSERT INTO projects (id, name, department_id, start_date, end_date, status) VALUES (4, 'Brand Strategy', 2, '2023-04-15', NULL, 'active');
INSERT INTO projects (id, name, department_id, start_date, end_date, status) VALUES (5, 'CRM Integration', 3, '2023-02-01', '2023-07-15', 'completed');
INSERT INTO projects (id, name, department_id, start_date, end_date, status) VALUES (6, 'Staff Training', 4, '2023-03-01', NULL, 'active');
INSERT INTO projects (id, name, department_id, start_date, end_date, status) VALUES (7, 'Expense Audit', 5, '2023-01-15', '2023-04-30', 'completed');
INSERT INTO projects (id, name, department_id, start_date, end_date, status) VALUES (8, 'API Gateway', 1, '2023-07-01', NULL, 'active');

-- Assignments
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (1, 1, 'Lead Developer', 320);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (2, 1, 'Frontend Developer', 280);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (3, 1, 'Architect', 200);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (3, 2, 'Architect', 150);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (11, 2, 'Backend Developer', 180);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (12, 2, 'Frontend Developer', 200);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (19, 2, 'Lead Developer', 220);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (21, 2, 'Backend Developer', 160);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (4, 3, 'Marketer', 150);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (5, 3, 'Designer', 120);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (14, 4, 'Marketer', 100);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (22, 4, 'Copywriter', 80);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (4, 4, 'Marketer', 60);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (6, 5, 'Project Manager', 180);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (7, 5, 'Analyst', 160);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (15, 5, 'Developer', 200);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (16, 5, 'QA Engineer', 120);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (23, 5, 'Developer', 180);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (8, 6, 'HR Manager', 100);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (9, 6, 'HR Specialist', 80);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (17, 6, 'HR Specialist', 90);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (10, 7, 'Financial Analyst', 140);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (18, 7, 'Accountant', 120);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (1, 8, 'Lead Developer', 80);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (19, 8, 'Lead Developer', 80);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (11, 8, 'Backend Developer', 60);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (21, 8, 'Backend Developer', 60);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (13, 1, 'Frontend Developer', 150);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (20, 3, 'Assistant', 50);
INSERT INTO assignments (employee_id, project_id, role, hours_worked) VALUES (24, 6, 'HR Specialist', 70);
`;

export const SHOP_SCHEMA = `
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  parent_id INTEGER,
  FOREIGN KEY (parent_id) REFERENCES categories(id)
);

CREATE TABLE customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  city TEXT,
  registration_date TEXT,
  is_vip INTEGER DEFAULT 0
);

CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  category_id INTEGER,
  price REAL NOT NULL,
  stock_quantity INTEGER DEFAULT 0,
  created_at TEXT,
  is_active INTEGER DEFAULT 1,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER,
  order_date TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  total_amount REAL,
  shipping_city TEXT,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER,
  product_id INTEGER,
  rating INTEGER CHECK(rating BETWEEN 1 AND 5),
  comment TEXT,
  review_date TEXT,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Categories
INSERT INTO categories (id, name, description) VALUES (1, 'Electronics', 'Technology and gadgets');
INSERT INTO categories (id, name, description) VALUES (2, 'Clothing', 'Men''s and women''s clothing');
INSERT INTO categories (id, name, description) VALUES (3, 'Books', 'Books of various genres');
INSERT INTO categories (id, name, description) VALUES (4, 'Sports', 'Sports goods');
INSERT INTO categories (id, name, description) VALUES (5, 'Home and Garden', 'Home goods');
INSERT INTO categories (id, name, description) VALUES (6, 'Accessories', 'Bags, watches, jewelry');

-- Customers
INSERT INTO customers (id, first_name, last_name, email, phone, city, registration_date, is_vip) VALUES (1, 'Andrew', 'Smirnov', 'andrew@mail.ru', '+79001234501', 'Moscow', '2022-01-15', 1);
INSERT INTO customers (id, first_name, last_name, email, phone, city, registration_date, is_vip) VALUES (2, 'Marina', 'Kozlova', 'marina@mail.ru', '+79001234502', 'Saint Petersburg', '2022-03-20', 0);
INSERT INTO customers (id, first_name, last_name, email, phone, city, registration_date, is_vip) VALUES (3, 'Dmitry', 'Ivanov', 'dmitry@mail.ru', '+79001234503', 'Kazan', '2022-05-10', 1);
INSERT INTO customers (id, first_name, last_name, email, phone, city, registration_date, is_vip) VALUES (4, 'Olga', 'Petrova', 'olga@mail.ru', '+79001234504', 'Moscow', '2022-07-01', 0);
INSERT INTO customers (id, first_name, last_name, email, phone, city, registration_date, is_vip) VALUES (5, 'Sergey', 'Novikov', 'sergey@mail.ru', '+79001234505', 'Novosibirsk', '2022-08-15', 0);
INSERT INTO customers (id, first_name, last_name, email, phone, city, registration_date, is_vip) VALUES (6, 'Helen', 'Volkova', 'helen@mail.ru', '+79001234506', 'Moscow', '2022-09-20', 1);
INSERT INTO customers (id, first_name, last_name, email, phone, city, registration_date, is_vip) VALUES (7, 'Paul', 'Morozov', 'paul@mail.ru', '+79001234507', 'Yekaterinburg', '2023-01-05', 0);
INSERT INTO customers (id, first_name, last_name, email, phone, city, registration_date, is_vip) VALUES (8, 'Anna', 'Sokolova', 'anna@mail.ru', '+79001234508', 'Saint Petersburg', '2023-02-14', 1);
INSERT INTO customers (id, first_name, last_name, email, phone, city, registration_date, is_vip) VALUES (9, 'Igor', 'Lebedev', 'igor@mail.ru', '+79001234509', 'Kazan', '2023-04-10', 0);
INSERT INTO customers (id, first_name, last_name, email, phone, city, registration_date, is_vip) VALUES (10, 'Natalia', 'Kuznetsova', 'natalia@mail.ru', '+79001234510', 'Moscow', '2023-05-22', 0);
INSERT INTO customers (id, first_name, last_name, email, phone, city, registration_date, is_vip) VALUES (11, 'Maxim', 'Popov', 'maxim@mail.ru', '+79001234511', 'Tyumen', '2023-07-01', 0);
INSERT INTO customers (id, first_name, last_name, email, phone, city, registration_date, is_vip) VALUES (12, 'Victoria', 'Vasilieva', 'victoria@mail.ru', '+79001234512', 'Moscow', '2023-08-30', 1);
INSERT INTO customers (id, first_name, last_name, email, phone, city, registration_date, is_vip) VALUES (13, 'Roman', 'Zaitsev', 'roman@mail.ru', '+79001234513', 'Krasnodar', '2023-10-15', 0);
INSERT INTO customers (id, first_name, last_name, email, phone, city, registration_date, is_vip) VALUES (14, 'Tatiana', 'Pavlova', 'tatiana@mail.ru', '+79001234514', 'Saint Petersburg', '2023-11-20', 0);
INSERT INTO customers (id, first_name, last_name, email, phone, city, registration_date, is_vip) VALUES (15, 'Alex', 'Semenov', 'alex@mail.ru', '+79001234515', 'Moscow', '2024-01-10', 0);

-- Products
INSERT INTO products (id, name, description, category_id, price, stock_quantity, created_at, is_active) VALUES (1, 'Wireless Headphones Pro', 'Headphones with active noise cancellation', 1, 8990, 50, '2023-01-10', 1);
INSERT INTO products (id, name, description, category_id, price, stock_quantity, created_at, is_active) VALUES (2, 'Galaxy X Smartphone', 'Flagship smartphone', 1, 69990, 20, '2023-02-15', 1);
INSERT INTO products (id, name, description, category_id, price, stock_quantity, created_at, is_active) VALUES (3, 'FitBand Smart Watch', 'Fitness bracelet with heart rate monitor', 1, 4990, 100, '2023-03-20', 1);
INSERT INTO products (id, name, description, category_id, price, stock_quantity, created_at, is_active) VALUES (4, 'Bass+ Portable Speaker', 'Waterproof speaker', 1, 3490, 75, '2023-04-05', 1);
INSERT INTO products (id, name, description, category_id, price, stock_quantity, created_at, is_active) VALUES (5, 'Nord Winter Jacket', 'Down jacket with hood', 2, 12990, 30, '2023-05-10', 1);
INSERT INTO products (id, name, description, category_id, price, stock_quantity, created_at, is_active) VALUES (6, 'RunMax Sneakers', 'Running sneakers', 4, 5990, 60, '2023-06-01', 1);
INSERT INTO products (id, name, description, category_id, price, stock_quantity, created_at, is_active) VALUES (7, 'Novel "The Master and Margarita"', 'Classic of world literature', 3, 690, 200, '2023-01-01', 1);
INSERT INTO products (id, name, description, category_id, price, stock_quantity, created_at, is_active) VALUES (8, 'SQL Guide', 'Database textbook', 3, 1290, 150, '2023-02-10', 1);
INSERT INTO products (id, name, description, category_id, price, stock_quantity, created_at, is_active) VALUES (9, 'LED Desk Lamp', 'Lamp with brightness adjustment', 5, 2490, 45, '2023-07-15', 1);
INSERT INTO products (id, name, description, category_id, price, stock_quantity, created_at, is_active) VALUES (10, 'Classic Leather Belt', 'Genuine leather belt', 6, 2990, 80, '2023-08-01', 1);
INSERT INTO products (id, name, description, category_id, price, stock_quantity, created_at, is_active) VALUES (11, 'ProBook Laptop', 'Ultrabook for work', 1, 45990, 15, '2023-09-10', 1);
INSERT INTO products (id, name, description, category_id, price, stock_quantity, created_at, is_active) VALUES (12, 'Sports Bag', 'Gym bag', 4, 1990, 90, '2023-06-20', 1);
INSERT INTO products (id, name, description, category_id, price, stock_quantity, created_at, is_active) VALUES (13, 'CottonLine T-Shirt', 'Cotton t-shirt', 2, 1490, 120, '2023-07-01', 1);
INSERT INTO products (id, name, description, category_id, price, stock_quantity, created_at, is_active) VALUES (14, 'CleanBot Robot Vacuum', 'Smart vacuum with navigation', 5, 19990, 25, '2023-10-01', 1);
INSERT INTO products (id, name, description, category_id, price, stock_quantity, created_at, is_active) VALUES (15, 'Tool Set', '100 pieces in a case', 5, 4490, 35, '2023-11-01', 1);
INSERT INTO products (id, name, description, category_id, price, stock_quantity, created_at, is_active) VALUES (16, 'Reader E-Book', 'E-reader with E-Ink display', 1, 9990, 40, '2023-11-15', 1);
INSERT INTO products (id, name, description, category_id, price, stock_quantity, created_at, is_active) VALUES (17, 'Premium Business Suit', 'Three-piece suit', 2, 18990, 10, '2023-09-20', 1);
INSERT INTO products (id, name, description, category_id, price, stock_quantity, created_at, is_active) VALUES (18, 'AntiSlip Yoga Mat', 'Yoga mat', 4, 1290, 110, '2023-05-25', 1);
INSERT INTO products (id, name, description, category_id, price, stock_quantity, created_at, is_active) VALUES (19, 'Bedding Set', 'Satin, double', 5, 3490, 55, '2023-08-10', 1);
INSERT INTO products (id, name, description, category_id, price, stock_quantity, created_at, is_active) VALUES (20, 'UV-Pro Sunglasses', 'Polarized glasses', 6, 3990, 65, '2023-06-15', 1);

-- Orders
INSERT INTO orders (id, customer_id, order_date, status, total_amount, shipping_city) VALUES (1, 1, '2023-06-15', 'delivered', 78980, 'Moscow');
INSERT INTO orders (id, customer_id, order_date, status, total_amount, shipping_city) VALUES (2, 2, '2023-06-20', 'delivered', 8990, 'Saint Petersburg');
INSERT INTO orders (id, customer_id, order_date, status, total_amount, shipping_city) VALUES (3, 3, '2023-07-01', 'delivered', 69990, 'Kazan');
INSERT INTO orders (id, customer_id, order_date, status, total_amount, shipping_city) VALUES (4, 1, '2023-07-10', 'delivered', 5990, 'Moscow');
INSERT INTO orders (id, customer_id, order_date, status, total_amount, shipping_city) VALUES (5, 4, '2023-07-15', 'delivered', 4490, 'Moscow');
INSERT INTO orders (id, customer_id, order_date, status, total_amount, shipping_city) VALUES (6, 5, '2023-08-01', 'delivered', 3490, 'Novosibirsk');
INSERT INTO orders (id, customer_id, order_date, status, total_amount, shipping_city) VALUES (7, 6, '2023-08-10', 'delivered', 45990, 'Moscow');
INSERT INTO orders (id, customer_id, order_date, status, total_amount, shipping_city) VALUES (8, 3, '2023-08-20', 'delivered', 1290, 'Kazan');
INSERT INTO orders (id, customer_id, order_date, status, total_amount, shipping_city) VALUES (9, 7, '2023-09-01', 'delivered', 6990, 'Yekaterinburg');
INSERT INTO orders (id, customer_id, order_date, status, total_amount, shipping_city) VALUES (10, 8, '2023-09-15', 'delivered', 8990, 'Saint Petersburg');
INSERT INTO orders (id, customer_id, order_date, status, total_amount, shipping_city) VALUES (11, 1, '2023-10-01', 'delivered', 19990, 'Moscow');
INSERT INTO orders (id, customer_id, order_date, status, total_amount, shipping_city) VALUES (12, 9, '2023-10-10', 'delivered', 4990, 'Kazan');
INSERT INTO orders (id, customer_id, order_date, status, total_amount, shipping_city) VALUES (13, 10, '2023-10-20', 'cancelled', 2490, 'Moscow');
INSERT INTO orders (id, customer_id, order_date, status, total_amount, shipping_city) VALUES (14, 2, '2023-11-01', 'delivered', 5990, 'Saint Petersburg');
INSERT INTO orders (id, customer_id, order_date, status, total_amount, shipping_city) VALUES (15, 6, '2023-11-15', 'delivered', 9990, 'Moscow');
INSERT INTO orders (id, customer_id, order_date, status, total_amount, shipping_city) VALUES (16, 11, '2023-12-01', 'delivered', 2990, 'Tyumen');
INSERT INTO orders (id, customer_id, order_date, status, total_amount, shipping_city) VALUES (17, 12, '2023-12-10', 'delivered', 45990, 'Moscow');
INSERT INTO orders (id, customer_id, order_date, status, total_amount, shipping_city) VALUES (18, 1, '2024-01-05', 'shipped', 3990, 'Moscow');
INSERT INTO orders (id, customer_id, order_date, status, total_amount, shipping_city) VALUES (19, 8, '2024-01-10', 'processing', 12990, 'Saint Petersburg');
INSERT INTO orders (id, customer_id, order_date, status, total_amount, shipping_city) VALUES (20, 3, '2024-01-15', 'processing', 3490, 'Kazan');
INSERT INTO orders (id, customer_id, order_date, status, total_amount, shipping_city) VALUES (21, 4, '2024-01-20', 'shipped', 5990, 'Moscow');
INSERT INTO orders (id, customer_id, order_date, status, total_amount, shipping_city) VALUES (22, 13, '2024-02-01', 'processing', 18990, 'Krasnodar');
INSERT INTO orders (id, customer_id, order_date, status, total_amount, shipping_city) VALUES (23, 14, '2024-02-05', 'shipped', 4490, 'Saint Petersburg');
INSERT INTO orders (id, customer_id, order_date, status, total_amount, shipping_city) VALUES (24, 15, '2024-02-10', 'new', 1990, 'Moscow');
INSERT INTO orders (id, customer_id, order_date, status, total_amount, shipping_city) VALUES (25, 6, '2024-02-15', 'new', 9990, 'Moscow');

-- Order Items
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (1, 2, 1, 69990);
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (1, 1, 1, 8990);
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (2, 1, 1, 8990);
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (3, 2, 1, 69990);
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (4, 6, 1, 5990);
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (5, 4, 1, 3490);
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (5, 10, 1, 2990);
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (6, 4, 1, 3490);
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (7, 11, 1, 45990);
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (8, 8, 1, 1290);
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (9, 3, 1, 4990);
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (9, 4, 1, 3490);
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (10, 1, 1, 8990);
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (11, 14, 1, 19990);
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (12, 3, 1, 4990);
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (14, 6, 1, 5990);
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (15, 16, 1, 9990);
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (16, 10, 1, 2990);
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (17, 11, 1, 45990);
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (18, 20, 1, 3990);
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (19, 2, 1, 69990);
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (19, 16, 1, 9990);
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (20, 9, 1, 2490);
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (20, 10, 1, 2990);
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (21, 6, 1, 5990);
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (22, 17, 1, 18990);
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (23, 15, 1, 4490);
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (24, 18, 1, 1290);
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (24, 10, 1, 2990);
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (25, 16, 1, 9990);

-- Reviews
INSERT INTO reviews (customer_id, product_id, rating, comment, review_date) VALUES (1, 1, 5, 'Great headphones, noise cancellation works perfectly!', '2023-07-01');
INSERT INTO reviews (customer_id, product_id, rating, comment, review_date) VALUES (2, 1, 4, 'Good sound, but the battery doesn''t last very long.', '2023-07-10');
INSERT INTO reviews (customer_id, product_id, rating, comment, review_date) VALUES (1, 2, 5, 'The best smartphone I''ve ever had!', '2023-07-15');
INSERT INTO reviews (customer_id, product_id, rating, comment, review_date) VALUES (3, 2, 4, 'Camera is great, but the price stings.', '2023-08-01');
INSERT INTO reviews (customer_id, product_id, rating, comment, review_date) VALUES (4, 4, 3, 'Average sound, okay for the price.', '2023-08-05');
INSERT INTO reviews (customer_id, product_id, rating, comment, review_date) VALUES (6, 11, 5, 'Light, fast, battery lasts all day!', '2023-09-01');
INSERT INTO reviews (customer_id, product_id, rating, comment, review_date) VALUES (7, 3, 4, 'Comfortable bracelet, accurate heart rate monitor.', '2023-09-15');
INSERT INTO reviews (customer_id, product_id, rating, comment, review_date) VALUES (8, 1, 5, 'I use it every day, very satisfied!', '2023-10-01');
INSERT INTO reviews (customer_id, product_id, rating, comment, review_date) VALUES (9, 3, 2, 'Sync with phone frequently disconnects.', '2023-10-20');
INSERT INTO reviews (customer_id, product_id, rating, comment, review_date) VALUES (12, 11, 5, 'Perfect laptop for a programmer!', '2023-12-15');
INSERT INTO reviews (customer_id, product_id, rating, comment, review_date) VALUES (1, 14, 4, 'Cleans well, but sometimes gets stuck.', '2024-01-10');
INSERT INTO reviews (customer_id, product_id, rating, comment, review_date) VALUES (8, 16, 5, 'Screen is like real paper, easy on the eyes!', '2024-01-15');
INSERT INTO reviews (customer_id, product_id, rating, comment, review_date) VALUES (3, 6, 3, 'Stiff, need to break them in.', '2024-01-20');
INSERT INTO reviews (customer_id, product_id, rating, comment, review_date) VALUES (6, 16, 4, 'Light, comfortable, fits many books.', '2024-02-01');
INSERT INTO reviews (customer_id, product_id, rating, comment, review_date) VALUES (13, 17, 5, 'Excellent tailoring, quality fabric!', '2024-02-10');
INSERT INTO reviews (customer_id, product_id, rating, comment, review_date) VALUES (2, 9, 4, 'Adjustable brightness, stylish design.', '2024-02-15');
INSERT INTO reviews (customer_id, product_id, rating, comment, review_date) VALUES (14, 15, 4, 'Complete set, tool quality is good.', '2024-02-20');
INSERT INTO reviews (customer_id, product_id, rating, comment, review_date) VALUES (10, 5, 3, 'Warm, but runs small. Get a size up.', '2023-11-05');
INSERT INTO reviews (customer_id, product_id, rating, comment, review_date) VALUES (5, 20, 4, 'Stylish, great polarization.', '2023-09-05');
INSERT INTO reviews (customer_id, product_id, rating, comment, review_date) VALUES (11, 10, 5, 'Quality leather, looks expensive!', '2023-12-10');
`;

export const CLICKHOUSE_EVENTS_SCHEMA = `
CREATE TABLE events (
  id UInt64,
  user_id UInt64,
  event_type String,
  page String,
  element Nullable(String),
  event_time DateTime,
  device String,
  country String,
  duration UInt64
) ENGINE = Memory;`;

export const ANALYTICS_SCHEMA = `
CREATE TABLE events (
  id UInt64,
  user_id UInt64,
  event_type String,
  page String,
  element Nullable(String),
  event_time DateTime,
  device String,
  country String,
  duration UInt64
) ENGINE = Memory;

CREATE TABLE users (
  id UInt64,
  username String,
  email String,
  age UInt8,
  city String,
  registration_date Date,
  is_premium UInt8
);

CREATE TABLE purchases (
  id UInt64,
  user_id UInt64,
  product_id UInt64,
  product_name String,
  amount UInt64,
  purchase_date Date,
  status String,
  payment_method String
);

-- Events
INSERT INTO events (id, user_id, event_type, page, element, event_time, device, country, duration) VALUES (1, 1, 'page_view', '/home', NULL, '2024-01-15 10:30:00', 'desktop', 'Russia', 45);
INSERT INTO events (id, user_id, event_type, page, element, event_time, device, country, duration) VALUES (2, 2, 'page_view', '/products', NULL, '2024-01-15 11:00:00', 'mobile', 'Russia', 120);
INSERT INTO events (id, user_id, event_type, page, element, event_time, device, country, duration) VALUES (3, 1, 'click', '/home', 'btn_login', '2024-01-15 10:35:00', 'desktop', 'Russia', 0);
INSERT INTO events (id, user_id, event_type, page, element, event_time, device, country, duration) VALUES (4, 3, 'page_view', '/courses', NULL, '2024-01-16 09:00:00', 'tablet', 'Russia', 90);
INSERT INTO events (id, user_id, event_type, page, element, event_time, device, country, duration) VALUES (5, 4, 'page_view', '/home', NULL, '2024-01-16 10:00:00', 'desktop', 'Russia', 30);
INSERT INTO events (id, user_id, event_type, page, element, event_time, device, country, duration) VALUES (6, 5, 'click', '/products', 'card_sql', '2024-01-16 11:30:00', 'mobile', 'Russia', 0);
INSERT INTO events (id, user_id, event_type, page, element, event_time, device, country, duration) VALUES (7, 2, 'purchase', '/checkout', NULL, '2024-01-17 14:00:00', 'mobile', 'Russia', 0);
INSERT INTO events (id, user_id, event_type, page, element, event_time, device, country, duration) VALUES (8, 6, 'page_view', '/home', NULL, '2024-01-17 15:00:00', 'desktop', 'Russia', 55);
INSERT INTO events (id, user_id, event_type, page, element, event_time, device, country, duration) VALUES (9, 1, 'page_view', '/courses', NULL, '2024-01-18 08:00:00', 'desktop', 'Russia', 200);
INSERT INTO events (id, user_id, event_type, page, element, event_time, device, country, duration) VALUES (10, 7, 'click', '/home', 'btn_signup', '2024-01-18 09:15:00', 'mobile', 'Kazakhstan', 0);
INSERT INTO events (id, user_id, event_type, page, element, event_time, device, country, duration) VALUES (11, 3, 'click', '/courses', 'btn_enroll', '2024-01-19 10:00:00', 'tablet', 'Russia', 0);
INSERT INTO events (id, user_id, event_type, page, element, event_time, device, country, duration) VALUES (12, 8, 'page_view', '/products', NULL, '2024-01-19 11:00:00', 'desktop', 'Russia', 75);
INSERT INTO events (id, user_id, event_type, page, element, event_time, device, country, duration) VALUES (13, 5, 'page_view', '/home', NULL, '2024-01-20 08:30:00', 'mobile', 'Russia', 40);
INSERT INTO events (id, user_id, event_type, page, element, event_time, device, country, duration) VALUES (14, 9, 'click', '/products', 'card_python', '2024-01-20 09:00:00', 'desktop', 'Russia', 0);
INSERT INTO events (id, user_id, event_type, page, element, event_time, device, country, duration) VALUES (15, 4, 'purchase', '/checkout', NULL, '2024-01-21 12:00:00', 'desktop', 'Russia', 0);
INSERT INTO events (id, user_id, event_type, page, element, event_time, device, country, duration) VALUES (16, 10, 'page_view', '/courses', NULL, '2024-01-21 14:00:00', 'mobile', 'Russia', 60);
INSERT INTO events (id, user_id, event_type, page, element, event_time, device, country, duration) VALUES (17, 11, 'page_view', '/home', NULL, '2024-01-22 08:00:00', 'desktop', 'Russia', 25);
INSERT INTO events (id, user_id, event_type, page, element, event_time, device, country, duration) VALUES (18, 2, 'page_view', '/home', NULL, '2024-01-22 10:00:00', 'mobile', 'Belarus', 35);
INSERT INTO events (id, user_id, event_type, page, element, event_time, device, country, duration) VALUES (19, 12, 'click', '/products', 'card_js', '2024-01-22 11:00:00', 'mobile', 'Russia', 0);
INSERT INTO events (id, user_id, event_type, page, element, event_time, device, country, duration) VALUES (20, 1, 'purchase', '/checkout', NULL, '2024-01-23 09:00:00', 'desktop', 'Russia', 0);
INSERT INTO events (id, user_id, event_type, page, element, event_time, device, country, duration) VALUES (21, 13, 'page_view', '/home', NULL, '2024-01-23 10:00:00', 'desktop', 'Russia', 50);
INSERT INTO events (id, user_id, event_type, page, element, event_time, device, country, duration) VALUES (22, 6, 'click', '/courses', 'btn_enroll', '2024-01-24 08:00:00', 'desktop', 'Russia', 0);
INSERT INTO events (id, user_id, event_type, page, element, event_time, device, country, duration) VALUES (23, 14, 'page_view', '/products', NULL, '2024-01-24 09:00:00', 'mobile', 'Russia', 85);
INSERT INTO events (id, user_id, event_type, page, element, event_time, device, country, duration) VALUES (24, 3, 'page_view', '/home', NULL, '2024-01-24 10:00:00', 'tablet', 'Russia', 15);
`;

export const EMPTY_ORDERS_SCHEMA = `
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

INSERT INTO products (id, name, price, stock) VALUES (1, 'Laptop', 75000, 10);
INSERT INTO products (id, name, price, stock) VALUES (2, 'Mouse', 1500, 50);
INSERT INTO products (id, name, price, stock) VALUES (3, 'Keyboard', 3000, 30);
INSERT INTO products (id, name, price, stock) VALUES (4, 'Monitor', 25000, 15);
INSERT INTO products (id, name, price, stock) VALUES (5, 'Headphones', 5000, 40);
`;

export const INDEX_DEMO_SCHEMA = `
CREATE TABLE books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  genre TEXT,
  published_year INTEGER,
  pages INTEGER,
  rating REAL
);

INSERT INTO books (id, title, author, genre, published_year, pages, rating) VALUES (1, 'War and Peace', 'Tolstoy', 'novel', 1869, 1225, 4.8);
INSERT INTO books (id, title, author, genre, published_year, pages, rating) VALUES (2, 'Crime and Punishment', 'Dostoevsky', 'novel', 1866, 671, 4.7);
INSERT INTO books (id, title, author, genre, published_year, pages, rating) VALUES (3, 'The Master and Margarita', 'Bulgakov', 'novel', 1967, 480, 4.9);
INSERT INTO books (id, title, author, genre, published_year, pages, rating) VALUES (4, 'Eugene Onegin', 'Pushkin', 'poem', 1833, 224, 4.6);
INSERT INTO books (id, title, author, genre, published_year, pages, rating) VALUES (5, 'A Hero of Our Time', 'Lermontov', 'novel', 1840, 210, 4.5);
INSERT INTO books (id, title, author, genre, published_year, pages, rating) VALUES (6, 'Anna Karenina', 'Tolstoy', 'novel', 1877, 864, 4.7);
INSERT INTO books (id, title, author, genre, published_year, pages, rating) VALUES (7, 'The Idiot', 'Dostoevsky', 'novel', 1869, 640, 4.4);
INSERT INTO books (id, title, author, genre, published_year, pages, rating) VALUES (8, 'Fathers and Sons', 'Turgenev', 'novel', 1862, 224, 4.3);
INSERT INTO books (id, title, author, genre, published_year, pages, rating) VALUES (9, 'Dead Souls', 'Gogol', 'poem', 1842, 349, 4.5);
INSERT INTO books (id, title, author, genre, published_year, pages, rating) VALUES (10, 'Oblomov', 'Goncharov', 'novel', 1859, 496, 4.2);
INSERT INTO books (id, title, author, genre, published_year, pages, rating) VALUES (11, 'And Quiet Flows the Don', 'Sholokhov', 'novel', 1940, 1888, 4.6);
INSERT INTO books (id, title, author, genre, published_year, pages, rating) VALUES (12, 'Doctor Zhivago', 'Pasternak', 'novel', 1957, 560, 4.4);
`;
