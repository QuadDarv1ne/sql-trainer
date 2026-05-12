'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { BookOpen, Code2, Filter, Table, FunctionSquare, Merge, Layers, BarChart3 } from 'lucide-react';

const SECTIONS = [
  {
    id: 'select',
    title: 'SELECT и FROM',
    icon: Table,
    items: [
      { code: 'SELECT * FROM table', desc: 'Выбрать все столбцы' },
      { code: 'SELECT col1, col2 FROM table', desc: 'Выбрать конкретные столбцы' },
      { code: 'SELECT col AS alias FROM table', desc: 'Переименовать столбец' },
      { code: 'SELECT DISTINCT col FROM table', desc: 'Уникальные значения' },
    ],
  },
  {
    id: 'where',
    title: 'WHERE (Фильтрация)',
    icon: Filter,
    items: [
      { code: "WHERE col = 'value'", desc: 'Равенство' },
      { code: 'WHERE col > 100', desc: 'Больше чем' },
      { code: 'WHERE col BETWEEN 10 AND 50', desc: 'Диапазон' },
      { code: "WHERE col IN ('a', 'b', 'c')", desc: 'В списке значений' },
      { code: "WHERE col LIKE 'A%'", desc: 'Паттерн поиска (% любой, _ один)' },
      { code: 'WHERE col IS NULL', desc: 'Пустое значение' },
      { code: 'WHERE col IS NOT NULL', desc: 'Не пустое значение' },
      { code: 'WHERE cond1 AND cond2', desc: 'Оба условия' },
      { code: 'WHERE cond1 OR cond2', desc: 'Любое из условий' },
      { code: 'WHERE NOT cond', desc: 'Инверсия условия' },
    ],
  },
  {
    id: 'order',
    title: 'ORDER BY и LIMIT',
    icon: BarChart3,
    items: [
      { code: 'ORDER BY col ASC', desc: 'По возрастанию' },
      { code: 'ORDER BY col DESC', desc: 'По убыванию' },
      { code: 'ORDER BY col1, col2', desc: 'По нескольким столбцам' },
      { code: 'LIMIT 10', desc: 'Ограничить результат' },
      { code: 'LIMIT 10 OFFSET 20', desc: 'Пропустить первые 20' },
    ],
  },
  {
    id: 'aggregate',
    title: 'Агрегатные функции',
    icon: FunctionSquare,
    items: [
      { code: 'COUNT(*)', desc: 'Количество строк' },
      { code: 'COUNT(col)', desc: 'Количество не-NULL значений' },
      { code: 'SUM(col)', desc: 'Сумма' },
      { code: 'AVG(col)', desc: 'Среднее значение' },
      { code: 'MIN(col)', desc: 'Минимум' },
      { code: 'MAX(col)', desc: 'Максимум' },
      { code: 'GROUP BY col', desc: 'Группировка' },
      { code: 'HAVING COUNT(*) > 5', desc: 'Фильтр по группе' },
    ],
  },
  {
    id: 'join',
    title: 'JOIN (Соединение)',
    icon: Merge,
    items: [
      { code: 'INNER JOIN', desc: 'Только совпадающие строки' },
      { code: 'LEFT JOIN', desc: 'Все левые + совпадающие правые' },
      { code: 'RIGHT JOIN', desc: 'Все правые + совпадающие левые' },
      { code: 'CROSS JOIN', desc: 'Декартово произведение' },
      { code: 'ON t1.id = t2.id', desc: 'Условие соединения' },
    ],
  },
  {
    id: 'subquery',
    title: 'Подзапросы и CTE',
    icon: Layers,
    items: [
      { code: 'SELECT * FROM (SELECT ...)', desc: 'Подзапрос в FROM' },
      { code: 'WHERE col IN (SELECT ...)', desc: 'Подзапрос в WHERE' },
      { code: 'WITH cte AS (SELECT ...)', desc: 'CTE — именованный подзапрос' },
      { code: 'WITH RECURSIVE cte AS (...)', desc: 'Рекурсивный CTE' },
    ],
  },
  {
    id: 'functions',
    title: 'Полезные функции',
    icon: Code2,
    items: [
      { code: 'UPPER(str) / LOWER(str)', desc: 'Регистр' },
      { code: "LENGTH(str) / SUBSTR(str, 1, 3)", desc: 'Длина и подстрока' },
      { code: "REPLACE(str, 'a', 'b')", desc: 'Замена' },
      { code: "col1 || col2", desc: 'Конкатенация строк' },
      { code: "ROUND(col, 2)", desc: 'Округление' },
      { code: "COALESCE(col, 'default')", desc: 'Первое не-NULL значение' },
      { code: "NULLIF(col1, col2)", desc: 'NULL если равны' },
      { code: "CASE WHEN cond THEN a ELSE b END", desc: 'Условное выражение' },
      { code: "date('now')", desc: 'Текущая дата (SQLite)' },
    ],
  },
  {
    id: 'window',
    title: 'Оконные функции',
    icon: BarChart3,
    items: [
      { code: 'ROW_NUMBER() OVER (...)', desc: 'Номер строки' },
      { code: 'RANK() OVER (...)', desc: 'Ранг с пропусками' },
      { code: 'DENSE_RANK() OVER (...)', desc: 'Ранг без пропусков' },
      { code: 'SUM(col) OVER (PARTITION BY p)', desc: 'Сумма по группе' },
      { code: 'LEAD(col) OVER (...)', desc: 'Следующее значение' },
      { code: 'LAG(col) OVER (...)', desc: 'Предыдущее значение' },
    ],
  },
];

export default function SQLReference() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-4 py-3">
        <h3 className="flex items-center gap-1.5 text-sm font-medium">
          <BookOpen className="h-4 w-4 text-emerald-500" />
          Справочник SQL
        </h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3">
          <Accordion type="multiple" defaultValue={['select', 'where']} className="w-full">
            {SECTIONS.map((section) => (
              <AccordionItem key={section.id} value={section.id}>
                <AccordionTrigger className="py-2 text-xs font-medium hover:no-underline">
                  <div className="flex items-center gap-1.5">
                    <section.icon className="h-3.5 w-3.5 text-emerald-500" />
                    {section.title}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-1.5 pt-1">
                    {section.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="rounded-md bg-muted/50 px-2.5 py-1.5"
                      >
                        <code className="text-xs font-mono text-emerald-700 dark:text-emerald-400">
                          {item.code}
                        </code>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {item.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </ScrollArea>
    </div>
  );
}
