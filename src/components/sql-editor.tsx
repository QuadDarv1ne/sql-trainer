'use client';

import { useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
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
import { EditorState, Compartment } from '@codemirror/state';
import { sql } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';
import {
  defaultKeymap,
  history,
  historyKeymap,
  undo,
  redo,
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
  CompletionResult,
} from '@codemirror/autocomplete';
import { searchKeymap } from '@codemirror/search';
import { splitSqlSegments } from '@/lib/sql-utils';
import { t } from '@/lib/i18n';

export interface SchemaInfo {
  tables: {
    name: string;
    columns: { name: string; type: string }[];
  }[];
}

// SQL formatting function — exported so the main page can use it
export function formatSQL(input: string): string {
  if (!input.trim()) return input;

  const segments = splitSqlSegments(input);
  const formattedSegments = segments.map((seg, i) => {
    if (i % 2 === 0) return formatSqlSegment(seg);
    return seg; // Keep strings as-is
  });
  const formatted = formattedSegments.join('');

  return formatted.replace(/^\n+/, '');
}

/** Format a single SQL segment (outside string literals). */
function formatSqlSegment(segment: string): string {
  if (!segment.trim()) return segment;

  let result = segment.trim();

  // Add newline before major keywords
  result = result.replace(
    /\b(SELECT|FROM|WHERE|AND|OR|ORDER BY|GROUP BY|HAVING|LIMIT|OFFSET|UNION ALL|UNION|INTERSECT|EXCEPT|INNER JOIN|LEFT JOIN|RIGHT JOIN|FULL JOIN|CROSS JOIN|JOIN|ON|SET|VALUES)\b/gi,
    (match, offset, str) => {
      if (offset === 0) return match;
      const prevChar = str[offset - 1];
      if (prevChar === '\n' || prevChar === ' ') return match;
      return '\n' + match;
    }
  );

  // Extra newline before WITH
  result = result.replace(/\b(WITH(?: RECURSIVE)?)\b/gi, '\n$1');
  result = result.replace(/^SELECT\b/gm, '\nSELECT');

  // Indent lines with paren depth tracking
  const lines = result.split('\n');
  const indentKeywords = new Set([
    'select', 'from', 'where', 'and', 'or', 'order by', 'group by',
    'having', 'limit', 'offset', 'union all', 'union', 'intersect',
    'except', 'inner join', 'left join', 'right join', 'full join',
    'cross join', 'join', 'on', 'set', 'values', 'insert into',
    'update', 'delete from', 'returning',
  ]);

  const indentedLines: string[] = [];
  let baseIndent = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const openCount = (trimmed.match(/\(/g) || []).length;
    const closeCount = (trimmed.match(/\)/g) || []).length;

    const upperFirst = trimmed.replace(/\s+.*/, '').toUpperCase();
    const isClauseStart = indentKeywords.has(upperFirst.toLowerCase());
    const lineIndent = Math.max(0, baseIndent + (isClauseStart ? 0 : 2));

    indentedLines.push(' '.repeat(lineIndent) + trimmed);

    baseIndent = Math.max(0, baseIndent - closeCount + openCount);
  }

  return indentedLines.join('\n');
}

// Expanded autocomplete keywords — PostgreSQL
const PG_KEYWORDS = [
  'STRING_AGG', 'ARRAY_AGG', 'CONCAT_WS', 'BOOL_AND', 'BOOL_OR',
  'DATE_TRUNC', 'GENERATE_SERIES', 'LATERAL', 'FILTER', 'ILIKE',
  'AT TIME ZONE', 'EXTRACT', 'INTERVAL',
];

// Expanded autocomplete keywords — ClickHouse
const CH_KEYWORDS = [
  'toDate', 'toDateTime', 'toStartOfDay', 'toStartOfWeek', 'toStartOfMonth',
  'toStartOfQuarter', 'toStartOfYear', 'toYYYYMM', 'toYYYYMMDD',
  'now', 'today', 'yesterday',
  'sumIf', 'countIf', 'avgIf', 'minIf', 'maxIf',
  'multiIf', 'uniqExact', 'uniq', 'groupArray', 'groupUniqArray',
  'formatDateTime', 'toUInt32', 'toInt64', 'toFloat64', 'toString',
  'has', 'arrayJoin', 'greatest', 'least',
];

// SQL functions (expanded)
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
];

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
  // Mobile optimizations
  '@media (max-width: 768px)': {
    '&': {
      fontSize: '16px', // Prevents zoom on iOS
    },
    '.cm-content': {
      padding: '8px 0',
    },
  },
});

/**
 * Create a completion source that suggests table/column names from schema.
 */
function createSchemaCompletion(schema: SchemaInfo | null) {
  return (context: CompletionContext): CompletionResult | null => {
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

    // Add SQL functions with () completion
    SQL_FUNCTIONS.forEach((fn) => {
      completions.push({
        label: fn,
        type: 'function',
        detail: 'function',
        apply: `${fn}()`,
      });
    });

    // Add PostgreSQL keywords
    PG_KEYWORDS.forEach((kw) => {
      completions.push({
        label: kw,
        type: 'keyword',
        detail: 'PostgreSQL',
      });
    });

    // Add ClickHouse keywords
    CH_KEYWORDS.forEach((kw) => {
      completions.push({
        label: kw,
        type: 'function',
        detail: 'ClickHouse',
      });
    });

    return { from: word.from, options: completions };
  };
}

export interface SQLEditorRef {
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

interface SQLEditorProps {
  value: string;
  onChange: (value: string) => void;
  onRun?: () => void;
  height?: string;
  placeholder?: string;
  schema?: SchemaInfo | null;
  onFormatSQL?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onHistoryChange?: (canUndo: boolean, canRedo: boolean) => void;
}

const SQLEditor = forwardRef<SQLEditorRef, SQLEditorProps>(function SQLEditor({
  value,
  onChange,
  onRun,
  height = '300px',
  schema = null,
  onFormatSQL,
  onUndo,
  onRedo,
  onHistoryChange,
}: SQLEditorProps, ref) {
  const { theme } = useTheme();
  const placeholder = t('sqlEditor.placeholder');
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onRunRef = useRef(onRun);
  const onFormatSQLRef = useRef(onFormatSQL);
  const onUndoRef = useRef(onUndo);
  const onRedoRef = useRef(onRedo);
  const schemaRef = useRef(schema);
  const themeRef = useRef(theme);
  const themeCompartmentRef = useRef<Compartment>(new Compartment());
  const initialValueRef = useRef(value);
  const canUndoRef = useRef(false);
  const canRedoRef = useRef(false);
  const historyCountRef = useRef(0);

  // Compute isDark directly from theme
  const isDark = theme !== 'light';

  const emitHistoryChange = useCallback((docChanged?: boolean) => {
    if (docChanged) {
      historyCountRef.current++;
      canUndoRef.current = historyCountRef.current > 0;
      canRedoRef.current = false; // New action clears redo stack
    }
    onHistoryChange?.(canUndoRef.current, canRedoRef.current);
  }, [onHistoryChange]);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onRunRef.current = onRun;
  }, [onRun]);

  useEffect(() => {
    onFormatSQLRef.current = onFormatSQL;
  }, [onFormatSQL]);

  useEffect(() => {
    onUndoRef.current = onUndo;
  }, [onUndo]);

  useEffect(() => {
    onRedoRef.current = onRedo;
  }, [onRedo]);

  useEffect(() => {
    schemaRef.current = schema;
  }, [schema]);

  useImperativeHandle(ref, () => ({
    undo: () => {
      const view = viewRef.current;
      if (view) {
        undo({ state: view.state, dispatch: view.dispatch.bind(view) });
        if (historyCountRef.current > 0) {
          historyCountRef.current--;
        }
        canUndoRef.current = historyCountRef.current > 0;
        canRedoRef.current = true;
        emitHistoryChange();
      }
      onUndo?.();
    },
    redo: () => {
      const view = viewRef.current;
      if (view) {
        redo({ state: view.state, dispatch: view.dispatch.bind(view) });
        historyCountRef.current++;
        canUndoRef.current = true;
        canRedoRef.current = false;
        emitHistoryChange();
      }
      onRedo?.();
    },
    canUndo: () => canUndoRef.current,
    canRedo: () => canRedoRef.current,
  }), [onUndo, onRedo, emitHistoryChange]);

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
      {
        key: 'Mod-Shift-f',
        run: () => {
          onFormatSQLRef.current?.();
          return true;
        },
      },
      {
        key: 'Mod-z',
        run: () => {
          onUndoRef.current?.();
          return false; // Let CodeMirror history handle it too
        },
      },
      {
        key: 'Mod-y',
        run: () => {
          onRedoRef.current?.();
          return false;
        },
      },
      {
        key: 'Mod-Shift-z',
        run: () => {
          onRedoRef.current?.();
          return false;
        },
      },
    ]);

    const state = EditorState.create({
      doc: initialValueRef.current,
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
        sql(
          schemaRef.current
            ? {
                schema: Object.fromEntries(
                  schemaRef.current.tables.map((t) => [
                    t.name,
                    { columns: t.columns.map((c) => c.name) },
                  ]),
                ) as Record<string, { columns: string[] }>,
              }
            : undefined
        ),
        autocompletion({
          override: [
            (context) => {
              const schemaCompletions = createSchemaCompletion(schemaRef.current);
              return schemaCompletions?.(context);
            },
          ],
        }),
        ...(isDark ? [oneDark] : []),
        themeCompartmentRef.current.of(customTheme),
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
            emitHistoryChange(true);
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

  // Update theme when it changes using compartment reconfigure (preserves undo history)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const isDark = theme !== 'light';
    const newCustomTheme = isDark ? EditorView.theme({
      '&': { height: '100%', fontSize: '14px' },
      '.cm-scroller': { overflow: 'auto', fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace" },
      '.cm-content': { padding: '12px 0', minHeight: '100%' },
      '.cm-gutters': { backgroundColor: 'transparent', borderRight: '1px solid #333', color: '#666' },
      '&.cm-focused .cm-cursor': { borderLeftColor: '#10b981', borderLeftWidth: '2px' },
      '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': { backgroundColor: '#264f78 !important' },
      '.cm-activeLine': { backgroundColor: 'rgba(16, 185, 129, 0.06)' },
      '.cm-activeLineGutter': { backgroundColor: 'rgba(16, 185, 129, 0.1)' },
      '@media (max-width: 768px)': {
        '&': { fontSize: '16px' },
        '.cm-content': { padding: '8px 0' },
      },
    }) : lightTheme;

    view.dispatch({
      effects: themeCompartmentRef.current.reconfigure(newCustomTheme),
    });
  }, [theme]);

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
});

export default SQLEditor;
