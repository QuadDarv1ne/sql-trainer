'use client';

import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { BookOpen, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { t } from '@/lib/i18n';

interface GlossaryEntry {
  term: string;
  definition: string;
  example?: string;
  category: 'basic' | 'intermediate' | 'advanced';
}

const GLOSSARY_ENTRIES: GlossaryEntry[] = [
  // Basic
  {
    term: 'SELECT',
    definition: 'Команда для извлечения данных из таблицы. Указывает, какие столбцы вернуть.',
    example: 'SELECT name, salary FROM employees',
    category: 'basic',
  },
  {
    term: 'FROM',
    definition: 'Указывает таблицу, из которой извлекать данные.',
    example: 'SELECT * FROM employees',
    category: 'basic',
  },
  {
    term: 'WHERE',
    definition: 'Фильтрует строки до вывода результата. Включает только те строки, где условие истинно.',
    example: 'SELECT * FROM employees WHERE salary > 100000',
    category: 'basic',
  },
  {
    term: 'ORDER BY',
    definition: 'Сортирует результаты по одному или нескольким столбцам. ASC — по возрастанию, DESC — по убыванию.',
    example: 'SELECT * FROM employees ORDER BY salary DESC',
    category: 'basic',
  },
  {
    term: 'LIMIT / OFFSET',
    definition: 'LIMIT ограничивает количество возвращаемых строк. OFFSET пропускает первые N строк. Используются для пагинации.',
    example: 'SELECT * FROM employees ORDER BY salary DESC LIMIT 10 OFFSET 20',
    category: 'basic',
  },
  {
    term: 'DISTINCT',
    definition: 'Возвращает только уникальные значения, убирая дубликаты.',
    example: 'SELECT DISTINCT department_id FROM employees',
    category: 'basic',
  },
  {
    term: 'NULL',
    definition: 'Специальное значение, означающее «отсутствие данных». Не равно ни 0, ни пустой строке.',
    example: 'SELECT * FROM employees WHERE email IS NULL',
    category: 'basic',
  },
  {
    term: 'Алиас (AS)',
    definition: 'Временное имя для столбца или таблицы. Делает запрос читабельнее.',
    example: 'SELECT first_name AS name, salary AS pay FROM employees e',
    category: 'basic',
  },

  // Intermediate
  {
    term: 'JOIN',
    definition: 'Объединяет строки из двух таблиц по совпадению ключей. Типы: INNER, LEFT, RIGHT, FULL, CROSS.',
    example: 'SELECT e.name, d.name FROM employees e JOIN departments d ON e.dept_id = d.id',
    category: 'intermediate',
  },
  {
    term: 'INNER JOIN',
    definition: 'Возвращает только строки, где есть совпадение в обеих таблицах.',
    example: 'SELECT e.name, d.name FROM employees e INNER JOIN departments d ON e.dept_id = d.id',
    category: 'intermediate',
  },
  {
    term: 'LEFT JOIN',
    definition: 'Возвращает ВСЕ строки левой таблицы. Если нет совпадения — правые столбцы будут NULL.',
    example: 'SELECT d.name, e.name FROM departments d LEFT JOIN employees e ON d.id = e.dept_id',
    category: 'intermediate',
  },
  {
    term: 'GROUP BY',
    definition: 'Группирует строки с одинаковыми значениями. Агрегатные функции (COUNT, SUM, AVG) вычисляют результат внутри каждой группы.',
    example: 'SELECT department_id, AVG(salary) FROM employees GROUP BY department_id',
    category: 'intermediate',
  },
  {
    term: 'HAVING',
    definition: 'Фильтрует группы ПОСЛЕ GROUP BY. Аналог WHERE, но для агрегатных результатов.',
    example: 'SELECT dept_id, AVG(salary) FROM employees GROUP BY dept_id HAVING AVG(salary) > 100000',
    category: 'intermediate',
  },
  {
    term: 'Подзапрос (Subquery)',
    definition: 'Запрос внутри другого запроса. Скалярный подзапрос возвращает одно значение, табличный — таблицу.',
    example: 'SELECT * FROM employees WHERE salary > (SELECT AVG(salary) FROM employees)',
    category: 'intermediate',
  },
  {
    term: 'CASE WHEN',
    definition: 'Условное выражение, аналог if/else. Возвращает разные значения в зависимости от условий.',
    example: "SELECT name, CASE WHEN salary > 100000 THEN 'Высокая' ELSE 'Обычная' END FROM employees",
    category: 'intermediate',
  },
  {
    term: 'COALESCE',
    definition: 'Возвращает первый не-NULL аргумент. Используется для замены NULL на значения по умолчанию.',
    example: "SELECT COALESCE(email, 'нет email') FROM employees",
    category: 'intermediate',
  },
  {
    term: 'UNION',
    definition: 'Объединяет результаты двух запросов в один, убирая дубликаты. UNION ALL сохраняет дубликаты.',
    example: 'SELECT name FROM employees UNION SELECT name FROM departments',
    category: 'intermediate',
  },
  {
    term: 'EXISTS',
    definition: 'Проверяет, возвращает ли подзапрос хотя бы одну строку. Возвращает TRUE или FALSE.',
    example: 'SELECT * FROM departments d WHERE EXISTS (SELECT 1 FROM employees e WHERE e.dept_id = d.id)',
    category: 'intermediate',
  },

  // Advanced
  {
    term: 'CTE (WITH)',
    definition: 'Обобщённое табличное выражение — именованный подзапрос. Делает сложные запросы читаемее, можно использовать несколько раз.',
    example: 'WITH dept_stats AS (SELECT dept_id, AVG(salary) avg_sal FROM employees GROUP BY dept_id) SELECT * FROM dept_stats',
    category: 'advanced',
  },
  {
    term: 'Рекурсивный CTE',
    definition: 'CTE, который ссылается на сам себя. Используется для иерархических данных (оргструктура, категории).',
    example: 'WITH RECURSIVE tree AS (SELECT * FROM cats WHERE parent_id IS NULL UNION ALL SELECT c.* FROM cats c JOIN tree t ON c.parent_id = t.id) SELECT * FROM tree',
    category: 'advanced',
  },
  {
    term: 'Оконные функции',
    definition: 'Вычисляют значение для каждой строки, не «схлопывая» группы. PARTITION BY делит на группы, ORDER BY — порядок внутри.',
    example: 'SELECT name, salary, ROW_NUMBER() OVER (PARTITION BY dept_id ORDER BY salary DESC) FROM employees',
    category: 'advanced',
  },
  {
    term: 'ROW_NUMBER()',
    definition: 'Присваивает уникальный номер 1, 2, 3... каждой строке внутри партиции.',
    example: 'SELECT name, ROW_NUMBER() OVER (ORDER BY salary DESC) as rank FROM employees',
    category: 'advanced',
  },
  {
    term: 'RANK() / DENSE_RANK()',
    definition: 'RANK — ранг с пропусками (1, 1, 3), DENSE_RANK — без пропусков (1, 1, 2).',
    example: 'SELECT name, RANK() OVER (ORDER BY salary DESC) FROM employees',
    category: 'advanced',
  },
  {
    term: 'LAG() / LEAD()',
    definition: 'LAG — значение предыдущей строки, LEAD — следующей. Используются для сравнения с соседними строками.',
    example: 'SELECT name, salary, LAG(salary) OVER (ORDER BY salary) as prev_salary FROM employees',
    category: 'advanced',
  },
  {
    term: 'LATERAL JOIN',
    definition: 'Подзапрос в FROM, который может ссылаться на столбцы предыдущих таблиц. PostgreSQL специфика.',
    example: 'SELECT d.name, top.name FROM departments d CROSS JOIN LATERAL (SELECT name FROM employees e WHERE e.dept_id = d.id ORDER BY salary DESC LIMIT 1) top',
    category: 'advanced',
  },
  {
    term: 'Транзакция',
    definition: 'Набор операций, выполняемых как единое целое.BEGIN начинает, COMMIT фиксирует, ROLLBACK отменяет.',
    example: 'BEGIN; UPDATE accounts SET balance = balance - 100 WHERE id = 1; UPDATE accounts SET balance = balance + 100 WHERE id = 2; COMMIT;',
    category: 'advanced',
  },
  {
    term: 'Индекс',
    definition: 'Структура данных для ускорения поиска. CREATE INDEX создаёт индекс по столбцу. Ускоряет SELECT, замедляет INSERT/UPDATE.',
    example: 'CREATE INDEX idx_employees_dept ON employees(department_id)',
    category: 'advanced',
  },
  {
    term: 'Представление (VIEW)',
    definition: 'Сохранённый запрос, который можно использовать как таблицу. Упрощает сложные запросы.',
    example: 'CREATE VIEW active_employees AS SELECT * FROM employees WHERE is_active = 1',
    category: 'advanced',
  },
  {
    term: 'EXPLAIN',
    definition: 'Показывает план выполнения запроса. Помогает понять, как СУБД обрабатывает запрос и где оптимизировать.',
    example: 'EXPLAIN SELECT * FROM employees WHERE department_id = 1',
    category: 'advanced',
  },
];

function getCategories() {
  return [
    { id: 'basic', title: t('glossary.basic'), color: 'text-emerald-600 dark:text-emerald-400' },
    { id: 'intermediate', title: t('glossary.intermediate'), color: 'text-amber-600 dark:text-amber-400' },
    { id: 'advanced', title: t('glossary.advanced'), color: 'text-red-600 dark:text-red-400' },
  ];
}

export default function SQLGlossary() {
  const [search, setSearch] = useState('');
  const categories = getCategories();

  const filteredEntries = GLOSSARY_ENTRIES.filter((entry) => {
    const searchLower = search.toLowerCase();
    return (
      entry.term.toLowerCase().includes(searchLower) ||
      entry.definition.toLowerCase().includes(searchLower)
    );
  });

  const grouped = categories.map((cat) => ({
    ...cat,
    entries: filteredEntries.filter((e) => e.category === cat.id),
  }));

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-4 py-3">
        <h3 className="flex items-center gap-1.5 text-sm font-medium">
          <BookOpen className="h-4 w-4 text-emerald-500" />
          {t('glossary.title')}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">{t('glossary.subtitle')}</p>
      </div>

      <div className="border-b border-border px-4 py-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('glossary.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3">
          {grouped.length === 0 && (
            <p className="py-8 text-center text-xs text-muted-foreground">{t('glossary.noResults')}</p>
          )}
          {grouped.map((cat) =>
            cat.entries.length === 0 ? null : (
              <div key={cat.id} className="mb-4">
                <h4 className={`mb-2 text-xs font-semibold ${cat.color}`}>{cat.title}</h4>
                <Accordion type="multiple" className="w-full">
                  {cat.entries.map((entry) => (
                    <AccordionItem key={entry.term} value={entry.term} className="border-muted/50">
                      <AccordionTrigger className="py-1.5 text-xs hover:no-underline">
                        <span className="font-mono font-medium">{entry.term}</span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-xs text-muted-foreground">{entry.definition}</p>
                        {entry.example && (
                          <pre className="mt-2 rounded bg-muted px-2 py-1.5 text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
                            {entry.example}
                          </pre>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
