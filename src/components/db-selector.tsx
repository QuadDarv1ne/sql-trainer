'use client';

import { Button } from '@/components/ui/button';
import {
  Database,
} from 'lucide-react';
import type { DbType } from '@/lib/training-tasks';

interface DbSelectorProps {
  dbType: DbType;
  onChange: (type: DbType) => void;
}

const DB_OPTIONS: { value: DbType; label: string; description: string }[] = [
  {
    value: 'sqlite',
    label: 'SQLite',
    description: 'Встроенная база данных',
  },
  {
    value: 'postgresql',
    label: 'PostgreSQL',
    description: 'Синтаксис PostgreSQL',
  },
  {
    value: 'clickhouse',
    label: 'ClickHouse',
    description: 'Синтаксис ClickHouse',
  },
];

export default function DbSelector({ dbType, onChange }: DbSelectorProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
      {DB_OPTIONS.map((option) => (
        <Button
          key={option.value}
          variant={dbType === option.value ? 'default' : 'ghost'}
          size="sm"
          className={`h-7 gap-1.5 text-xs px-3 ${
            dbType === option.value
              ? 'bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
