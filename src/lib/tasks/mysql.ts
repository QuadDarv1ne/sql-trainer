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
    title: 'MySQL: LIMIT с OFFSET',
    description: 'Пагинация результатов запроса',
    difficulty: 'beginner',
    dbType: 'mysql',
    category: 'company',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Выведите сотрудников (first_name, last_name, salary), отсортированных по зарплате DESC, пропустив первые 5 и взяв следующие 10. Используйте LIMIT 10 OFFSET 5.',
    hint: 'В MySQL синтаксис: LIMIT количество OFFSET смещение. Это используется для пагинации.',
    sampleSolution: 'SELECT first_name, last_name, salary FROM employees ORDER BY salary DESC LIMIT 10 OFFSET 5;',
    verificationQuery: 'SELECT COUNT(*) as count FROM employees;',
  },

  {
    id: 'mysql-2',
    title: 'MySQL: STRAIGHT_JOIN',
    description: 'Принудительный порядок соединения таблиц',
    difficulty: 'beginner',
    dbType: 'mysql',
    category: 'company',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Выведите имена сотрудников и названия отделов, используя STRAIGHT_JOIN (MySQL-специфичный аналог INNER JOIN, который принудительно читает левую таблицу первой).',
    hint: 'STRAIGHT_JOIN работает как INNER JOIN, но гарантирует порядок чтения: левая таблица всегда читается первой.',
    sampleSolution:
      'SELECT e.first_name, e.last_name, d.name as department_name FROM employees e STRAIGHT_JOIN departments d ON e.department_id = d.id;',
    verificationQuery: 'SELECT COUNT(*) as count FROM employees e JOIN departments d ON e.department_id = d.id;',
  },

  // ==================== MySQL INTERMEDIATE TASKS ====================
  {
    id: 'mysql-3',
    title: 'MySQL: IF() функция',
    description: 'Условное выражение IF в MySQL',
    difficulty: 'intermediate',
    dbType: 'mysql',
    category: 'company',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Для каждого сотрудника выведите first_name, salary и категорию: "Высокая" если salary > 130000, иначе "Обычная". Используйте функцию IF(salary > 130000, "Высокая", "Обычная").',
    hint: 'MySQL IF(condition, true_val, false_val) — компактная форма CASE WHEN для двух вариантов.',
    sampleSolution:
      "SELECT first_name, salary, IF(salary > 130000, 'Высокая', 'Обычная') as salary_category FROM employees ORDER BY salary DESC;",
    verificationQuery: 'SELECT COUNT(*) as count FROM employees;',
  },

  {
    id: 'mysql-4',
    title: 'MySQL: FIELD() для сортировки',
    description: 'Сортировка в произвольном порядке',
    difficulty: 'intermediate',
    dbType: 'mysql',
    category: 'company',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Выведите сотрудников из отделов "Разработка" (id=1), "Маркетинг" (id=2), "HR" (id=4) в именно этом порядке (не по алфавиту!). Используйте ORDER BY FIELD(department_id, 1, 2, 4).',
    hint: 'FIELD(val, v1, v2, v3...) возвращает позицию val в списке (1, 2, 3...). Используется для кастомной сортировки.',
    sampleSolution:
      'SELECT first_name, last_name, department_id FROM employees WHERE department_id IN (1, 2, 4) ORDER BY FIELD(department_id, 1, 2, 4), last_name;',
    verificationQuery: 'SELECT COUNT(*) as count FROM employees WHERE department_id IN (1, 2, 4);',
  },

  {
    id: 'mysql-5',
    title: 'MySQL: GROUP_CONCAT',
    description: 'Объединение значений в строку при группировке',
    difficulty: 'intermediate',
    dbType: 'mysql',
    category: 'company',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Для каждого отдела выведите название и список имён сотрудников через запятую (отсортированный по алфавиту). Используйте GROUP_CONCAT(first_name ORDER BY first_name SEPARATOR ", ").',
    hint: 'GROUP_CONCAT(expr [ORDER BY ...] [SEPARATOR sep]) — MySQL функция для объединения строк в группе.',
    sampleSolution:
      "SELECT d.name, GROUP_CONCAT(e.first_name ORDER BY e.first_name SEPARATOR ', ') as employee_names FROM departments d LEFT JOIN employees e ON d.id = e.department_id GROUP BY d.id, d.name ORDER BY d.name;",
    verificationQuery: 'SELECT COUNT(*) as count FROM departments;',
  },

  {
    id: 'mysql-6',
    title: 'MySQL: DATE_FORMAT',
    description: 'Форматирование дат в MySQL',
    difficulty: 'intermediate',
    dbType: 'mysql',
    category: 'company',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Выведите сотрудников: first_name, hire_date и formatted_hire_date в формате "DD.MM.YYYY" (например "15.03.2020"). Используйте DATE_FORMAT(hire_date, "%d.%m.%Y").',
    hint: 'DATE_FORMAT(date, format) форматирует дату по шаблону: %d — день, %m — месяц, %Y — 4-значный год.',
    sampleSolution:
      "SELECT first_name, hire_date, DATE_FORMAT(hire_date, '%d.%m.%Y') as formatted_hire_date FROM employees ORDER BY hire_date;",
    verificationQuery: 'SELECT COUNT(*) as count FROM employees;',
  },

  {
    id: 'mysql-7',
    title: 'MySQL: DATEDIFF',
    description: 'Разница между датами в днях',
    difficulty: 'intermediate',
    dbType: 'mysql',
    category: 'company',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Вычислите стаж каждого сотрудника в днях на дату "2024-01-01". Выведите first_name и days_worked = DATEDIFF("2024-01-01", hire_date).',
    hint: 'DATEDIFF(date1, date2) возвращает разницу в днях между двумя датами.',
    sampleSolution:
      'SELECT first_name, DATEDIFF("2024-01-01", hire_date) as days_worked FROM employees ORDER BY days_worked DESC;',
    verificationQuery: 'SELECT COUNT(*) as count FROM employees;',
  },

  {
    id: 'mysql-8',
    title: 'MySQL: INSERT ... ON DUPLICATE KEY UPDATE',
    description: 'UPSERT в MySQL — вставка или обновление',
    difficulty: 'intermediate',
    dbType: 'mysql',
    category: 'company',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Вставьте нового сотрудника: first_name="Тест", last_name="Тестов", email="test@company.ru", department_id=1, salary=100000, hire_date="2024-01-01". Если email уже существует, обновите salary на 150000. Используйте ON DUPLICATE KEY UPDATE.',
    hint: 'INSERT INTO ... VALUES (...) ON DUPLICATE KEY UPDATE salary=150000 — MySQL аналог PostgreSQL UPSERT.',
    sampleSolution:
      "INSERT INTO employees (first_name, last_name, email, department_id, salary, hire_date) VALUES ('Тест', 'Тестов', 'test@company.ru', 1, 100000, '2024-01-01') ON DUPLICATE KEY UPDATE salary = 150000;",
    verificationQuery: "SELECT COUNT(*) as count FROM employees WHERE email = 'test@company.ru';",
  },

  {
    id: 'mysql-9',
    title: 'MySQL: VALUES() в ON DUPLICATE KEY UPDATE',
    description: 'Использование VALUES() для ссылки на новые значения',
    difficulty: 'intermediate',
    dbType: 'mysql',
    category: 'company',
    schema: EMPLOYEES_SCHEMA,
    taskText:
      'Вставьте сотрудника с email="test@company.ru". При конфликте обновите salary на значение, которое пытались вставить. Используйте VALUES(salary) для ссылки на новое значение.',
    hint: 'VALUES(col) внутри ON DUPLICATE KEY UPDATE возвращает значение, которое пытались вставить.',
    sampleSolution:
      "INSERT INTO employees (first_name, last_name, email, department_id, salary, hire_date) VALUES ('Новый', 'Сотрудник', 'test@company.ru', 1, 120000, '2024-06-01') ON DUPLICATE KEY UPDATE salary = VALUES(salary);",
    verificationQuery: "SELECT COUNT(*) as count FROM employees WHERE email = 'test@company.ru';",
  },

  {
    id: 'mysql-10',
    title: 'MySQL: REPLACE INTO',
    description: 'Замена существующей строки или вставка новой',
    difficulty: 'intermediate',
    dbType: 'mysql',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'Используйте REPLACE INTO для вставки категории: name="Игрушки", description="Детские товары". Если категория с таким уникальным ключом существует, она будет удалена и вставлена заново.',
    hint: 'REPLACE INTO работает как INSERT, но при конфликте уникального ключа удаляет старую строку и вставляет новую.',
    sampleSolution: "REPLACE INTO categories (name, description) VALUES ('Игрушки', 'Детские товары');",
    verificationQuery: 'SELECT COUNT(*) as count FROM categories;',
  },

  {
    id: 'mysql-11',
    title: 'MySQL: FIND_IN_SET',
    description: 'Поиск значения в строке, разделённой запятыми',
    difficulty: 'intermediate',
    dbType: 'mysql',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'Представьте, что в таблице orders есть столбец shipping_city со значениями через запятую. Найдите все заказы, где shipping_city содержит "Москва". Используйте FIND_IN_SET("Москва", shipping_city).',
    hint: 'FIND_IN_SET(str, str_list) возвращает позицию str в списке через запятую, или 0 если не найдено.',
    sampleSolution:
      "SELECT id, shipping_city FROM orders WHERE FIND_IN_SET(shipping_city, 'Москва,Санкт-Петербург') > 0;",
    verificationQuery: 'SELECT COUNT(*) as count FROM orders;',
  },

  // ==================== MySQL ADVANCED TASKS ====================
  {
    id: 'mysql-12',
    title: 'MySQL: JSON_EXTRACT и оператор ->>',
    description: 'Работа с JSON в MySQL',
    difficulty: 'advanced',
    dbType: 'mysql',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'Представьте, что в таблице products есть JSON столбец metadata. Найдите товары, где metadata->>"$.brand" = "Samsung". Выведите name и brand. Используйте оператор ->> для извлечения JSON значения как текста.',
    hint: 'MySQL поддерживает JSON тип. col->>"$.key" извлекает значение как текст, col->"$.key" — как JSON.',
    sampleSolution: "SELECT name, metadata->>'$.brand' as brand FROM products WHERE metadata->>'$.brand' = 'Samsung';",
    verificationQuery: 'SELECT COUNT(*) as count FROM products;',
  },

  {
    id: 'mysql-13',
    title: 'MySQL: JSON_ARRAYAGG и JSON_OBJECTAGG',
    description: 'Агрегация данных в JSON формат',
    difficulty: 'advanced',
    dbType: 'mysql',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'Для каждой категории соберите названия товаров в JSON массив. Используйте JSON_ARRAYAGG(p.name). Выведите category_id и products_json.',
    hint: 'JSON_ARRAYAGG(expr) создаёт JSON массив из значений группы. JSON_OBJECTAGG(key, value) — JSON объект.',
    sampleSolution:
      'SELECT c.id as category_id, c.name, JSON_ARRAYAGG(p.name) as products_json FROM categories c LEFT JOIN products p ON c.id = p.category_id GROUP BY c.id, c.name;',
    verificationQuery: 'SELECT COUNT(*) as count FROM categories;',
  },

  {
    id: 'mysql-14',
    title: 'MySQL: WINDOW функции с WINDOW clause',
    description: 'Именованные окна для переиспользования',
    difficulty: 'advanced',
    dbType: 'mysql',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'Выведите заказы с рангом по сумме (total_amount) внутри каждого города доставки и нарастающей суммой. Используйте WINDOW w AS (PARTITION BY shipping_city ORDER BY order_date) для переиспользования определения окна.',
    hint: 'MySQL позволяет определить окно один раз: WINDOW name AS (...), затем использовать: ROW_NUMBER() OVER w, SUM() OVER w.',
    sampleSolution:
      'SELECT id, shipping_city, order_date, total_amount, ROW_NUMBER() OVER w as rn, SUM(total_amount) OVER w as running_total FROM orders WINDOW w AS (PARTITION BY shipping_city ORDER BY order_date) ORDER BY shipping_city, order_date;',
    verificationQuery: 'SELECT COUNT(*) as count FROM orders;',
  },

  {
    id: 'mysql-15',
    title: 'MySQL: CAST и CONVERT',
    description: 'Преобразование типов данных',
    difficulty: 'advanced',
    dbType: 'mysql',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'Выведите товары: name, price и price_as_char — цену, преобразованную в CHAR с помощью CAST(price AS CHAR). Также выведите price_dec = CAST(price AS DECIMAL(10,2)).',
    hint: 'MySQL: CAST(expr AS type) и CONVERT(expr, type) преобразуют типы данных.',
    sampleSolution:
      'SELECT name, price, CAST(price AS CHAR) as price_as_char, CAST(price AS DECIMAL(10,2)) as price_dec FROM products ORDER BY price DESC;',
    verificationQuery: 'SELECT COUNT(*) as count FROM products;',
  },

  {
    id: 'mysql-16',
    title: 'MySQL: REGEXP_LIKE',
    description: 'Поиск по регулярным выражениям',
    difficulty: 'advanced',
    dbType: 'mysql',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'Найдите товары, название которых начинается на гласную букву (A, E, I, O, U, А, Е, Ё, И, О, У, Ы, Э, Ю, Я). Используйте REGEXP_LIKE(name, "^[AEIOUАЕЁИОУЫЭЮЯaeiouаеёиоуыэюя]").',
    hint: 'MySQL REGEXP_LIKE(string, pattern) проверяет соответствие регулярному выражению. ^ — начало строки, [...] — набор символов.',
    sampleSolution:
      "SELECT name FROM products WHERE REGEXP_LIKE(name, '^[AEIOUАЕЁИОУЫЭЮЯaeiouаеёиоуыэюя]') ORDER BY name;",
    verificationQuery: 'SELECT COUNT(*) as count FROM products;',
  },

  {
    id: 'mysql-17',
    title: 'MySQL: WITH ROLLUP',
    description: 'Добавление итоговых строк при группировке',
    difficulty: 'advanced',
    dbType: 'mysql',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'Выведите количество заказов и общую сумму по каждому городу доставки, добавив строку итого (WITH ROLLUP). Для итоговой строки shipping_city будет NULL.',
    hint: 'GROUP BY col WITH ROLLUP добавляет дополнительную строку с агрегатами по всей таблице.',
    sampleSolution:
      'SELECT shipping_city, COUNT(*) as order_count, SUM(total_amount) as total FROM orders GROUP BY shipping_city WITH ROLLUP;',
    verificationQuery: 'SELECT COUNT(*) as count FROM orders;',
  },

  {
    id: 'mysql-18',
    title: 'MySQL: COALESCE в UPDATE',
    description: 'Обновление с обработкой NULL',
    difficulty: 'advanced',
    dbType: 'mysql',
    category: 'shop',
    schema: SHOP_SCHEMA,
    taskText:
      'Обновите все заказы без статуса (NULL): установите status = "Не указан". Используйте WHERE status IS NULL.',
    hint: 'WHERE status IS NULL находит строки с NULL значением.',
    sampleSolution: "UPDATE orders SET status = 'Не указан' WHERE status IS NULL;",
    verificationQuery: 'SELECT COUNT(*) as count FROM orders WHERE status = "Не указан";',
  },
];
