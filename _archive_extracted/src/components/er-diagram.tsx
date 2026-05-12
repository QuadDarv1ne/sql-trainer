'use client';

import type { DatabaseInfo, TableInfo, ColumnInfo } from '@/lib/sql-engine';

interface ERDiagramProps {
  schema: DatabaseInfo | null;
}

// Fixed layout for the training schema
const TABLE_LAYOUT: Record<string, { x: number; y: number }> = {
  departments: { x: 50, y: 40 },
  employees: { x: 300, y: 40 },
  projects: { x: 50, y: 250 },
  assignments: { x: 300, y: 250 },
};

const HEADER_HEIGHT = 32;
const ROW_HEIGHT = 22;
const TABLE_WIDTH = 210;
const PADDING = 12;
const FONT_SIZE = 11;

// Known foreign key relationships
const KNOWN_RELATIONS: { from: string; to: string; fromCol: string; toCol: string }[] = [
  { from: 'employees', to: 'departments', fromCol: 'department_id', toCol: 'id' },
  { from: 'projects', to: 'departments', fromCol: 'department_id', toCol: 'id' },
  { from: 'assignments', to: 'employees', fromCol: 'employee_id', toCol: 'id' },
  { from: 'assignments', to: 'projects', fromCol: 'project_id', toCol: 'id' },
];

export default function ERDiagram({ schema }: ERDiagramProps) {
  if (!schema || schema.tables.length === 0) return null;

  const tables = schema.tables;
  const tableMap = new Map<string, TableInfo>();
  tables.forEach((t) => tableMap.set(t.name, t));

  // Calculate viewBox
  let maxX = 0;
  let maxY = 0;
  tables.forEach((t) => {
    const layout = TABLE_LAYOUT[t.name] || { x: 0, y: 0 };
    const x = layout.x + TABLE_WIDTH;
    const y = layout.y + HEADER_HEIGHT + t.columns.length * ROW_HEIGHT + PADDING;
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  });

  const viewBox = `0 0 ${maxX + 30} ${maxY + 30}`;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={viewBox}
        className="w-full min-w-[500px]"
        style={{ maxHeight: '400px' }}
      >
        <defs>
          <filter id="shadow" x="-4%" y="-4%" width="108%" height="108%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.1" />
          </filter>
        </defs>

        {/* Relationship lines */}
        {tables.map((table) => {
          const rels = KNOWN_RELATIONS.filter((r) => r.from === table.name);
          return rels.map((rel) => {
            const toTable = tableMap.get(rel.to);
            if (!toTable) return null;

            const fromLayout = TABLE_LAYOUT[table.name] || { x: 0, y: 0 };
            const toLayout = TABLE_LAYOUT[rel.to] || { x: 0, y: 0 };

            const fromColIdx = table.columns.findIndex((c) => c.name === rel.fromCol);
            const toColIdx = toTable.columns.findIndex((c) => c.name === rel.toCol);

            const fromY = fromLayout.y + HEADER_HEIGHT + (fromColIdx >= 0 ? fromColIdx : 0) * ROW_HEIGHT + ROW_HEIGHT / 2;
            const toY = toLayout.y + HEADER_HEIGHT + (toColIdx >= 0 ? toColIdx : 0) * ROW_HEIGHT + ROW_HEIGHT / 2;

            // Determine connection points
            const fromX = fromLayout.x + TABLE_WIDTH;
            const toX = toLayout.x;

            const isVertical = fromX === toX;
            const midX = (fromX + toX) / 2;

            const pathD = isVertical
              ? `M ${fromX} ${fromY} C ${fromX + 40} ${fromY}, ${toX + 40} ${toY}, ${toX} ${toY}`
              : `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;

            return (
              <g key={`${table.name}-${rel.to}-${rel.fromCol}`}>
                <path
                  d={pathD}
                  fill="none"
                  stroke="currentColor"
                  className="text-muted-foreground/40"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />
                {/* Circle at source */}
                <circle
                  cx={fromX}
                  cy={fromY}
                  r="3"
                  className="fill-muted-foreground/40"
                />
                {/* Arrow at target */}
                <polygon
                  points={`${toX},${toY} ${toX + 6},${toY - 4} ${toX + 6},${toY + 4}`}
                  className="fill-muted-foreground/40"
                />
              </g>
            );
          });
        })}

        {/* Tables */}
        {tables.map((table) => {
          const layout = TABLE_LAYOUT[table.name] || { x: 0, y: 0 };
          const tableHeight = HEADER_HEIGHT + table.columns.length * ROW_HEIGHT + PADDING;

          return (
            <g
              key={table.name}
              transform={`translate(${layout.x}, ${layout.y})`}
              filter="url(#shadow)"
            >
              {/* Table background */}
              <rect
                x="0"
                y="0"
                width={TABLE_WIDTH}
                height={tableHeight}
                rx="6"
                className="fill-card stroke-border"
                strokeWidth="1"
              />
              {/* Table header */}
              <rect
                x="0"
                y="0"
                width={TABLE_WIDTH}
                height={HEADER_HEIGHT}
                rx="6"
                className="fill-emerald-600"
              />
              <rect
                x="0"
                y={HEADER_HEIGHT - 6}
                width={TABLE_WIDTH}
                height="6"
                className="fill-emerald-600"
              />
              <text
                x="10"
                y={HEADER_HEIGHT / 2 + 4}
                fontSize={FONT_SIZE + 1}
                fontWeight="bold"
                className="fill-white"
              >
                {table.name}
              </text>

              {/* Columns */}
              {table.columns.map((col, idx) => {
                const y = HEADER_HEIGHT + idx * ROW_HEIGHT + ROW_HEIGHT / 2 + 3;
                return (
                  <g key={col.name}>
                    {col.primaryKey && (
                      <circle cx="14" cy={y - 3} r="4" className="fill-amber-400" />
                    )}
                    {!col.primaryKey && (
                      <circle cx="14" cy={y - 3} r="2.5" className="fill-muted-foreground/30" />
                    )}
                    <text
                      x="24"
                      y={y}
                      fontSize={FONT_SIZE}
                      className={col.primaryKey ? 'fill-amber-700 dark:fill-amber-300 font-medium' : 'fill-foreground'}
                    >
                      {col.name}
                    </text>
                    <text
                      x={TABLE_WIDTH - 12}
                      y={y}
                      fontSize={FONT_SIZE - 2}
                      textAnchor="end"
                      className="fill-muted-foreground/60"
                    >
                      {col.type}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
