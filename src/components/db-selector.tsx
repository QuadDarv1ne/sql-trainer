'use client';

import { Button } from '@/components/ui/button';
import {
  Database,
} from 'lucide-react';
import type { DbType } from '@/lib/training-tasks';
import { t } from '@/lib/i18n';

interface DbSelectorProps {
  dbType: DbType;
  onChange: (type: DbType) => void;
}

const DB_OPTIONS: { value: DbType; label: string; description: string }[] = [
  {
    value: 'sqlite',
    label: 'SQLite',
    description: t('db.sqlite'),
  },
  {
    value: 'postgresql',
    label: 'PostgreSQL',
    description: t('db.postgresql'),
  },
  {
    value: 'clickhouse',
    label: 'ClickHouse',
    description: t('db.clickhouse'),
  },
  {
    value: 'mongodb',
    label: 'MongoDB',
    description: t('db.mongodb'),
  },
];

export default function DbSelector({ dbType, onChange }: DbSelectorProps) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg bg-muted p-1">
      {DB_OPTIONS.map((option) => (
        <Button
          key={option.value}
          variant={dbType === option.value ? 'default' : 'ghost'}
          size="sm"
          className={`h-8 gap-1.5 text-xs px-3 ${
            dbType === option.value
              ? 'bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => onChange(option.value)}
        >
          <Database className="h-3.5 w-3.5" />
          {option.label}
        </Button>
      ))}
    </div>
  );
}
