'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Code2, Filter, Merge, FunctionSquare } from 'lucide-react';

interface SqlTemplatesProps {
  onInsertTemplate: (sql: string) => void;
}

const TEMPLATES = [
  {
    label: 'Простой SELECT',
    icon: Filter,
    sql: `SELECT name, email, age
FROM users
WHERE age > 25
ORDER BY name
LIMIT 10;`,
  },
  {
    label: 'Агрегация',
    icon: Code2,
    sql: `SELECT
  department,
  COUNT(*) as employee_count,
  AVG(salary) as avg_salary,
  MAX(salary) as max_salary,
  MIN(salary) as min_salary
FROM employees
GROUP BY department
HAVING COUNT(*) > 5
ORDER BY avg_salary DESC;`,
  },
  {
    label: 'JOIN',
    icon: Merge,
    sql: `SELECT
  e.name,
  d.department_name,
  p.project_name,
  r.role
FROM employees e
INNER JOIN departments d ON e.department_id = d.id
LEFT JOIN assignments a ON e.id = a.employee_id
LEFT JOIN projects p ON a.project_id = p.id
WHERE e.is_active = 1
ORDER BY d.department_name, e.name;`,
  },
  {
    label: 'Оконные функции',
    icon: FunctionSquare,
    sql: `SELECT
  name,
  department,
  salary,
  ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) as dept_rank,
  SUM(salary) OVER (PARTITION BY department) as dept_total,
  salary - AVG(salary) OVER (PARTITION BY department) as diff_from_avg
FROM employees
ORDER BY department, dept_rank;`,
  },
];

export default function SqlTemplates({ onInsertTemplate }: SqlTemplatesProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 text-xs">
          <Code2 className="mr-1 h-3 w-3" />
          Шаблоны
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Шаблоны SQL</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {TEMPLATES.map((template) => {
          const Icon = template.icon;
          return (
            <DropdownMenuItem
              key={template.label}
              className="cursor-pointer"
              onClick={() => onInsertTemplate(template.sql)}
            >
              <Icon className="mr-2 h-3.5 w-3.5 text-emerald-500" />
              <span className="text-xs">{template.label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
