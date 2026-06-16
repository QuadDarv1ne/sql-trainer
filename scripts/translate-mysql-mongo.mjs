import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const replacements = [];

function add(ru, en) {
  replacements.push([ru, en]);
}

// ==================== MYSQL TRANSLATIONS ====================

// mysql-1
add("title: 'MySQL: LIMIT с OFFSET',", "title: 'MySQL: LIMIT with OFFSET',");
add("description: 'Пагинация результатов запроса',", "description: 'Query result pagination',");
add(
  "taskText:\n      'Выведите сотрудников (first_name, last_name, salary), отсортированных по зарплате DESC, пропустив первые 5 и взяв следующие 10. Используйте LIMIT 10 OFFSET 5.',",
  "taskText:\n      'Display employees (first_name, last_name, salary), sorted by salary DESC, skipping the first 5 and taking the next 10. Use LIMIT 10 OFFSET 5.',",
);
add(
  "hint: 'В MySQL синтаксис: LIMIT количество OFFSET смещение. Это используется для пагинации.',",
  "hint: 'In MySQL syntax: LIMIT count OFFSET offset. This is used for pagination.',",
);

// mysql-2
add("description: 'Принудительный порядок соединения таблиц',", "description: 'Forced table join order',");
add(
  "taskText:\n      'Выведите имена сотрудников и названия отделов, используя STRAIGHT_JOIN (MySQL-специфичный аналог INNER JOIN, который принудительно читает левую таблицу первой).',",
  "taskText:\n      'Display employee names and department names using STRAIGHT_JOIN (a MySQL-specific analog of INNER JOIN that forces reading the left table first).',",
);
add(
  "hint: 'STRAIGHT_JOIN работает как INNER JOIN, но гарантирует порядок чтения: левая таблица всегда читается первой.',",
  "hint: 'STRAIGHT_JOIN works like INNER JOIN but guarantees read order: the left table is always read first.',",
);

// mysql-3
add("title: 'MySQL: IF() функция',", "title: 'MySQL: IF() function',");
add("description: 'Условное выражение IF в MySQL',", "description: 'Conditional expression IF in MySQL',");
add(
  'taskText:\n      \'Для каждого сотрудника выведите first_name, salary и категорию: "Высокая" если salary > 130000, иначе "Обычная". Используйте функцию IF(salary > 130000, "Высокая", "Обычная").\',',
  'taskText:\n      \'For each employee display first_name, salary and category: "High" if salary > 130000, otherwise "Regular". Use IF(salary > 130000, "High", "Regular").\',',
);
add(
  "hint: 'MySQL IF(condition, true_val, false_val) — компактная форма CASE WHEN для двух вариантов.',",
  "hint: 'MySQL IF(condition, true_val, false_val) — compact form of CASE WHEN for two options.',",
);

// mysql-4
add("title: 'MySQL: FIELD() для сортировки',", "title: 'MySQL: FIELD() for sorting',");
add("description: 'Сортировка в произвольном порядке',", "description: 'Custom order sorting',");
add(
  'taskText:\n      \'Выведите сотрудников из отделов "Разработка" (id=1), "Маркетинг" (id=2), "HR" (id=4) в именно этом порядке (не по алфавиту!). Используйте ORDER BY FIELD(department_id, 1, 2, 4).\',',
  'taskText:\n      \'Display employees from departments "Development" (id=1), "Marketing" (id=2), "HR" (id=4) in exactly this order (not alphabetically!). Use ORDER BY FIELD(department_id, 1, 2, 4).\',',
);
add(
  "hint: 'FIELD(val, v1, v2, v3...) возвращает позицию val в списке (1, 2, 3...). Используется для кастомной сортировки.',",
  "hint: 'FIELD(val, v1, v2, v3...) returns the position of val in the list (1, 2, 3...). Used for custom sorting.',",
);

// mysql-5
add("title: 'MySQL: GROUP_CONCAT',", "title: 'MySQL: GROUP_CONCAT',");
add(
  "description: 'Объединение значений в строку при группировке',",
  "description: 'Concatenate values into string when grouping',",
);
add(
  'taskText:\n      \'Для каждого отдела выведите название и список имён сотрудников через запятую (отсортированный по алфавиту). Используйте GROUP_CONCAT(first_name ORDER BY first_name SEPARATOR ", ").\',',
  'taskText:\n      \'For each department display the name and a comma-separated list of employee names (sorted alphabetically). Use GROUP_CONCAT(first_name ORDER BY first_name SEPARATOR ", ").\',',
);
add(
  "hint: 'GROUP_CONCAT(expr [ORDER BY ...] [SEPARATOR sep]) — MySQL функция для объединения строк в группе.',",
  "hint: 'GROUP_CONCAT(expr [ORDER BY ...] [SEPARATOR sep]) — MySQL function for concatenating strings in a group.',",
);

// mysql-6
add("title: 'MySQL: DATE_FORMAT',", "title: 'MySQL: DATE_FORMAT',");
add("description: 'Форматирование дат в MySQL',", "description: 'Date formatting in MySQL',");
add(
  'taskText:\n      \'Выведите сотрудников: first_name, hire_date и formatted_hire_date в формате "DD.MM.YYYY" (например "15.03.2020"). Используйте DATE_FORMAT(hire_date, "%d.%m.%Y").\',',
  'taskText:\n      \'Display employees: first_name, hire_date and formatted_hire_date in "DD.MM.YYYY" format (e.g. "15.03.2020"). Use DATE_FORMAT(hire_date, "%d.%m.%Y").\',',
);
add(
  "hint: 'DATE_FORMAT(date, format) форматирует дату по шаблону: %d — день, %m — месяц, %Y — 4-значный год.',",
  "hint: 'DATE_FORMAT(date, format) formats a date: %d — day, %m — month, %Y — 4-digit year.',",
);

// mysql-7
add("title: 'MySQL: DATEDIFF',", "title: 'MySQL: DATEDIFF',");
add("description: 'Разница между датами в днях',", "description: 'Difference between dates in days',");
add(
  'taskText:\n      \'Вычислите стаж каждого сотрудника в днях на дату "2024-01-01". Выведите first_name и days_worked = DATEDIFF("2024-01-01", hire_date).\',',
  'taskText:\n      \'Calculate each employee\\\'s tenure in days as of "2024-01-01". Display first_name and days_worked = DATEDIFF("2024-01-01", hire_date).\',',
);
add(
  "hint: 'DATEDIFF(date1, date2) возвращает разницу в днях между двумя датами.',",
  "hint: 'DATEDIFF(date1, date2) returns the difference in days between two dates.',",
);

// mysql-8
add("title: 'MySQL: INSERT ... ON DUPLICATE KEY UPDATE',", "title: 'MySQL: INSERT ... ON DUPLICATE KEY UPDATE',");
add("description: 'UPSERT в MySQL — вставка или обновление',", "description: 'UPSERT in MySQL — insert or update',");
add(
  'taskText:\n      \'Вставьте нового сотрудника: first_name="Тест", last_name="Тестов", email="test@company.ru", department_id=1, salary=100000, hire_date="2024-01-01". Если email уже существует, обновите salary на 150000. Используйте ON DUPLICATE KEY UPDATE.\',',
  'taskText:\n      \'Insert a new employee: first_name="Test", last_name="Testov", email="test@company.ru", department_id=1, salary=100000, hire_date="2024-01-01". If the email already exists, update salary to 150000. Use ON DUPLICATE KEY UPDATE.\',',
);
add(
  "hint: 'INSERT INTO ... VALUES (...) ON DUPLICATE KEY UPDATE salary=150000 — MySQL аналог PostgreSQL UPSERT.',",
  "hint: 'INSERT INTO ... VALUES (...) ON DUPLICATE KEY UPDATE salary=150000 — MySQL equivalent of PostgreSQL UPSERT.',",
);

// mysql-9
add("title: 'MySQL: VALUES() в ON DUPLICATE KEY UPDATE',", "title: 'MySQL: VALUES() in ON DUPLICATE KEY UPDATE',");
add(
  "description: 'Использование VALUES() для ссылки на новые значения',",
  "description: 'Using VALUES() to reference new values',",
);
add(
  'taskText:\n      \'Вставьте сотрудника с email="test@company.ru". При конфликте обновите salary на значение, которое пытались вставить. Используйте VALUES(salary) для ссылки на новое значение.\',',
  'taskText:\n      \'Insert an employee with email="test@company.ru". On conflict, update salary to the value you tried to insert. Use VALUES(salary) to reference the new value.\',',
);
add(
  "hint: 'VALUES(col) внутри ON DUPLICATE KEY UPDATE возвращает значение, которое пытались вставить.',",
  "hint: 'VALUES(col) inside ON DUPLICATE KEY UPDATE returns the value that was attempted to be inserted.',",
);

// mysql-10
add("title: 'MySQL: REPLACE INTO',", "title: 'MySQL: REPLACE INTO',");
add(
  "description: 'Замена существующей строки или вставка новой',",
  "description: 'Replace existing row or insert new',",
);
add(
  'taskText:\n      \'Используйте REPLACE INTO для вставки категории: name="Игрушки", description="Детские товары". Если категория с таким уникальным ключом существует, она будет удалена и вставлена заново.\',',
  'taskText:\n      \'Use REPLACE INTO to insert a category: name="Toys", description="Kids products". If a category with this unique key exists, it will be deleted and re-inserted.\',',
);
add(
  "hint: 'REPLACE INTO работает как INSERT, но при конфликте уникального ключа удаляет старую строку и вставляет новую.',",
  "hint: 'REPLACE INTO works like INSERT, but on unique key conflict it deletes the old row and inserts a new one.',",
);

// mysql-11
add("title: 'MySQL: FIND_IN_SET',", "title: 'MySQL: FIND_IN_SET',");
add(
  "description: 'Поиск значения в строке, разделённой запятыми',",
  "description: 'Search in comma-separated string',",
);
add(
  'taskText:\n      \'Представьте, что в таблице orders есть столбец shipping_city со значениями через запятую. Найдите все заказы, где shipping_city содержит "Москва". Используйте FIND_IN_SET("Москва", shipping_city).\',',
  'taskText:\n      \'Imagine the orders table has a shipping_city column with comma-separated values. Find all orders where shipping_city contains "Moscow". Use FIND_IN_SET("Moscow", shipping_city).\',',
);
add(
  "hint: 'FIND_IN_SET(str, str_list) возвращает позицию str в списке через запятую, или 0 если не найдено.',",
  "hint: 'FIND_IN_SET(str, str_list) returns the position of str in a comma-separated list, or 0 if not found.',",
);

// mysql-12
add("title: 'MySQL: JSON_EXTRACT и оператор ->>',", "title: 'MySQL: JSON_EXTRACT and ->> operator',");
add("description: 'Работа с JSON в MySQL',", "description: 'Working with JSON in MySQL',");
add(
  'taskText:\n      \'Представьте, что в таблице products есть JSON столбец metadata. Найдите товары, где metadata->>"$.brand" = "Samsung". Выведите name и brand. Используйте оператор ->> для извлечения JSON значения как текста.\',',
  'taskText:\n      \'Imagine the products table has a JSON column metadata. Find products where metadata->>"$.brand" = "Samsung". Display name and brand. Use the ->> operator to extract JSON value as text.\',',
);
add(
  'hint: \'MySQL поддерживает JSON тип. col->>"$.key" извлекает значение как текст, col->"$.key" — как JSON.\',',
  'hint: \'MySQL supports JSON type. col->>"$.key" extracts value as text, col->"$.key" as JSON.\',',
);

// mysql-13
add("title: 'MySQL: JSON_ARRAYAGG и JSON_OBJECTAGG',", "title: 'MySQL: JSON_ARRAYAGG and JSON_OBJECTAGG',");
add("description: 'Агрегация данных в JSON формат',", "description: 'Aggregating data into JSON format',");
add(
  "taskText:\n      'Для каждой категории соберите названия товаров в JSON массив. Используйте JSON_ARRAYAGG(p.name). Выведите category_id и products_json.',",
  "taskText:\n      'For each category collect product names into a JSON array. Use JSON_ARRAYAGG(p.name). Display category_id and products_json.',",
);
add(
  "hint: 'JSON_ARRAYAGG(expr) создаёт JSON массив из значений группы. JSON_OBJECTAGG(key, value) — JSON объект.',",
  "hint: 'JSON_ARRAYAGG(expr) creates a JSON array from group values. JSON_OBJECTAGG(key, value) — JSON object.',",
);

// mysql-14
add("title: 'MySQL: WINDOW функции с WINDOW clause',", "title: 'MySQL: WINDOW functions with WINDOW clause',");
add("description: 'Именованные окна для переиспользования',", "description: 'Named windows for reuse',");
add(
  "taskText:\n      'Выведите заказы с рангом по сумме (total_amount) внутри каждого города доставки и нарастающей суммой. Используйте WINDOW w AS (PARTITION BY shipping_city ORDER BY order_date) для переиспользования определения окна.',",
  "taskText:\n      'Display orders with rank by amount (total_amount) within each shipping city and a running total. Use WINDOW w AS (PARTITION BY shipping_city ORDER BY order_date) to reuse the window definition.',",
);
add(
  "hint: 'MySQL позволяет определить окно один раз: WINDOW name AS (...), затем использовать: ROW_NUMBER() OVER w, SUM() OVER w.',",
  "hint: 'MySQL allows defining a window once: WINDOW name AS (...), then using: ROW_NUMBER() OVER w, SUM() OVER w.',",
);

// mysql-15
add("title: 'MySQL: CAST и CONVERT',", "title: 'MySQL: CAST and CONVERT',");
add("description: 'Преобразование типов данных',", "description: 'Data type conversion',");
add(
  "taskText:\n      'Выведите товары: name, price и price_as_char — цену, преобразованную в CHAR с помощью CAST(price AS CHAR). Также выведите price_dec = CAST(price AS DECIMAL(10,2)).',",
  "taskText:\n      'Display products: name, price and price_as_char — price converted to CHAR using CAST(price AS CHAR). Also display price_dec = CAST(price AS DECIMAL(10,2)).',",
);
add(
  "hint: 'MySQL: CAST(expr AS type) и CONVERT(expr, type) преобразуют типы данных.',",
  "hint: 'MySQL: CAST(expr AS type) and CONVERT(expr, type) convert data types.',",
);

// mysql-16
add("title: 'MySQL: REGEXP_LIKE',", "title: 'MySQL: REGEXP_LIKE',");
add("description: 'Поиск по регулярным выражениям',", "description: 'Search with regular expressions',");
add(
  'taskText:\n      \'Найдите товары, название которых начинается на гласную букву (A, E, I, O, U, А, Е, Ё, И, О, У, Ы, Э, Ю, Я). Используйте REGEXP_LIKE(name, "^[AEIOUАЕЁИОУЫЭЮЯaeiouаеёиоуыэюя]").\',',
  'taskText:\n      \'Find products whose name starts with a vowel (A, E, I, O, U). Use REGEXP_LIKE(name, "^[AEIOUaeiou]").\',',
);
add(
  "hint: 'MySQL REGEXP_LIKE(string, pattern) проверяет соответствие регулярному выражению. ^ — начало строки, [...] — набор символов.',",
  "hint: 'MySQL REGEXP_LIKE(string, pattern) checks matching a regular expression. ^ — start of string, [...] — character set.',",
);

// mysql-17
add("title: 'MySQL: WITH ROLLUP',", "title: 'MySQL: WITH ROLLUP',");
add("description: 'Добавление итоговых строк при группировке',", "description: 'Adding summary rows with grouping',");
add(
  "taskText:\n      'Выведите количество заказов и общую сумму по каждому городу доставки, добавив строку итого (WITH ROLLUP). Для итоговой строки shipping_city будет NULL.',",
  "taskText:\n      'Display order count and total amount by shipping city, adding a grand total row (WITH ROLLUP). The total row will have NULL for shipping_city.',",
);
add(
  "hint: 'GROUP BY col WITH ROLLUP добавляет дополнительную строку с агрегатами по всей таблице.',",
  "hint: 'GROUP BY col WITH ROLLUP adds an extra row with aggregates across the entire table.',",
);

// mysql-18
add("title: 'MySQL: COALESCE в UPDATE',", "title: 'MySQL: COALESCE in UPDATE',");
add("description: 'Обновление с обработкой NULL',", "description: 'Update with NULL handling',");
add(
  'taskText:\n      \'Обновите все заказы без статуса (NULL): установите status = "Не указан". Используйте WHERE status IS NULL.\',',
  'taskText:\n      \'Update all orders without a status (NULL): set status = "Not specified". Use WHERE status IS NULL.\',',
);
add(
  "hint: 'WHERE status IS NULL находит строки с NULL значением.',",
  "hint: 'WHERE status IS NULL finds rows with NULL value.',",
);

// ==================== MONGODB TRANSLATIONS ====================

// mongo-1
add("title: 'Базовый find — все документы',", "title: 'Basic find — all documents',");
add("description: 'Получить все документы из коллекции',", "description: 'Get all documents from collection',");
add(
  "taskText: 'Получите всех пользователей из коллекции users. Используйте db.users.find({}).',",
  "taskText: 'Get all users from the users collection. Use db.users.find({}).',",
);
add(
  "hint: 'db.users.find({}) вернёт все документы из коллекции.',",
  "hint: 'db.users.find({}) returns all documents from the collection.',",
);

// mongo-2
add("title: 'find с фильтром',", "title: 'find with filter',");
add("description: 'Фильтрация документов по условию',", "description: 'Filter documents by condition',");
add(
  'taskText: \'Найдите всех разработчиков (role: "developer") из Москвы. Выведите имя и email.\',',
  'taskText: \'Find all developers (role: "developer") from Moscow. Display name and email.\',',
);
add(
  'hint: \'Используйте { role: "developer", city: "Москва" } как фильтр и projection для выбора полей.\',',
  'hint: \'Use { role: "developer", city: "Moscow" } as filter and projection to select fields.\',',
);

// mongo-3
add("title: 'find с операторами сравнения',", "title: 'find with comparison operators',");
add("description: 'Использование $gt, $lt, $gte, $lte',", "description: 'Using $gt, $lt, $gte, $lte',");
add(
  "taskText: 'Найдите пользователей старше 30 лет с зарплатой выше 140000.',",
  "taskText: 'Find users older than 30 with salary above 140000.',",
);
add(
  "hint: 'Используйте { age: { $gt: 30 }, salary: { $gt: 140000 } }.',",
  "hint: 'Use { age: { $gt: 30 }, salary: { $gt: 140000 } }.',",
);

// mongo-4
add("title: 'find с $in',", "title: 'find with $in',");
add("description: 'Поиск по нескольким значениям',", "description: 'Search by multiple values',");
add(
  "taskText: 'Найдите пользователей из Москвы или Санкт-Петербурга.',",
  "taskText: 'Find users from Moscow or Saint Petersburg.',",
);
add(
  'hint: \'Используйте { city: { $in: ["Москва", "Санкт-Петербург"] } }.\',',
  'hint: \'Use { city: { $in: ["Moscow", "Saint Petersburg"] } }.\',',
);

// mongo-5
add("title: 'find с $regex',", "title: 'find with $regex',");
add("description: 'Поиск по регулярному выражению',", "description: 'Search with regular expression',");
add(
  'taskText: \'Найдите пользователей у которых фамилия содержит "ов" или "ев".\',',
  'taskText: \'Find users whose last name contains "ov" or "ev".\',',
);
add('hint: \'Используйте { name: { $regex: "(ов|ев)$" } }.\',', 'hint: \'Use { name: { $regex: "(ov|ev)$" } }.\',');

// mongo-6
add("title: 'find с sort и limit',", "title: 'find with sort and limit',");
add("description: 'Сортировка и ограничение результатов',", "description: 'Sorting and limiting results',");
add(
  "taskText: 'Получите топ-3 пользователей по зарплате (по убыванию). Выведите имя и зарплату.',",
  "taskText: 'Get the top 3 users by salary (descending). Display name and salary.',",
);
add("hint: 'Используйте sort: { salary: -1 } и limit: 3.',", "hint: 'Use sort: { salary: -1 } and limit: 3.',");

// mongo-7
add("title: 'find с массивами — $in для массива',", "title: 'find with arrays — array search',");
add("description: 'Поиск документов по значению в массиве',", "description: 'Search documents by array value',");
add(
  'taskText: \'Найдите всех пользователей у которых в навыках есть "JavaScript".\',',
  'taskText: \'Find all users who have "JavaScript" in their skills.\',',
);
add(
  'hint: \'MongoDB автоматически ищет в массивах: { skills: "JavaScript" }.\',',
  'hint: \'MongoDB automatically searches arrays: { skills: "JavaScript" }.\',',
);

// mongo-8
add("title: 'find с $exists',", "title: 'find with $exists',");
add("description: 'Проверка наличия поля',", "description: 'Check field existence',");
add(
  'taskText: \'Найдите все заказы со статусом "delivered" (существующие и доставленные).\',',
  'taskText: \'Find all orders with status "delivered".\',',
);
add(
  'hint: \'Используйте { status: "delivered" } — если поле существует, документ вернётся.\',',
  'hint: \'Use { status: "delivered" } — if the field exists, the document will be returned.\',',
);

// mongo-9
add("title: 'aggregate — $match + $group',", "title: 'aggregate — $match + $group',");
add("description: 'Группировка с предварительной фильтрацией',", "description: 'Grouping with pre-filtering',");
add(
  'taskText:\n      \'Подсчитайте количество пользователей в каждом городе. Используйте aggregate с $match (role: "developer") и $group.\',',
  'taskText:\n      \'Count the number of users in each city. Use aggregate with $match (role: "developer") and $group.\',',
);
add(
  'hint: \'Pipeline: [{ $match: { role: "developer" } }, { $group: { _id: "$city", count: { $sum: 1 } } }].\',',
  'hint: \'Pipeline: [{ $match: { role: "developer" } }, { $group: { _id: "$city", count: { $sum: 1 } } }].\',',
);

// mongo-10
add("title: 'aggregate — $group с $avg',", "title: 'aggregate — $group with $avg',");
add("description: 'Среднее значение в группировке',", "description: 'Average value in grouping',");
add(
  "taskText: 'Вычислите среднюю зарплату по каждой роли (role). Выведите роль и среднюю зарплату.',",
  "taskText: 'Calculate the average salary by each role. Display role and average salary.',",
);
add(
  'hint: \'Используйте { $group: { _id: "$role", avgSalary: { $avg: "$salary" } } }.\',',
  'hint: \'Use { $group: { _id: "$role", avgSalary: { $avg: "$salary" } } }.\',',
);

// mongo-11
add("title: 'aggregate — $group с $sum',", "title: 'aggregate — $group with $sum',");
add("description: 'Сумма в группировке',", "description: 'Sum in grouping',");
add(
  "taskText: 'Подсчитайте общую сумму заказов (total) по каждому статусу. Выведите статус и сумму.',",
  "taskText: 'Calculate the total order amount by each status. Display status and total amount.',",
);
add(
  'hint: \'Используйте { $group: { _id: "$status", totalAmount: { $sum: "$total" } } }.\',',
  'hint: \'Use { $group: { _id: "$status", totalAmount: { $sum: "$total" } } }.\',',
);

// mongo-12
add("title: 'aggregate — $sort после $group',", "title: 'aggregate — $sort after $group',");
add("description: 'Сортировка результатов агрегации',", "description: 'Sorting aggregation results',");
add(
  "taskText: 'Найдите среднюю зарплату по городам и отсортируйте по убыванию.',",
  "taskText: 'Find the average salary by city and sort descending.',",
);
add(
  'hint: \'Pipeline: [{ $group: { _id: "$city", avgSalary: { $avg: "$salary" } } }, { $sort: { avgSalary: -1 } }].\',',
  'hint: \'Pipeline: [{ $group: { _id: "$city", avgSalary: { $avg: "$salary" } } }, { $sort: { avgSalary: -1 } }].\',',
);

// mongo-13
add("title: 'aggregate — $match + $group + $sort',", "title: 'aggregate — $match + $group + $sort',");
add("description: 'Комбинированная агрегация',", "description: 'Combined aggregation',");
add(
  'taskText:\n      \'Найдите товары в категории "electronics", сгруппируйте по категории и посчитайте общую стоимость всех товаров (price * stock). Отсортируйте по убыванию.\',',
  'taskText:\n      \'Find products in category "electronics", group by category and calculate total value (price * stock). Sort descending.\',',
);
add(
  "hint: 'Нужно сначала $match, затем $group с $sum для вычисления totalValue.',",
  "hint: 'First $match, then $group with $sum to calculate totalValue.',",
);

// mongo-14
add("title: 'aggregate — $unwind',", "title: 'aggregate — $unwind',");
add("description: 'Разворачивание массива',", "description: 'Unwinding arrays',");
add(
  "taskText:\n      'Разверните массив skills у пользователей. Каждый навык должен быть в отдельном документе с именем пользователя.',",
  "taskText:\n      'Unwind the skills array for users. Each skill should be in a separate document with the user name.',",
);
add(
  'hint: \'Используйте { $unwind: "$skills" }, затем $project для вывода имени и навыка.\',',
  'hint: \'Use { $unwind: "$skills" }, then $project to display name and skill.\',',
);

// mongo-15
add("title: 'aggregate — $lookup (join)',", "title: 'aggregate — $lookup (join)',");
add("description: 'Соединение коллекций',", "description: 'Joining collections',");
add(
  "taskText:\n      'Соедините заказы с пользователями через $lookup. Для каждого заказа покажите userId, total и имя пользователя.',",
  "taskText:\n      'Join orders with users using $lookup. For each order show userId, total and user name.',",
);
add(
  'hint: \'Используйте { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } }.\',',
  'hint: \'Use { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } }.\',',
);

// mongo-16
add("title: 'aggregate — $project с вычисляемыми полями',", "title: 'aggregate — $project with computed fields',");
add("description: 'Создание новых полей',", "description: 'Creating new fields',");
add(
  "taskText: 'Для каждого товара выведите название, цену и поле inStock (true если stock > 20).',",
  "taskText: 'For each product display name, price and inStock field (true if stock > 20).',",
);
add(
  'hint: \'Используйте { $project: { name: 1, price: 1, inStock: { $gt: ["$stock", 20] } } }.\',',
  'hint: \'Use { $project: { name: 1, price: 1, inStock: { $gt: ["$stock", 20] } } }.\',',
);

// mongo-17
add("title: 'find с $or',", "title: 'find with $or',");
add("description: 'Логическое ИЛИ в запросе',", "description: 'Logical OR in query',");
add(
  "taskText: 'Найдите пользователей которые живут в Москве ИЛИ имеют зарплату выше 160000.',",
  "taskText: 'Find users who live in Moscow OR have a salary above 160000.',",
);
add(
  'hint: \'Используйте { $or: [{ city: "Москва" }, { salary: { $gt: 160000 } }] }.\',',
  'hint: \'Use { $or: [{ city: "Moscow" }, { salary: { $gt: 160000 } }] }.\',',
);

// mongo-18
add("title: 'aggregate — $count',", "title: 'aggregate — $count',");
add("description: 'Подсчёт документов',", "description: 'Counting documents',");
add(
  'taskText: \'Подсчитайте количество доставленных заказов (status: "delivered").\',',
  'taskText: \'Count the number of delivered orders (status: "delivered").\',',
);
add(
  'hint: \'Pipeline: [{ $match: { status: "delivered" } }, { $count: "deliveredCount" }].\',',
  'hint: \'Pipeline: [{ $match: { status: "delivered" } }, { $count: "deliveredCount" }].\',',
);

function applyAll(content) {
  // Normalize line endings to LF for consistent matching
  let result = content.replace(/\r\n/g, '\n');
  for (const [ru, en] of replacements) {
    let pos = result.indexOf(ru);
    while (pos !== -1) {
      result = result.slice(0, pos) + en + result.slice(pos + ru.length);
      pos = result.indexOf(ru, pos + en.length);
    }
  }
  // Restore CRLF line endings
  result = result.replace(/\n/g, '\r\n');
  return result;
}

for (const file of ['src/lib/tasks/mysql.ts', 'src/lib/tasks/mongodb.ts']) {
  const fp = path.resolve(root, file);
  let content = fs.readFileSync(fp, 'utf-8');
  const before = (content.match(/[А-яЁё]/g) || []).length;
  content = applyAll(content);
  fs.writeFileSync(fp, content, 'utf-8');
  const after = (content.match(/[А-яЁё]/g) || []).length;
  console.log(file + ': ' + before + ' -> ' + after + ' Cyrillic chars');
}

console.log('\nDone!');
