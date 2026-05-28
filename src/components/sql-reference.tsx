'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { BookOpen, Code2, Filter, Table, FunctionSquare, Merge, Layers, BarChart3, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { t } from '@/lib/i18n';

interface SQLReferenceProps {
  onInsertExample?: (sql: string) => void;
}

function getSections() {
  return [
    {
      id: 'select',
      title: t('sqlRef.select'),
      icon: Table,
      items: [
        { code: 'SELECT * FROM table', desc: t('sqlRef.select.all') },
        { code: 'SELECT col1, col2 FROM table', desc: t('sqlRef.select.cols') },
        { code: 'SELECT col AS alias FROM table', desc: t('sqlRef.select.alias') },
        { code: 'SELECT DISTINCT col FROM table', desc: t('sqlRef.select.distinct') },
      ],
    },
    {
      id: 'where',
      title: t('sqlRef.where'),
      icon: Filter,
      items: [
        { code: "WHERE col = 'value'", desc: t('sqlRef.where.eq') },
        { code: 'WHERE col > 100', desc: t('sqlRef.where.gt') },
        { code: 'WHERE col BETWEEN 10 AND 50', desc: t('sqlRef.where.between') },
        { code: "WHERE col IN ('a', 'b', 'c')", desc: t('sqlRef.where.in') },
        { code: "WHERE col LIKE 'A%'", desc: t('sqlRef.where.like') },
        { code: 'WHERE col IS NULL', desc: t('sqlRef.where.null') },
        { code: 'WHERE col IS NOT NULL', desc: t('sqlRef.where.notNull') },
        { code: 'WHERE cond1 AND cond2', desc: t('sqlRef.where.and') },
        { code: 'WHERE cond1 OR cond2', desc: t('sqlRef.where.or') },
        { code: 'WHERE NOT cond', desc: t('sqlRef.where.not') },
      ],
    },
    {
      id: 'order',
      title: t('sqlRef.order'),
      icon: BarChart3,
      items: [
        { code: 'ORDER BY col ASC', desc: t('sqlRef.order.asc') },
        { code: 'ORDER BY col DESC', desc: t('sqlRef.order.desc') },
        { code: 'ORDER BY col1, col2', desc: t('sqlRef.order.multi') },
        { code: 'LIMIT 10', desc: t('sqlRef.order.limit') },
        { code: 'LIMIT 10 OFFSET 20', desc: t('sqlRef.order.offset') },
      ],
    },
    {
      id: 'aggregate',
      title: t('sqlRef.aggregate'),
      icon: FunctionSquare,
      items: [
        { code: 'COUNT(*)', desc: t('sqlRef.aggregate.count') },
        { code: 'COUNT(col)', desc: t('sqlRef.aggregate.countNonNull') },
        { code: 'SUM(col)', desc: t('sqlRef.aggregate.sum') },
        { code: 'AVG(col)', desc: t('sqlRef.aggregate.avg') },
        { code: 'MIN(col)', desc: t('sqlRef.aggregate.min') },
        { code: 'MAX(col)', desc: t('sqlRef.aggregate.max') },
        { code: 'GROUP BY col', desc: t('sqlRef.aggregate.groupBy') },
        { code: 'HAVING COUNT(*) > 5', desc: t('sqlRef.aggregate.having') },
      ],
    },
    {
      id: 'join',
      title: t('sqlRef.join'),
      icon: Merge,
      items: [
        { code: 'INNER JOIN', desc: t('sqlRef.join.inner') },
        { code: 'LEFT JOIN', desc: t('sqlRef.join.left') },
        { code: 'RIGHT JOIN', desc: t('sqlRef.join.right') },
        { code: 'CROSS JOIN', desc: t('sqlRef.join.cross') },
        { code: 'ON t1.id = t2.id', desc: t('sqlRef.join.on') },
      ],
    },
    {
      id: 'subquery',
      title: t('sqlRef.subquery'),
      icon: Layers,
      items: [
        { code: 'SELECT * FROM (SELECT ...)', desc: t('sqlRef.subquery.from') },
        { code: 'WHERE col IN (SELECT ...)', desc: t('sqlRef.subquery.where') },
        { code: 'WITH cte AS (SELECT ...)', desc: t('sqlRef.subquery.cte') },
        { code: 'WITH RECURSIVE cte AS (...)', desc: t('sqlRef.subquery.recursive') },
      ],
    },
    {
      id: 'functions',
      title: t('sqlRef.functions'),
      icon: Code2,
      items: [
        { code: 'UPPER(str) / LOWER(str)', desc: t('sqlRef.functions.case') },
        { code: "LENGTH(str) / SUBSTR(str, 1, 3)", desc: t('sqlRef.functions.length') },
        { code: "REPLACE(str, 'a', 'b')", desc: t('sqlRef.functions.replace') },
        { code: "col1 || col2", desc: t('sqlRef.functions.concat') },
        { code: "ROUND(col, 2)", desc: t('sqlRef.functions.round') },
        { code: "COALESCE(col, 'default')", desc: t('sqlRef.functions.coalesce') },
        { code: "NULLIF(col1, col2)", desc: t('sqlRef.functions.nullif') },
        { code: "CASE WHEN cond THEN a ELSE b END", desc: t('sqlRef.functions.caseExpr') },
        { code: "date('now')", desc: t('sqlRef.functions.date') },
      ],
    },
    {
      id: 'window',
      title: t('sqlRef.window'),
      icon: BarChart3,
      items: [
        { code: 'ROW_NUMBER() OVER (...)', desc: t('sqlRef.window.rowNumber') },
        { code: 'RANK() OVER (...)', desc: t('sqlRef.window.rank') },
        { code: 'DENSE_RANK() OVER (...)', desc: t('sqlRef.window.denseRank') },
        { code: 'SUM(col) OVER (PARTITION BY p)', desc: t('sqlRef.window.sum') },
        { code: 'LEAD(col) OVER (...)', desc: t('sqlRef.window.lead') },
        { code: 'LAG(col) OVER (...)', desc: t('sqlRef.window.lag') },
      ],
    },
  ];
}

export default function SQLReference({ onInsertExample }: SQLReferenceProps) {
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sections = getSections();

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const resetCopiedState = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopy = (code: string, index: string) => {
    navigator.clipboard.writeText(code).then(() => {
      toast.success(t('sqlRef.copied'));
      setCopiedIndex(index);
      resetCopiedState();
    });
  };

  const handleInsert = (code: string, key: string) => {
    if (onInsertExample) {
      onInsertExample(code);
      setCopiedIndex(key);
      resetCopiedState();
    } else {
      handleCopy(code, key);
    }
  };
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-4 py-3">
        <h3 className="flex items-center gap-1.5 text-sm font-medium">
          <BookOpen className="h-4 w-4 text-emerald-500" />
          {t('sqlRef.title')}
        </h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3">
          <Accordion type="multiple" defaultValue={['select', 'where']} className="w-full">
            {sections.map((section) => (
              <AccordionItem key={section.id} value={section.id}>
                <AccordionTrigger className="py-2 text-xs font-medium hover:no-underline">
                  <div className="flex items-center gap-1.5">
                    <section.icon className="h-3.5 w-3.5 text-emerald-500" />
                    {section.title}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-1.5 pt-1">
                    {section.items.map((item) => {
                      const itemKey = `${section.id}-${item.code}`;
                      const isCopied = copiedIndex === itemKey;
                      return (
                        <div
                          key={itemKey}
                          className="group rounded-md bg-muted/50 px-2.5 py-1.5 transition-colors hover:bg-muted/80"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <code className="flex-1 text-xs font-mono text-emerald-700 dark:text-emerald-400">
                              {item.code}
                            </code>
                            <button
                              onClick={() => handleInsert(item.code, itemKey)}
                              className="shrink-0 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-background"
                              title={t('sqlRef.insert')}
                            >
                              {isCopied ? (
                                <Check className="h-3 w-3 text-emerald-500" />
                              ) : (
                                <Copy className="h-3 w-3 text-muted-foreground" />
                              )}
                            </button>
                          </div>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {item.desc}
                          </p>
                        </div>
                      );
                    })}
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
