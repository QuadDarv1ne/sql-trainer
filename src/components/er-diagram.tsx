'use client';

import type { DatabaseInfo, TableInfo } from '@/lib/sql-engine';

interface ERDiagramProps {
  schema: DatabaseInfo | null;
}

// Layout for company schema (employees, departments, projects, assignments)
const COMPANY_LAYOUT: Record<string, { x: number; y: number }> = {
  departments: { x: 50, y: 40 },
  employees: { x: 320, y: 40 },
  projects: { x: 50, y: 260 },
  assignments: { x: 320, y: 260 },
};

// Layout for shop schema
const SHOP_LAYOUT: Record<string, { x: number; y: number }> = {
  categories: { x: 30, y: 30 },
  customers: { x: 30, y: 220 },
  products: { x: 260, y: 30 },
  orders: { x: 260, y: 220 },
  order_items: { x: 490, y: 130 },
  reviews: { x: 490, y: 320 },
};

// Layout for orders schema (products, orders)
const ORDERS_LAYOUT: Record<string, { x: number; y: number }> = {
  products: { x: 50, y: 80 },
  orders: { x: 320, y: 80 },
};

// Layout for books schema
const BOOKS_LAYOUT: Record<string, { x: number; y: number }> = {
  books: { x: 50, y: 40 },
};

const HEADER_HEIGHT = 32;
const ROW_HEIGHT = 22;
const TABLE_WIDTH = 210;
const PADDING = 12;
const FONT_SIZE = 11;

// Known foreign key relationships for company schema
const COMPANY_RELATIONS: { from: string; to: string; fromCol: string; toCol: string }[] = [
  { from: 'employees', to: 'departments', fromCol: 'department_id', toCol: 'id' },
  { from: 'projects', to: 'departments', fromCol: 'department_id', toCol: 'id' },
  { from: 'assignments', to: 'employees', fromCol: 'employee_id', toCol: 'id' },
  { from: 'assignments', to: 'projects', fromCol: 'project_id', toCol: 'id' },
];

// Known foreign key relationships for shop schema
const SHOP_RELATIONS: { from: string; to: string; fromCol: string; toCol: string }[] = [
  { from: 'products', to: 'categories', fromCol: 'category_id', toCol: 'id' },
  { from: 'orders', to: 'customers', fromCol: 'customer_id', toCol: 'id' },
  { from: 'order_items', to: 'orders', fromCol: 'order_id', toCol: 'id' },
  { from: 'order_items', to: 'products', fromCol: 'product_id', toCol: 'id' },
  { from: 'reviews', to: 'customers', fromCol: 'customer_id', toCol: 'id' },
  { from: 'reviews', to: 'products', fromCol: 'product_id', toCol: 'id' },
];

// Known foreign key relationships for orders schema
const ORDERS_RELATIONS: { from: string; to: string; fromCol: string; toCol: string }[] = [
  { from: 'orders', to: 'products', fromCol: 'product_id', toCol: 'id' },
];

function detectSchemaType(tables: string[]): 'company' | 'shop' | 'orders' | 'books' | 'generic' {
  const tableNames = new Set(tables);
  const companyTables = ['departments', 'employees', 'projects', 'assignments'];
  const shopTables = ['categories', 'customers', 'products', 'orders', 'order_items', 'reviews'];

  const companyMatch = tables.filter((t) => companyTables.includes(t)).length;
  const shopMatch = tables.filter((t) => shopTables.includes(t)).length;

  if (shopMatch >= 4 && shopMatch > companyMatch) return 'shop';
  if (companyMatch >= 3) return 'company';
  if (tableNames.has('products') && tableNames.has('orders')) return 'orders';
  if (tableNames.has('books')) return 'books';
  return 'generic';
}

function getLayout(schemaType: string, tableNames: string[]): Record<string, { x: number; y: number }> {
  switch (schemaType) {
    case 'company': return COMPANY_LAYOUT;
    case 'shop': return SHOP_LAYOUT;
    case 'orders': return ORDERS_LAYOUT;
    case 'books': return BOOKS_LAYOUT;
    default: {
      const layout: Record<string, { x: number; y: number }> = {};
      const cols = 2;
      tableNames.forEach((name, i) => {
        layout[name] = { x: 50 + (i % cols) * 280, y: 40 + Math.floor(i / cols) * 220 };
      });
      return layout;
    }
  }
}

function getRelations(schemaType: string): { from: string; to: string; fromCol: string; toCol: string }[] {
  switch (schemaType) {
    case 'company': return COMPANY_RELATIONS;
    case 'shop': return SHOP_RELATIONS;
    case 'orders': return ORDERS_RELATIONS;
    default: return [];
  }
}

export default function ERDiagram({ schema }: ERDiagramProps) {
  if (!schema || schema.tables.length === 0) return null;

  const tables = schema.tables;
  const tableMap = new Map<string, TableInfo>();
  tables.forEach((t) => tableMap.set(t.name, t));

  const schemaType = detectSchemaType(tables.map((t) => t.name));
  const layout = getLayout(schemaType, tables.map((t) => t.name));
  const relations = getRelations(schemaType);

  // Filter relations to only include tables that exist
  const tableNames = new Set(tables.map((t) => t.name));
  const activeRelations = relations.filter(
    (r) => tableNames.has(r.from) && tableNames.has(r.to)
  );

  // Calculate viewBox
  let maxX = 0;
  let maxY = 0;
  tables.forEach((t) => {
    const pos = layout[t.name] || { x: 0, y: 0 };
    const x = pos.x + TABLE_WIDTH;
    const y = pos.y + HEADER_HEIGHT + t.columns.length * ROW_HEIGHT + PADDING;
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  });

  const viewBox = `0 0 ${maxX + 30} ${maxY + 30}`;

  const headerColor =
    schemaType === 'company' ? 'fill-emerald-600'
      : schemaType === 'shop' ? 'fill-violet-600'
        : schemaType === 'orders' ? 'fill-blue-600'
          : 'fill-slate-600';

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={viewBox}
        className="w-full min-w-[500px]"
        style={{ maxHeight: '500px' }}
      >
        <defs>
          <filter id="er-shadow" x="-4%" y="-4%" width="108%" height="108%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.1" />
          </filter>
        </defs>

        {/* Relationship lines */}
        {activeRelations.map((rel) => {
          const fromTable = tableMap.get(rel.from);
          const toTable = tableMap.get(rel.to);
          if (!fromTable || !toTable) return null;

          const fromPos = layout[rel.from] || { x: 0, y: 0 };
          const toPos = layout[rel.to] || { x: 0, y: 0 };

          const fromColIdx = fromTable.columns.findIndex((c) => c.name === rel.fromCol);
          const toColIdx = toTable.columns.findIndex((c) => c.name === rel.toCol);

          const fromY = fromPos.y + HEADER_HEIGHT + (fromColIdx >= 0 ? fromColIdx : 0) * ROW_HEIGHT + ROW_HEIGHT / 2;
          const toY = toPos.y + HEADER_HEIGHT + (toColIdx >= 0 ? toColIdx : 0) * ROW_HEIGHT + ROW_HEIGHT / 2;

          const fromX = fromPos.x + TABLE_WIDTH;
          const toX = toPos.x;
          const midX = (fromX + toX) / 2;

          const pathD = `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;

          return (
            <g key={`${rel.from}-${rel.to}-${rel.fromCol}`}>
              <path
                d={pathD}
                fill="none"
                stroke="currentColor"
                className="text-muted-foreground/40"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
              <circle cx={fromX} cy={fromY} r="3" className="fill-muted-foreground/40" />
              <polygon
                points={`${toX},${toY} ${toX + 6},${toY - 4} ${toX + 6},${toY + 4}`}
                className="fill-muted-foreground/40"
              />
            </g>
          );
        })}

        {/* Tables */}
        {tables.map((table) => {
          const pos = layout[table.name] || { x: 0, y: 0 };
          const tableHeight = HEADER_HEIGHT + table.columns.length * ROW_HEIGHT + PADDING;

          return (
            <g
              key={table.name}
              transform={`translate(${pos.x}, ${pos.y})`}
              filter="url(#er-shadow)"
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
                className={headerColor}
              />
              <rect
                x="0"
                y={HEADER_HEIGHT - 6}
                width={TABLE_WIDTH}
                height="6"
                className={headerColor}
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
