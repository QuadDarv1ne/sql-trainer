'use client';

import { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLineGutter,
  highlightSpecialChars,
  drawSelection,
  highlightActiveLine,
} from '@codemirror/view';
import { EditorState, StateEffect } from '@codemirror/state';
import { sql } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';
import {
  defaultKeymap,
  history,
  historyKeymap,
} from '@codemirror/commands';
import {
  syntaxHighlighting,
  defaultHighlightStyle,
  bracketMatching,
} from '@codemirror/language';
import {
  closeBrackets,
  closeBracketsKeymap,
  autocompletion,
  completionKeymap,
  CompletionContext,
  Completion,
} from '@codemirror/autocomplete';
import { searchKeymap } from '@codemirror/search';

export interface SchemaInfo {
  tables: {
    name: string;
    columns: { name: string; type: string }[];
  }[];
}

// SQL keywords for autocomplete
const SQL_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP',
  'ALTER', 'TABLE', 'INTO', 'VALUES', 'SET', 'JOIN', 'INNER', 'LEFT', 'RIGHT',
  'FULL', 'OUTER', 'CROSS', 'ON', 'GROUP', 'BY', 'ORDER', 'HAVING', 'LIMIT',
  'OFFSET', 'UNION', 'ALL', 'DISTINCT', 'AS', 'AND', 'OR', 'NOT', 'IN', 'IS',
  'NULL', 'BETWEEN', 'LIKE', 'EXISTS', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
  'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'COALESCE', 'NULLIF', 'CAST',
  'ROW_NUMBER', 'RANK', 'DENSE_RANK', 'OVER', 'PARTITION', 'LAG', 'LEAD',
  'FIRST_VALUE', 'LAST_VALUE', 'WITH', 'RECURSIVE', 'VIEW', 'INDEX', 'TRIGGER',
  'BEGIN', 'COMMIT', 'ROLLBACK', 'TRANSACTION', 'PRIMARY', 'KEY', 'FOREIGN',
  'REFERENCES', 'CONSTRAINT', 'DEFAULT', 'UNIQUE', 'CHECK',
].map((label) => ({ label, type: 'keyword' }));

// Light theme for SQL editor
const lightTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '14px',
  },
  '.cm-scroller': {
    overflow: 'auto',
    fontFamily:
      "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
  },
  '.cm-content': {
    padding: '12px 0',
    minHeight: '100%',
  },
  '.cm-gutters': {
    backgroundColor: '#f8f9fa',
    borderRight: '1px solid #e2e8f0',
    color: '#64748b',
  },
  '&.cm-focused .cm-cursor': {
    borderLeftColor: '#10b981',
    borderLeftWidth: '2px',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: '#bfdbfe !important',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
});

/**
 * Create a completion source that suggests table/column names from schema.
 */
function createSchemaCompletion(schema: SchemaInfo | null) {
  return (context: CompletionContext): Completion[] | null => {
    if (!schema || schema.tables.length === 0) return null;

    const word = context.matchBefore(/\w*/);
    if (!word || (word.from === word.to && !context.explicit)) return null;

    const completions: Completion[] = [];

    // Add table names
    schema.tables.forEach((table) => {
      completions.push({
        label: table.name,
        type: 'class',
        detail: 'table',
      });

      // Add column names
      table.columns.forEach((col) => {
        completions.push({
          label: `${table.name}.${col.name}`,
          type: 'property',
          detail: `${table.name}.${col.name} (${col.type})`,
        });
        // Also add bare column name
        completions.push({
          label: col.name,
          type: 'property',
          detail: `${col.type}`,
        });
      });
    });

    return completions;
  };
}

interface SQLEditorProps {
  value: string;
  onChange: (value: string) => void;
  onRun?: () => void;
  height?: string;
  placeholder?: string;
  schema?: SchemaInfo | null;
}

export default function SQLEditor({
  value,
  onChange,
  onRun,
  height = '300px',
  placeholder = 'Введите SQL запрос...',
  schema = null,
}: SQLEditorProps) {
  const { theme } = useTheme();
  const [isDark, setIsDark] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onRunRef = useRef(onRun);
  const schemaRef = useRef(schema);
  const themeRef = useRef(theme);

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    onRunRef.current = onRun;
  });

  useEffect(() => {
    schemaRef.current = schema;
  });

  useEffect(() => {
    themeRef.current = theme;
    setIsDark(theme !== 'light');
  });

  useEffect(() => {
    if (!containerRef.current) return;

    // Choose theme based on system theme
    const isDark = themeRef.current !== 'light';

    // Custom theme extension
    const customTheme = isDark ? EditorView.theme({
      '&': {
        height: '100%',
        fontSize: '14px',
      },
      '.cm-scroller': {
        overflow: 'auto',
        fontFamily:
          "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
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
    }) : lightTheme;

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
          // Insert spaces instead of tab
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
        sql({
          schema: schemaRef.current
            ? {
                tables: schemaRef.current.tables.map((t) => ({
                  tableName: t.name,
                  columns: t.columns.map((c) => c.name),
                })),
              }
            : undefined,
        }),
        autocompletion({
          override: [
            (context) => {
              const schemaCompletions = createSchemaCompletion(schemaRef.current);
              const completions = schemaCompletions?.(context);
              if (completions) {
                return context.completionRange ? { from: context.from, options: completions } : null;
              }
              return null;
            },
          ],
        }),
        ...(isDark ? [oneDark] : []),
        customTheme,
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...searchKeymap,
          ...historyKeymap,
          ...completionKeymap,
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
  }, []);

  // Update content from outside
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const currentValue = view.state.doc.toString();
    if (currentValue !== value) {
      view.dispatch({
        changes: { from: 0, to: currentValue.length, insert: value },
      });
    }
  }, [value]);

  return (
    <div className={`relative h-full w-full overflow-hidden rounded-md border border-border ${isDark ? 'bg-[#282c34]' : 'bg-white'}`}>
      {(!value || value.trim() === '') && (
        <div className="pointer-events-none absolute left-12 top-3 z-10 text-muted-foreground/50 text-sm">
          {placeholder}
        </div>
      )}
      <div
        ref={containerRef}
        style={{ height }}
        className="w-full"
      />
    </div>
  );
}
