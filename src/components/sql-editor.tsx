'use client';

import { useEffect, useRef } from 'react';
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLineGutter,
  highlightSpecialChars,
  drawSelection,
  highlightActiveLine,
} from '@codemirror/view';
import { EditorState } from '@codemirror/state';
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
} from '@codemirror/autocomplete';
import { searchKeymap } from '@codemirror/search';

interface SQLEditorProps {
  value: string;
  onChange: (value: string) => void;
  onRun?: () => void;
  height?: string;
  placeholder?: string;
}

export default function SQLEditor({
  value,
  onChange,
  onRun,
  height = '300px',
  placeholder = 'Введите SQL запрос...',
}: SQLEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onRunRef = useRef(onRun);

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    onRunRef.current = onRun;
  });

  useEffect(() => {
    if (!containerRef.current) return;

    // Custom theme extension
    const customTheme = EditorView.theme({
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
        sql(),
        oneDark,
        customTheme,
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
    <div className="relative h-full w-full overflow-hidden rounded-md border border-border">
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
