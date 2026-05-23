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
INSERT INTO categories (id, name, description) VALUES (1, 'Электроника', 'Техника и гаджеты');
INSERT INTO categories (id, name, description) VALUES (2, 'Одежда', 'Мужская и женская одежда');
INSERT INTO categories (id, name, description) VALUES (3, 'Книги', 'Книги различных жанров');
INSERT INTO categories (id, name, description) VALUES (4, 'Спорт', 'Спортивные товары');
INSERT INTO categories (id, name, description) VALUES (5, 'Дом и сад', 'Товары для дома');
INSERT INTO categories (id, name, description) VALUES (6, 'Аксессуары', 'Сумки, часы, украшения');

-- Customers
INSERT INTO customers (id, first_name, last_name, email, phone, city, registration_date, is_vip) VALUES (1, 'Андрей', 'Смирнов', 'andrey@mail.ru', '+79001234501', 'Москва', '2022-01-15', 1);
INSERT INTO customers (id, first_name, last_name, email, phone, city, registration_date, is_vip) VALUES (2, 'Марина', 'Козлова', 'marina@mail.ru', '+79001234502', 'Санкт-Петербург', '2022-03-20', 0);
INSERT INTO customers (id, first_name, last_name, email, phone, city, registration_date, is_vip) VALUES (3, 'Дмитрий', 'Иванов', 'dmitry@mail.ru', '+79001234503', 'Казань', '2022-05-10', 1);
INSERT INTO customers (id, first_name, last_name, email, phone, city, registration_date, is_vip) VALUES (4, 'Ольга', 'Петрова', 'olga@mail.ru', '+79001234504', 'Москва', '2022-07-01', 0);
INSERT INTO customers (id, first_name, last_name, email, phone, city, registration_date, is_vip) VALUES (5, 'Сергей', 'Новиков', 'sergey@mail.ru', '+79001234505', 'Новосибирск', '2022-08-15', 0);
INSERT INTO customers (id, first_name, last_name, email, phone, city, registration_date, is_vip) VALUES (6, 'Елена', 'Волкова', 'elena@mail.ru', '+79001234506', 'Москва', '2022-09-20', 1);
INSERT INTO customers (id, first_name, last_name, email, phone, city, registration_date, is_vip) VALUES (7, 'Павел', 'Морозов', 'pavel@mail.ru', '+79001234507', 'Екатеринбург', '2023-01-05', 0);
INSERT INTO customers (id, first_name, last_name, email, phone, city, registration_date, is_vip) VALUES (8, 'Анна', 'Соколова', 'anna@mail.ru', '+79001234508', 'Санкт-Петербург', '2023-02-14', 1);
INSERT INTO customers (id, first_name, last_name, email, phone, city, registration_date, is_vip) VALUES (9, 'Игорь', 'Лебедев', 'igor@mail.ru', '+79001234509', 'Казань', '2023-04-10', 0);
INSERT INTO customers (id, first_name, last_name, email, phone, city, registration_date, is_vip) VALUES (10, 'Наталья', 'Кузнецова', 'natalia@mail.ru', '+79001234510', 'Москва', '2023-05-22', 0);
INSERT INTO customers (id, first_name, last_name, email, phone, city, registration_date, is_vip) VALUES (11, 'Максим', 'Попов', 'maxim@mail.ru', '+79001234511', 'Тюмень', '2023-07-01', 0);
INSERT INTO customers (id, first_name, last_name, email, phone, city, registration_date, is_vip) VALUES (12, 'Виктория', 'Васильева', 'victoria@mail.ru', '+79001234512', 'Москва', '2023-08-30', 1);
INSERT INTO customers (id, first_name, last_name, email, phone, city, registration_date, is_vip) VALUES (13, 'Роман', 'Зайцев', 'roman@mail.ru', '+79001234513', 'Краснодар', '2023-10-15', 0);
INSERT INTO customers (id, first_name, last_name, email, phone, city, registration_date, is_vip) VALUES (14, 'Татьяна', 'Павлова', 'tatiana@mail.ru', '+79001234514', 'Санкт-Петербург', '2023-11-20', 0);
INSERT INTO customers (id, first_name, last_name, email, phone, city, registration_date, is_vip) VALUES (15, 'Алексей', 'Семёнов', 'alexey@mail.ru', '+79001234515', 'Москва', '2024-01-10', 0);

-- Products
INSERT INTO products (id, name, description, category_id, price, stock_quantity, created_at, is_active) VALUES (1, 'Беспроводные наушники Pro', 'Наушники с активным шумоподавлением', 1, 8990, 50, '2023-01-10', 1);
INSERT INTO products (id, name, description, category_id, price, stock_quantity, created_at, is_active) VALUES (2, 'Смартфон Galaxy X', 'Флагманский смартфон', 1, 69990, 20, '2023-02-15', 1);
INSERT INTO products (id, name, description, category_id, price, stock_quantity, created_at, is_active) VALUES (3, 'Умные часы FitBand', 'Фитнес-браслет с пульсометром', 1, 4990, 100, '2023-03-20', 1);
INSERT INTO products (id, name, description, category_id, price, stock_quantity, created_at, is_active) VALUES (4, 'Портативная колонка Bass+', 'Водонепроницаемая колонка', 1, 3490, 75, '2023-04-05', 1);
INSERT INTO products (id, name, description, category_id, price, stock_quantity, created_at, is_active) VALUES (5, 'Зимняя куртка Nord', 'Пуховик с капюшоном', 2, 12990, 30, '2023-05-10', 1);
INSERT INTO products (id, name, description, category_id, price, stock_quantity, created_at, is_active) VALUES (6, 'Кроссовки RunMax', 'Беговые кроссовки', 4, 5990, 60, '2023-06-01', 1);
INSERT INTO products (id, name, description, category_id, price, stock_quantity, created_at, is_active) VALUES (7, 'Роман "Мастер и Маргарита"', 'Классика мировой литературы', 3, 690, 200, '2023-01-01', 1);
INSERT INTO products (id, name, description, category_id, price, stock_quantity, created_at, is_active) VALUES (8, 'Справочник по SQL', 'Учебное пособие по базам данных', 3, 1290, 150, '2023-02-10', 1);
INSERT INTO products (id, name, description, category_id, price, stock_quantity, created_at, is_active) VALUES (9, 'Настольная лампа LED', 'Лампа с регулировкой яркости', 5, 2490, 45, '2023-07-15', 1);
INSERT INTO products (id, name, description, category_id, price, stock_quantity, created_at, is_active) VALUES (10, 'Кожаный ремень Classic', 'Ремень из натуральной кожи', 6, 2990, 80, '2023-08-01', 1);
INSERT INTO products (id, name, description, category_id, price, stock_quantity, created_at, is_active) VALUES (11, 'Ноутбук ProBook', 'Ультрабук для работы', 1, 45990, 15, '2023-09-10', 1);
INSERT INTO products (id, name, description, category_id, price, stock_quantity, created_at, is_active) VALUES (12, 'Спортивная сумка', 'Сумка для тренажёрного зала', 4, 1990, 90, '2023-06-20', 1);
INSERT INTO products (id, name, description, category_id, price, stock_quantity, created_at, is_active) VALUES (13, 'Футболка CottonLine', 'Хлопковая футболка', 2, 1490, 120, '2023-07-01', 1);
INSERT INTO products (id, name, description, category_id, price, stock_quantity, created_at, is_active) VALUES (14, 'Робот-пылесос CleanBot', 'Умный пылесос с навигацией', 5, 19990, 25, '2023-10-01', 1);
INSERT INTO products (id, name, description, category_id, price, stock_quantity, created_at, is_active) VALUES (15, 'Набор инструментов', '100 предметов в кейсе', 5, 4490, 35, '2023-11-01', 1);
INSERT INTO products (id, name, description, category_id, price, stock_quantity, created_at, is_active) VALUES (16, 'Электронная книга Reader', 'Читалка с E-Ink экраном', 1, 9990, 40, '2023-11-15', 1);
INSERT INTO products (id, name, description, category_id, price, stock_quantity, created_at, is_active) VALUES (17, 'Костюм деловой Premium', 'Костюм-тройка', 2, 18990, 10, '2023-09-20', 1);
INSERT INTO products (id, name, description, category_id, price, stock_quantity, created_at, is_active) VALUES (18, 'Йога-мат AntiSlip', 'Коврик для йоги', 4, 1290, 110, '2023-05-25', 1);
INSERT INTO products (id, name, description, category_id, price, stock_quantity, created_at, is_active) VALUES (19, 'Набор постельного белья', 'Сатин, двуспальный', 5, 3490, 55, '2023-08-10', 1);
INSERT INTO products (id, name, description, category_id, price, stock_quantity, created_at, is_active) VALUES (20, 'Солнцезащитные очки UV-Pro', 'Поляризованные очки', 6, 3990, 65, '2023-06-15', 1);

-- Orders
INSERT INTO orders (id, customer_id, order_date, status, total_amount, shipping_city) VALUES (1, 1, '2023-06-15', 'delivered', 78980, 'Москва');
INSERT INTO orders (id, customer_id, order_date, status, total_amount, shipping_city) VALUES (2, 2, '2023-06-20', 'delivered', 8990, 'Санкт-Петербург');
INSERT INTO orders (id, customer_id, order_date, status, total_amount, shipping_city) VALUES (3, 3, '2023-07-01', 'delivered', 69990, 'Казань');
INSERT INTO orders (id, customer_id, order_date, status, total_amount, shipping_city) VALUES (4, 1, '2023-07-10', 'delivered', 5990, 'Москва');
INSERT INTO orders (id, customer_id, order_date, status, total_amount, shipping_city) VALUES (5, 4, '2023-07-15', 'delivered', 4490, 'Москва');
INSERT INTO orders (id, customer_id, order_date, status, total_amount, shipping_city) VALUES (6, 5, '2023-08-01', 'delivered', 3490, 'Новосибирск');
INSERT INTO orders (id, customer_id, order_date, status, total_amount, shipping_city) VALUES (7, 6, '2023-08-10', 'delivered', 45990, 'Москва');
INSERT INTO orders (id, customer_id, order_date, status, total_amount, shipping_city) VALUES (8, 3, '2023-08-20', 'delivered', 1290, 'Казань');
INSERT INTO orders (id, customer_id, order_date, status, total_amount, shipping_city) VALUES (9, 7, '2023-09-01', 'delivered', 6990, 'Екатеринбург');
INSERT INTO orders (id, customer_id, order_date, status, total_amount, shipping_city) VALUES (10, 8, '2023-09-15', 'delivered', 8990, 'Санкт-Петербург');
INSERT INTO orders (id, customer_id, order_date, status, total_amount, shipping_city) VALUES (11, 1, '2023-10-01', 'delivered', 19990, 'Москва');
INSERT INTO orders (id, customer_id, order_date, status, total_amount, shipping_city) VALUES (12, 9, '2023-10-10', 'delivered', 4990, 'Казань');
INSERT INTO orders (id, customer_id, order_date, status, total_amount, shipping_city) VALUES (13, 10, '2023-10-20', 'cancelled', 2490, 'Москва');
INSERT INTO orders (id, customer_id, order_date, status, total_amount, shipping_city) VALUES (14, 2, '2023-11-01', 'delivered', 5990, 'Санкт-Петербург');
INSERT INTO orders (id, customer_id, order_date, status, total_amount, shipping_city) VALUES (15, 6, '2023-11-15', 'delivered', 9990, 'Москва');
INSERT INTO orders (id, customer_id, order_date, status, total_amount, shipping_city) VALUES (16, 11, '2023-12-01', 'delivered', 2990, 'Тюмень');
INSERT INTO orders (id, customer_id, order_date, status, total_amount, shipping_city) VALUES (17, 12, '2023-12-10', 'delivered', 45990, 'Москва');
INSERT INTO orders (id, customer_id, order_date, status, total_amount, shipping_city) VALUES (18, 1, '2024-01-05', 'shipped', 3990, 'Москва');
INSERT INTO orders (id, customer_id, order_date, status, total_amount, shipping_city) VALUES (19, 8, '2024-01-10', 'processing', 12990, 'Санкт-Петербург');
INSERT INTO orders (id, customer_id, order_date, status, total_amount, shipping_city) VALUES (20, 3, '2024-01-15', 'processing', 3490, 'Казань');
INSERT INTO orders (id, customer_id, order_date, status, total_amount, shipping_city) VALUES (21, 4, '2024-01-20', 'shipped', 5990, 'Москва');
INSERT INTO orders (id, customer_id, order_date, status, total_amount, shipping_city) VALUES (22, 13, '2024-02-01', 'processing', 18990, 'Краснодар');
INSERT INTO orders (id, customer_id, order_date, status, total_amount, shipping_city) VALUES (23, 14, '2024-02-05', 'shipped', 4490, 'Санкт-Петербург');
INSERT INTO orders (id, customer_id, order_date, status, total_amount, shipping_city) VALUES (24, 15, '2024-02-10', 'new', 1990, 'Москва');
INSERT INTO orders (id, customer_id, order_date, status, total_amount, shipping_city) VALUES (25, 6, '2024-02-15', 'new', 9990, 'Москва');

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
INSERT INTO reviews (customer_id, product_id, rating, comment, review_date) VALUES (1, 1, 5, 'Отличные наушники, шумоподавление работает прекрасно!', '2023-07-01');
INSERT INTO reviews (customer_id, product_id, rating, comment, review_date) VALUES (2, 1, 4, 'Хороший звук, но батарея держит не очень долго.', '2023-07-10');
INSERT INTO reviews (customer_id, product_id, rating, comment, review_date) VALUES (1, 2, 5, 'Лучший смартфон из тех что у меня были!', '2023-07-15');
INSERT INTO reviews (customer_id, product_id, rating, comment, review_date) VALUES (3, 2, 4, 'Камера супер, но цена кусается.', '2023-08-01');
INSERT INTO reviews (customer_id, product_id, rating, comment, review_date) VALUES (4, 4, 3, 'Звук средний, за свою цену нормально.', '2023-08-05');
INSERT INTO reviews (customer_id, product_id, rating, comment, review_date) VALUES (6, 11, 5, 'Легкий, быстрый, батарея на весь день!', '2023-09-01');
INSERT INTO reviews (customer_id, product_id, rating, comment, review_date) VALUES (7, 3, 4, 'Удобный браслет, пульсометр точный.', '2023-09-15');
INSERT INTO reviews (customer_id, product_id, rating, comment, review_date) VALUES (8, 1, 5, 'Пользуюсь каждый день, очень доволен!', '2023-10-01');
INSERT INTO reviews (customer_id, product_id, rating, comment, review_date) VALUES (9, 3, 2, 'Синхронизация с телефоном часто отваливается.', '2023-10-20');
INSERT INTO reviews (customer_id, product_id, rating, comment, review_date) VALUES (12, 11, 5, 'Идеальный ноутбук для программиста!', '2023-12-15');
INSERT INTO reviews (customer_id, product_id, rating, comment, review_date) VALUES (1, 14, 4, 'Хорошо убирает, но иногда застревает.', '2024-01-10');
INSERT INTO reviews (customer_id, product_id, rating, comment, review_date) VALUES (8, 16, 5, 'Экран как настоящая бумага, глазам легко!', '2024-01-15');
INSERT INTO reviews (customer_id, product_id, rating, comment, review_date) VALUES (3, 6, 3, 'Жесткие, надо разнашивать.', '2024-01-20');
INSERT INTO reviews (customer_id, product_id, rating, comment, review_date) VALUES (6, 16, 4, 'Лёгкая, удобная, много книг вмещается.', '2024-02-01');
INSERT INTO reviews (customer_id, product_id, rating, comment, review_date) VALUES (13, 17, 5, 'Пошив отличный, ткань качественная!', '2024-02-10');
INSERT INTO reviews (customer_id, product_id, rating, comment, review_date) VALUES (2, 9, 4, 'Яркость регулируется, стильный дизайн.', '2024-02-15');
INSERT INTO reviews (customer_id, product_id, rating, comment, review_date) VALUES (14, 15, 4, 'Полный набор, качество инструментов на уровне.', '2024-02-20');
INSERT INTO reviews (customer_id, product_id, rating, comment, review_date) VALUES (10, 5, 3, 'Тёплая, но маломерка. Берите на размер больше.', '2023-11-05');
INSERT INTO reviews (customer_id, product_id, rating, comment, review_date) VALUES (5, 20, 4, 'Стильные, polarization на высоте.', '2023-09-05');
INSERT INTO reviews (customer_id, product_id, rating, comment, review_date) VALUES (11, 10, 5, 'Качественная кожа, выглядит дорого!', '2023-12-10');
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
INSERT INTO events (id, user_id, event_type, page, element, event_time, device, country, duration) VALUES (1, 1, 'page_view', '/home', NULL, '2024-01-15 10:30:00', 'desktop', 'Россия', 45);
INSERT INTO events (id, user_id, event_type, page, element, event_time, device, country, duration) VALUES (2, 2, 'page_view', '/products', NULL, '2024-01-15 11:00:00', 'mobile', 'Россия', 120);
INSERT INTO events (id, user_id, event_type, page, element, event_time, device, country, duration) VALUES (3, 1, 'click', '/home', 'btn_login', '2024-01-15 10:35:00', 'desktop', 'Россия', 0);
INSERT INTO events (id, user_id, event_type, page, element, event_time, device, country, duration) VALUES (4, 3, 'page_view', '/courses', NULL, '2024-01-16 09:00:00', 'tablet', 'Россия', 90);
INSERT INTO events (id, user_id, event_type, page, element, event_time, device, country, duration) VALUES (5, 4, 'page_view', '/home', NULL, '2024-01-16 10:00:00', 'desktop', 'Россия', 30);
INSERT INTO events (id, user_id, event_type, page, element, event_time, device, country, duration) VALUES (6, 5, 'click', '/products', 'card_sql', '2024-01-16 11:30:00', 'mobile', 'Россия', 0);
INSERT INTO events (id, user_id, event_type, page, element, event_time, device, country, duration) VALUES (7, 2, 'purchase', '/checkout', NULL, '2024-01-17 14:00:00', 'mobile', 'Россия', 0);
INSERT INTO events (id, user_id, event_type, page, element, event_time, device, country, duration) VALUES (8, 6, 'page_view', '/home', NULL, '2024-01-17 15:00:00', 'desktop', 'Россия', 55);
INSERT INTO events (id, user_id, event_type, page, element, event_time, device, country, duration) VALUES (9, 1, 'page_view', '/courses', NULL, '2024-01-18 08:00:00', 'desktop', 'Россия', 200);
INSERT INTO events (id, user_id, event_type, page, element, event_time, device, country, duration) VALUES (10, 7, 'click', '/home', 'btn_signup', '2024-01-18 09:15:00', 'mobile', 'Казахстан', 0);
INSERT INTO events (id, user_id, event_type, page, element, event_time, device, country, duration) VALUES (11, 3, 'click', '/courses', 'btn_enroll', '2024-01-19 10:00:00', 'tablet', 'Россия', 0);
INSERT INTO events (id, user_id, event_type, page, element, event_time, device, country, duration) VALUES (12, 8, 'page_view', '/products', NULL, '2024-01-19 11:00:00', 'desktop', 'Россия', 75);
INSERT INTO events (id, user_id, event_type, page, element, event_time, device, country, duration) VALUES (13, 5, 'page_view', '/home', NULL, '2024-01-20 08:30:00', 'mobile', 'Россия', 40);
INSERT INTO events (id, user_id, event_type, page, element, event_time, device, country, duration) VALUES (14, 9, 'click', '/products', 'card_python', '2024-01-20 09:00:00', 'desktop', 'Россия', 0);
INSERT INTO events (id, user_id, event_type, page, element, event_time, device, country, duration) VALUES (15, 4, 'purchase', '/checkout', NULL, '2024-01-21 12:00:00', 'desktop', 'Россия', 0);
INSERT INTO events (id, user_id, event_type, page, element, event_time, device, country, duration) VALUES (16, 10, 'page_view', '/courses', NULL, '2024-01-21 14:00:00', 'mobile', 'Россия', 60);
INSERT INTO events (id, user_id, event_type, page, element, event_time, device, country, duration) VALUES (17, 11, 'page_view', '/home', NULL, '2024-01-22 08:00:00', 'desktop', 'Россия', 25);
INSERT INTO events (id, user_id, event_type, page, element, event_time, device, country, duration) VALUES (18, 2, 'page_view', '/home', NULL, '2024-01-22 10:00:00', 'mobile', 'Беларусь', 35);
INSERT INTO events (id, user_id, event_type, page, element, event_time, device, country, duration) VALUES (19, 12, 'click', '/products', 'card_js', '2024-01-22 11:00:00', 'mobile', 'Россия', 0);
INSERT INTO events (id, user_id, event_type, page, element, event_time, device, country, duration) VALUES (20, 1, 'purchase', '/checkout', NULL, '2024-01-23 09:00:00', 'desktop', 'Россия', 0);
INSERT INTO events (id, user_id, event_type, page, element, event_time, device, country, duration) VALUES (21, 13, 'page_view', '/home', NULL, '2024-01-23 10:00:00', 'desktop', 'Россия', 50);
INSERT INTO events (id, user_id, event_type, page, element, event_time, device, country, duration) VALUES (22, 6, 'click', '/courses', 'btn_enroll', '2024-01-24 08:00:00', 'desktop', 'Россия', 0);
INSERT INTO events (id, user_id, event_type, page, element, event_time, device, country, duration) VALUES (23, 14, 'page_view', '/products', NULL, '2024-01-24 09:00:00', 'mobile', 'Россия', 85);
INSERT INTO events (id, user_id, event_type, page, element, event_time, device, country, duration) VALUES (24, 3, 'page_view', '/home', NULL, '2024-01-24 10:00:00', 'tablet', 'Россия', 15);
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

INSERT INTO products (id, name, price, stock) VALUES (1, 'Ноутбук', 75000, 10);
INSERT INTO products (id, name, price, stock) VALUES (2, 'Мышь', 1500, 50);
INSERT INTO products (id, name, price, stock) VALUES (3, 'Клавиатура', 3000, 30);
INSERT INTO products (id, name, price, stock) VALUES (4, 'Монитор', 25000, 15);
INSERT INTO products (id, name, price, stock) VALUES (5, 'Наушники', 5000, 40);
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
