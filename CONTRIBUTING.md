# Contributing to SQL Trainer

Thank you for your interest in contributing! This guide covers setup, conventions, and workflow.

## Prerequisites

- Node.js 18+
- npm 9+
- Git

## Setup

```bash
# Clone and install
git clone https://github.com/dupleymi-aup/sql-trainer.git
cd sql-trainer
npm install

# Create environment file
cp .env.example .env.local
# Edit .env.local — set AUTH_SECRET and AUTH_URL at minimum

# Start dev server
npm run dev

# In another terminal — run tests
npm test
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (auto-selects port) |
| `npm run build` | Production build |
| `npm run lint` | ESLint check |
| `npm run typecheck` | TypeScript type check |
| `npm test` | Run unit/integration tests (Vitest) |
| `npm run test:coverage` | Tests with coverage report |
| `npm run test:e2e` | Run E2E tests (Playwright) |

## Code Style

### TypeScript

- **Strict mode** is enabled — no implicit `any`
- Use `interface` for object shapes, `type` for unions/intersections
- Path alias: `@/` maps to `src/` (e.g., `import { t } from '@/lib/i18n'`)
- Unused variables: prefix with `_` (e.g., `function handler(_req, res)`)
- No `any` in production code (`@typescript-eslint/no-explicit-any: error`). Tests allow `any`

### Formatting

Managed by **Prettier** (auto-runs on commit via lint-staged):

- 2-space indent, no tabs
- Single quotes, trailing commas
- 120 char print width
- LF line endings

### ESLint

Flat config at `eslint.config.mjs`. Key rules:

- `prefer-const` — always use `const` when variable is not reassigned
- `no-console` — use `logger` from `@/lib/logger` instead
- `react-hooks/exhaustive-deps` — keep dependency arrays accurate
- Test files have relaxed rules (any allowed, unused vars are warnings)

### Components

- React 19 + Next.js 16 (App Router)
- Client components: add `'use client'` directive at top
- UI primitives from **shadcn/ui** (in `src/components/ui/`)
- State management: **Zustand** (`src/lib/store/`)
- Styling: **Tailwind CSS 4** — use utility classes, avoid inline styles

### API Routes

- Located in `src/app/api/` following Next.js App Router conventions
- Validate request bodies with **Zod** schemas (see `src/lib/validation.ts`)
- Use `withUserAuth` / `withAdminAuth` wrappers for auth (see `src/lib/api-auth.ts`)
- Log errors via `logger` from `@/lib/logger` — never `console.error`

### Database

- User data: SQLite via `better-sqlite3` (`src/lib/db-users.ts`, modular `src/lib/db/`)
- Training data: in-memory SQLite (`src/lib/sql-engine.ts`)
- Schema creation is handled at startup — no manual migrations yet

### Shared Utilities

- `src/lib/password-strength.ts` — password strength evaluation (used by auth forms and profile)
- `src/lib/validation.ts` — Zod-based request body validation helpers
- `src/lib/api-auth.ts` — auth wrappers (`withAdminAuth`, `withUserAuth`, `withTeacherAuth`)
- `src/lib/api-error.ts` — centralized API error responses with correlation IDs

## Git Workflow

### Branches

- `main` — stable, production-ready
- Feature branches: `feat/description` or `fix/description`

### Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add Redis rate limiter for auth endpoints
fix: prevent SQL injection in query adapter
docs: update CONTRIBUTING.md
chore: upgrade dependencies
test: add integration tests for /api/user/progress
```

### Pre-commit Hooks

**Husky** + **lint-staged** run automatically on `git commit`:

- `*.{ts,tsx,js,jsx,mjs,cjs}` → ESLint fix + Prettier
- `*.{json,css,md,yaml,yml}` → Prettier

If the hook fails, fix the issues before committing. Never use `--no-verify`.

## Adding a New SQL Topic

1. Create task definitions in `src/lib/tasks/` (see existing files for format)
2. Each task needs: `id`, `title`, `description`, `schema`, `sampleSolution`, `verificationQuery`, `hints`
3. Register the task in `TRAINING_TASKS` array in `src/lib/training-tasks.ts`
4. Add tests in `src/__tests__/training-tasks.test.ts`

## Adding a New API Route

1. Create route file in `src/app/api/<path>/route.ts`
2. Define a Zod schema for the request body
3. Use `withUserAuth` or `withAdminAuth` for authentication
4. Add tests in `src/__tests__/`

## Adding a New Locale

1. Add translations to `src/lib/i18n.ts` (both `en` and `ru` blocks)
2. Ensure all keys exist in both locales
3. Run `node scripts/check-i18n.mjs` to verify parity

## Testing

- **Unit tests**: `src/__tests__/*.test.ts` — test individual functions
- **Component tests**: `src/__tests__/*.test.tsx` — use `@testing-library/react`
- **E2E tests**: `e2e/` — use Playwright

Run specific tests:

```bash
npx vitest run src/__tests__/store.test.ts       # single file
npx vitest run --reporter=verbose store           # by name pattern
```

## Project Structure

```
src/
├── app/              # Next.js App Router pages and API routes
├── components/       # React components (ui/, student/, teacher/, admin/)
├── hooks/            # Custom React hooks
├── lib/              # Core logic (db, engine, store, utils)
├── types/            # TypeScript type definitions
└── __tests__/        # Test files
scripts/              # Build/dev helper scripts
e2e/                  # Playwright E2E tests
data/                 # SQLite database files (gitignored)
```

## Questions?

Open an issue or reach out to the maintainer.
