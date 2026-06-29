<div align="center">

# SQL Trainer

### Interactive Platform for SQL Learning and Practice

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-new--york-black)](https://ui.shadcn.com/)
[![CodeMirror](https://img.shields.io/badge/CodeMirror-6-purple)](https://codemirror.net/)
[![Recharts](https://img.shields.io/badge/Recharts-2-ff7300)](https://recharts.org/)
[![SQLite](https://img.shields.io/badge/SQLite-3-003b57?logo=sqlite)](https://www.sqlite.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](./LICENSE)

---

**Author:** Dupley Maxim Igorevich

**Intellectual Property:** Dupley Maxim Igorevich

</div>

---

## Interface

<table>
  <tr>
    <td align="center"><a href="img/Главная страница.png"><img src="img/Главная страница.png" width="400" alt="Home Page"/></a><br/><sub>Home Page</sub></td>
    <td align="center"><a href="img/Задания.png"><img src="img/Задания.png" width="400" alt="Task Mode"/></a><br/><sub>Task Mode</sub></td>
  </tr>
  <tr>
    <td align="center"><a href="img/Горячие клавиши.png"><img src="img/Горячие клавиши.png" width="400" alt="Keyboard Shortcuts"/></a><br/><sub>Keyboard Shortcuts</sub></td>
    <td align="center"><a href="img/Свободный режим.png"><img src="img/Свободный режим.png" width="400" alt="Free Mode"/></a><br/><sub>Free Mode</sub></td>
  </tr>
  <tr>
    <td align="center"><a href="img/Несколько тем оформления и шаблоны.png"><img src="img/Несколько тем оформления и шаблоны.png" width="400" alt="Themes"/></a><br/><sub>Themes and Templates</sub></td>
    <td align="center"><a href="img/Экспорт - импорт.png"><img src="img/Экспорт - импорт.png" width="400" alt="Export and Import"/></a><br/><sub>Export / Import</sub></td>
  </tr>
</table>

---

## About the Project

**SQL Trainer** is a comprehensive web platform for interactive learning of SQL and database operations. The project is designed as a full-featured educational application that combines training tasks with automatic verification, a free mode for arbitrary queries, a progress system with gamification, user authentication, and support for multiple DBMS (SQLite and PostgreSQL). The platform is intended for students, developers, and anyone who wants to master SQL through practical exercises.

## Key Features

- **Training tasks** — practical SQL exercises with automatic result verification
- **Free mode** — write any queries and explore the database structure
- **SQL editor** — syntax highlighting, autocompletion, keyboard shortcuts powered by CodeMirror 6
- **SQLite and PostgreSQL support** — work with different DBMS, switch between data sources
- **Query history** — save and quickly access previous queries
- **Export/Import** — export results to CSV, JSON and other formats
- **Progress system** — track streaks, statistics and analytics
- **Recommendations** — personalized task suggestions to improve skills
- **Themes** — light, dark and other themes with automatic detection
- **Authentication** — registration, login, password recovery, user profile
- **Leaderboard** — compete with other users on progress
- **Achievement system** — badges for various learning accomplishments
- **SQL reference** — built-in reference for SQL operators and functions
- **Schema visualization** — view table structures and relationships
- **Result charts** — visualize query results via Recharts

## Learning Topics

| # | Topic | Category | Description |
|---|-------|----------|-------------|
| 1 | **SELECT** | Basics | Basic data selection from tables, filtering with WHERE |
| 2 | **WHERE** | Basics | Filtering conditions: comparison, BETWEEN, IN, LIKE |
| 3 | **ORDER BY** | Basics | Sorting results by one or more columns |
| 4 | **LIMIT / OFFSET** | Basics | Limiting the number of returned rows, pagination |
| 5 | **JOIN (INNER)** | Joins | Inner join of tables by key |
| 6 | **LEFT JOIN** | Joins | Left outer join preserving all rows from the left table |
| 7 | **RIGHT JOIN** | Joins | Right outer join preserving all rows from the right table |
| 8 | **FULL JOIN** | Joins | Full outer join preserving all rows from both tables |
| 9 | **CROSS JOIN** | Joins | Cartesian product of rows from two tables |
| 10 | **GROUP BY** | Aggregation | Row grouping with aggregate functions: COUNT, SUM, AVG, MIN, MAX |
| 11 | **HAVING** | Aggregation | Filtering groups after aggregation |
| 12 | **UNION** | Set Operations | Combining results of two queries with duplicate removal |
| 13 | **INTERSECT** | Set Operations | Intersection of results of two queries |
| 14 | **EXISTS** | Subqueries | Checking for existence of rows in a subquery |
| 15 | **Subqueries** | Subqueries | Nested SELECT in WHERE, FROM, SELECT |
| 16 | **DML (INSERT/UPDATE/DELETE)** | Modification | Inserting, updating and deleting data |
| 17 | **CREATE TABLE** | DDL | Creating tables with column and type definitions |
| 18 | **ALTER TABLE** | DDL | Modifying existing table structures |
| 19 | **VIEW** | DB Objects | Creating views to simplify queries |
| 20 | **INDEX** | DB Objects | Creating indexes to speed up searches |

## Progress System

The platform uses a gamified progression system. Experience points (XP) are awarded for completing tasks and interacting with the platform, determining the user's level and unlocking new achievements.

| Action | XP |
|--------|-----|
| Task completion (correct) | +20 XP |
| Task completion (incorrect) | +5 XP |
| Free mode (query) | +10 XP |
| Reference exploration | +5 XP |
| Table schema view | +5 XP |
| Streak bonus | +10 XP/day |

**Levels:**

| Level | Title | Required XP |
|-------|-------|-------------|
| 1 | Novice | 0 |
| 2 | Learner | 500 |
| 3–4 | Practitioner | 1,100+ |
| 5–6 | Analyst | 2,800+ |
| 7–9 | Developer | 6,400+ |
| 10–14 | DB Engineer | 15,000+ |
| 15–19 | DB Architect | 40,000+ |
| 20+ | SQL Master | 100,000+ |

## Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16 | React framework with App Router, SSR, and optimization |
| **TypeScript** | 5 | Static typing for code reliability |
| **Tailwind CSS** | 4 | Utility-first CSS for rapid UI development |
| **shadcn/ui** | — | UI components in New York style |
| **CodeMirror 6** | — | SQL editor with syntax highlighting and autocompletion |
| **Recharts** | 2 | Interactive charts and data visualization |
| **Zustand** | 5 | Lightweight state management |
| **Better SQLite3** | 12 | Embedded SQLite database for training data |
| **PostgreSQL** | 16 | External PostgreSQL database support |
| **NextAuth.js** | 5 | Authentication and session management |
| **Framer Motion** | 12 | Smooth animations and transitions |
| **React Hook Form** | 7 | Form validation and management |
| **Zod** | 4 | TypeScript-first data validation |

## Installation and Setup

### Prerequisites

- **Node.js** version 18 or higher (20+ recommended)
- **npm**, **yarn**, **pnpm**, or **bun** as package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/dupleymi-aup/sql-trainer.git
cd sql-trainer

# Install dependencies
npm install

# Run in development mode
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
# Build the project
npm run build

# Run the built application
npm start
```

## Project Structure

```
sql-trainer/
├── public/                         # Static files
│   └── logo.svg                    # Project SVG logo
├── img/                            # Interface screenshots
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout with ThemeProvider and AuthProvider
│   │   ├── globals.css             # Global styles and CSS variables
│   │   ├── (auth)/                 # Authentication pages
│   │   │   ├── login/page.tsx      # Login page
│   │   │   ├── register/page.tsx   # Registration page
│   │   │   └── reset-password/page.tsx  # Password recovery
│   │   ├── (main)/                 # Main pages
│   │   │   └── profile/page.tsx    # User profile
│   │   └── api/                    # API routes
│   │       ├── auth/               # Authentication (NextAuth)
│   │       ├── sql/                # SQL queries and verification
│   │       └── user/               # Progress, achievements, leaderboard
│   ├── components/
│   │   ├── sql-editor.tsx          # SQL editor based on CodeMirror 6
│   │   ├── results-table.tsx       # Query results table
│   │   ├── query-result-chart.tsx  # Results visualization
│   │   ├── task-panel.tsx          # Task panel
│   │   ├── query-history.tsx       # Query history
│   │   ├── db-selector.tsx         # Database selector
│   │   ├── schema-viewer.tsx       # DB schema viewer
│   │   ├── sql-reference.tsx       # SQL reference
│   │   ├── sql-templates.tsx       # SQL query templates
│   │   ├── sidebar.tsx             # Sidebar
│   │   ├── welcome-panel.tsx       # Welcome panel
│   │   ├── shortcuts-help.tsx      # Keyboard shortcuts help
│   │   ├── export-import-dialog.tsx # Data export/import
│   │   ├── practice-mode-dialog.tsx # Free mode
│   │   ├── auth/                   # Authentication components
│   │   ├── profile/                # Profile components
│   │   └── ui/                     # shadcn/ui components (60+ components)
│   ├── lib/
│   │   ├── auth.ts                 # NextAuth configuration
│   │   ├── auth-internal.ts        # Internal auth utilities
│   │   ├── db-users.ts             # User database operations
│   │   ├── sql-engine.ts           # SQL engine for query verification
│   │   ├── training-tasks.ts       # Training task generation
│   │   ├── postgresql-adapter.ts   # PostgreSQL adapter
│   │   ├── store.ts                # Zustand state store
│   │   └── utils.ts                # Utilities (cn, formatting)
│   ├── hooks/
│   │   ├── use-mobile.ts           # Hook for mobile device detection
│   │   └── use-toast.ts            # Hook for notifications
│   └── types/
│       └── next-auth.d.ts          # NextAuth types
├── package.json                    # Dependencies and scripts
├── next.config.ts                  # Next.js configuration
├── tsconfig.json                   # TypeScript configuration
├── tailwind.config.ts              # Tailwind CSS configuration
├── README.md                       # Project documentation (main, Russian)
├── README_RU.md                    # Full Russian version
├── README_EN.md                    # Full English version
├── LICENSE                         # License (bilingual)
└── .gitignore                      # Git exclusions
```

## Roadmap

- [x] SQL editor with syntax highlighting and autocompletion
- [x] Training tasks with automatic verification
- [x] Free mode for arbitrary queries
- [x] SQLite and PostgreSQL support
- [x] Query history with persistence
- [x] Export/Import results (CSV, JSON)
- [x] Progress system with streak tracking
- [x] Task recommendations
- [x] User authentication
- [x] Profile with achievements and statistics
- [x] Leaderboard
- [x] Themes (light/dark)
- [x] SQL operators reference
- [x] Result visualization (charts)
- [ ] Full multilingual support (EN/RU)
- [ ] Additional training modules
- [ ] LMS integration
- [ ] PWA manifest for offline mode

---

## Author

**Dupley Maxim Igorevich**

This project is the intellectual property of Dupley Maxim Igorevich. All rights to the source code, design, content, and educational materials belong to the author.

---

## License

This project is the intellectual property of Dupley Maxim Igorevich. Terms of use are described in the [LICENSE](./LICENSE) file.

---

<div align="center">

**SQL Trainer** — © 2026 Dupley Maxim Igorevich

</div>
