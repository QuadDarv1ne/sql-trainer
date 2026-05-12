'use client';

import { useEffect, useRef, useCallback } from 'react';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, highlightActiveLine } from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import { sql } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching } from '@codemirror/language';
import { closeBrackets, closeBracketsKeymap, autocompletion, CompletionContext } from '@codemirror/autocomplete';
import { searchKeymap } from '@codemirror/search';

// SQL formatting function - exported for use in page.tsx
export function formatSQL(input: string): string {
  if (!input.trim()) return input;

  let formatted = input.trim();

  // Add newline before major keywords (but not the first SELECT)
  formatted = formatted.replace(
    /(?<!\n)\b(SELECT|FROM|WHERE|AND|OR|ORDER BY|GROUP BY|HAVING|LIMIT|OFFSET|UNION ALL|UNION|INTERSECT|EXCEPT|INNER JOIN|LEFT JOIN|RIGHT JOIN|FULL JOIN|CROSS JOIN|JOIN|ON|SET|VALUES)\b/gi,
    (match) => {
      return '\n' + match;
    }
  );

  // Add extra newline before WITH
  formatted = formatted.replace(/\b(WITH(?: RECURSIVE)?)\b/gi, '\n$1');
  formatted = formatted.replace(/^SELECT\b/gm, '\nSELECT');

  // Remove leading newline
  formatted = formatted.replace(/^\n+/, '');

  // Indent lines after major clauses with paren depth tracking
  const lines = formatted.split('\n');
  const indentKeywords = new Set([
    'select', 'from', 'where', 'and', 'or', 'order by', 'group by',
    'having', 'limit', 'offset', 'union all', 'union', 'intersect',
    'except', 'inner join', 'left join', 'right join', 'full join',
    'cross join', 'join', 'on', 'set', 'values', 'insert into',
    'update', 'delete from', 'returning',
  ]);

  const indentedLines: string[] = [];
  let baseIndent = 0;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;

    // Track parenthesis depth
    for (const ch of trimmed) {
      if (ch === '(') baseIndent += 1;
    }

    const upperFirst = trimmed.replace(/\s+.*/, '').toUpperCase();
    const isClauseStart = indentKeywords.has(upperFirst.toLowerCase());
    const indent = isClauseStart ? baseIndent : baseIndent + 2;

    indentedLines.push(' '.repeat(indent) + trimmed);

    // Decrease indent for closing parens
    for (const ch of trimmed) {
      if (ch === ')') baseIndent = Math.max(0, baseIndent - 1);
    }
  }

  return indentedLines.join('\n');
}

// Schema-aware autocomplete tables
const SCHEMA_TABLES: Record<string, string[]> = {
  departments: ['id', 'name', 'location', 'budget'],
  employees: ['id', 'first_name', 'last_name', 'email', 'department_id', 'salary', 'hire_date', 'is_active'],
  projects: ['id', 'name', 'department_id', 'start_date', 'end_date', 'status'],
  assignments: ['employee_id', 'project_id', 'role', 'hours_worked'],
};

const SQL_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'BETWEEN', 'LIKE',
  'IS', 'NULL', 'AS', 'ON', 'JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN',
  'FULL JOIN', 'CROSS JOIN', 'OUTER JOIN', 'UNION', 'UNION ALL', 'INTERSECT',
  'EXCEPT', 'ORDER BY', 'GROUP BY', 'HAVING', 'LIMIT', 'OFFSET', 'DISTINCT',
  'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM', 'CREATE TABLE',
  'DROP TABLE', 'ALTER TABLE', 'IF EXISTS', 'IF NOT EXISTS', 'PRIMARY KEY',
  'FOREIGN KEY', 'REFERENCES', 'DEFAULT', 'AUTOINCREMENT', 'CASCADE',
  'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'WITH', 'WITH RECURSIVE',
  'RETURNING', 'EXISTS', 'ALL', 'ANY', 'SOME', 'TRUE', 'FALSE',
  'ASC', 'DESC', 'NULLS FIRST', 'NULLS LAST', 'OVER', 'PARTITION BY',
  'WINDOW', 'FILTER', 'WITHIN',
];

const SQL_FUNCTIONS = [
  'COUNT', 'SUM', 'AVG', 'MIN', 'MAX',
  'ABS', 'ROUND', 'CEIL', 'FLOOR', 'CAST',
  'UPPER', 'LOWER', 'LENGTH', 'SUBSTR', 'SUBSTRING', 'TRIM', 'LTRIM', 'RTRIM',
  'REPLACE', 'INSTR', 'POSITION', 'COALESCE', 'NULLIF', 'IFNULL', 'IIF',
  'TYPEOF', 'HEX', 'QUOTE', 'RANDOMBLOB', 'ZEROBLOB',
  'DATE', 'TIME', 'DATETIME', 'JULIANDAY', 'STRFTIME', 'UNIXEPOCH',
  'ROW_NUMBER', 'RANK', 'DENSE_RANK', 'NTILE', 'LAG', 'LEAD',
  'FIRST_VALUE', 'LAST_VALUE', 'NTH_VALUE',
  'GROUP_CONCAT', 'PRINTF', 'UNICODE', 'CHAR',
  'LIKELIHOOD', 'LIKELY', 'UNLIKELY', 'SOUNDEX',
];

function sqlCompletion(context: CompletionContext) {
  const word = context.matchBefore(/[\w.]+/);
  if (!word || (word.from === word.to && !context.explicit)) return null;

  const text = word.text.toUpperCase();
  const options: { label: string; type: string; detail?: string; apply?: string }[] = [];

  // Add table completions
  for (const [table, columns] of Object.entries(SCHEMA_TABLES)) {
    if (table.toUpperCase().includes(text) || !text) {
      options.push({
        label: table,
        type: 'class',
        detail: `Table (${columns.length} cols)`,
        apply: table,
      });
      // Add table.column completions
      if (text.includes('.')) {
        const prefix = text.split('.')[0].toLowerCase();
        if (prefix === table) {
          for (const col of columns) {
            options.push({
              label: `${table}.${col}`,
              type: 'property',
              detail: `Column`,
            });
          }
        }
      }
    }
    // Also add column-only completions
    if (!text.includes('.')) {
      for (const col of columns) {
        if (col.toUpperCase().includes(text)) {
          options.push({
            label: col,
            type: 'property',
            detail: `${table}.${col}`,
          });
        }
      }
    }
  }

  // Add keyword completions
  for (const kw of SQL_KEYWORDS) {
    if (kw.toUpperCase().includes(text)) {
      options.push({
        label: kw,
        type: 'keyword',
      });
    }
  }

  // Add function completions
  for (const fn of SQL_FUNCTIONS) {
    if (fn.toUpperCase().includes(text)) {
      options.push({
        label: fn,
        type: 'function',
        detail: 'Function',
        apply: `${fn}()`,
      });
    }
  }

  if (options.length === 0) return null;

  return {
    from: word.from,
    options: options.sort((a, b) => a.label.localeCompare(b.label)),
    filter: true,
  };
}

// Light theme extension
const lightTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '14px',
    color: '#1e293b',
    backgroundColor: '#ffffff',
  },
  '.cm-scroller': {
    overflow: 'auto',
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
  },
  '.cm-content': {
    padding: '12px 0',
    minHeight: '100%',
    caretColor: '#10b981',
  },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    borderRight: '1px solid #e2e8f0',
    color: '#94a3b8',
  },
  '&.cm-focused .cm-cursor': {
    borderLeftColor: '#10b981',
    borderLeftWidth: '2px',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: '#dcfce7 !important',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  '.cm-line': {
    color: '#1e293b',
  },
});

interface SQLEditorProps {
  value: string;
  onChange: (value: string) => void;
  onRun?: () => void;
  height?: string;
  placeholder?: string;
  theme?: 'dark' | 'light' | undefined;
  onFormatSQL?: (sql: string) => void;
}

export default function SQLEditor({
  value,
  onChange,
  onRun,
  height = '300px',
  placeholder = 'Введите SQL запрос...',
  theme: themeProp,
  onFormatSQL,
}: SQLEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onRunRef = useRef(onRun);
  const onFormatSQLRef = useRef(onFormatSQL);

  useEffect(() => {
    onChangeRef.current = onChange;
  });
  useEffect(() => {
    onRunRef.current = onRun;
  });
  useEffect(() => {
    onFormatSQLRef.current = onFormatSQL;
  });

  const themeCompartment = useRef(new Compartment());

  // Custom dark theme (for better look)
  const customDarkTheme = EditorView.theme({
    '&': {
      height: '100%',
      fontSize: '14px',
    },
    '.cm-scroller': {
      overflow: 'auto',
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
    },
    '.cm-content': {
      padding: '12px 0',
      minHeight: '100%',
    },
    '.cm-gutters': {
      backgroundColor: 'transparent',
      borderRight: '1px solid #333',
      color: '#666',
    },
    '&.cm-focused .cm-cursor': {
      borderLeftColor: '#10b981',
      borderLeftWidth: '2px',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
      backgroundColor: '#264f78 !important',
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(16, 185, 129, 0.06)',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
    },
  });

  useEffect(() => {
    if (!containerRef.current) return;

    const isDark = themeProp === 'dark' || themeProp === undefined;

    const sqlCompletions = autocompletion({
      override: [sqlCompletion],
      activateOnTyping: true,
    });

    // Custom keybindings
    const runKeymap = keymap.of([
      {
        key: 'Mod-Enter',
        run: () => {
          onRunRef.current?.();
          return true;
        },
      },
      {
        key: 'Tab',
        run: (view) => {
          view.dispatch({
            changes: {
              from: view.state.selection.main.from,
              to: view.state.selection.main.to,
              insert: '  ',
            },
          });
          return true;
        },
      },
      {
        key: 'Mod-Shift-f',
        run: () => {
          if (onFormatSQLRef.current && viewRef.current) {
            const current = viewRef.current.state.doc.toString();
            onFormatSQLRef.current(current);
          }
          return true;
        },
      },
    ]);

    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        drawSelection(),
        EditorState.allowMultipleSelections.of(true),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        bracketMatching(),
        closeBrackets(),
        highlightActiveLine(),
        sql(),
        isDark ? oneDark : lightTheme,
        isDark ? customDarkTheme : [],
        sqlCompletions,
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...searchKeymap,
          ...historyKeymap,
        ]),
        runKeymap,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
        EditorView.lineWrapping,
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []); // Only create once

  // Update theme when prop changes
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const isDark = themeProp === 'dark' || themeProp === undefined;
    view.dispatch({
      effects: themeCompartment.current.reconfigure(isDark ? [oneDark, customDarkTheme] : [lightTheme]),
    });
  }, [themeProp]);

  // Update content from outside
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const currentValue = view.state.doc.toString();
    if (currentValue !== value) {
      view.dispatch({
        changes: {
          from: 0,
          to: currentValue.length,
          insert: value,
        },
      });
    }
  }, [value]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-md border border-border">
      {(!value || value.trim() === '') && (
        <div className="pointer-events-none absolute left-12 top-3 z-10 text-muted-foreground/50 text-sm">
          {placeholder}
        </div>
      )}
      <div ref={containerRef} style={{ height }} className="w-full" />
    </div>
  );
}
