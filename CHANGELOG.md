# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Learning Path component for students with visual progression tracking
- Group management for teachers with student enrollment and CSV export
- Admin analytics dashboard with system metrics, activity tracking, and audit logs
- Distributed rate limiter with Redis support and in-memory fallback
- `node-sql-parser` integration for SQL AST parsing
- RBAC features with role-based access control
- User ban/restore functionality with audit trail
- Skill gap analysis for students
- Push notification subscription API
- Teacher time estimates endpoint
- Multi-browser E2E tests (Chromium, Firefox, WebKit)
- Dependabot configuration with grouped updates
- `.env.example` with comprehensive documentation
- `CONTRIBUTING.md` for contributors
- `.dockerignore` for faster Docker builds

### Changed
- Upgraded to Next.js 16, React 19, Tailwind CSS 4
- Modularized database layer (`src/lib/db/`)
- Modularized Zustand store slices
- Enhanced CSP headers in Next.js config
- Improved ESLint configuration with strict rules
- CI/CD: added multi-browser E2E testing, bundle analyzer support

### Fixed
- Turbopack NFT tracing for `path.join` in database modules
- `act()` warnings in React Testing Library tests
- Rate limiting on auth endpoints (register, login, password reset)
- SQL injection prevention in training mode

## [0.3.0] - 2026-06-03

### Added
- Learning Path component (`src/components/student/learning-path.tsx`)
- Group management for teachers (`src/components/teacher/group-management.tsx`)
- Admin analytics dashboard (`src/components/admin/admin-analytics.tsx`)
- Distributed rate limiter (`src/lib/rate-limiter-distributed.ts`)
- SQL AST parser (`src/lib/sql-ast-parser.ts`)
- MongoDB engine support (`src/lib/mongodb-engine.ts`)
- ClickHouse adapter (`src/lib/clickhouse-adapter.ts`)
- MySQL adapter (`src/lib/mysql-adapter.ts`)
- PostgreSQL adapter (`src/lib/postgresql-adapter.ts`)
- Progressive hints system (`src/lib/progressive-hints.ts`)
- Concept engine for intelligent task recommendations (`src/lib/concept-engine.ts`)
- Email notification system (`src/lib/email.ts`)
- Push notification support with VAPID
- ER diagram component (`src/components/er-diagram.tsx`)
- Contextual tips component (`src/components/contextual-tips.tsx`)
- Practice mode dialog (`src/components/practice-mode-dialog.tsx`)
- SQL templates component (`src/components/sql-templates.tsx`)
- SQL glossary (`src/components/sql-glossary.tsx`)
- Timer display with countdown (`src/components/timer-display.tsx`)
- Onboarding tour (`src/components/onboarding-tour.tsx`)
- Welcome panel (`src/components/welcome-panel.tsx`)
- PWA install prompt (`src/components/pwa-install-prompt.tsx`)
- Query history component (`src/components/query-history.tsx`)
- Saved queries component (`src/components/saved-queries.tsx`)
- Export/import dialog (`src/components/export-import-dialog.tsx`)
- Shortcuts help (`src/components/shortcuts-help.tsx`)
- Web Vitals tracking (`src/components/web-vitals.tsx`)

### API Routes
- `/api/user/achievements` — User achievements API
- `/api/user/skill-gap` — Skill gap analysis
- `/api/user/recommendations` — Task recommendations
- `/api/user/reminders` — Reminder management
- `/api/teacher/analytics` — Teacher analytics
- `/api/teacher/churn-prediction` — Student churn prediction
- `/api/teacher/cohort` — Cohort analysis
- `/api/teacher/funnel` — Conversion funnel
- `/api/teacher/growth` — Growth metrics
- `/api/teacher/mastery` — Mastery tracking
- `/api/admin/analytics/*` — Extended admin analytics endpoints
- `/api/admin/audit` — Audit log management
- `/api/admin/deadlines` — Deadline management
- `/api/admin/system` — System health and metrics

### Tests
- 755 tests across 48 test files
- Improved coverage to ~60%+ statements
- New test files: `sql-verify.test.ts`, `user-progress.test.ts`, `validation.test.ts`, `rate-limiter-distributed.test.ts`

## [0.2.0] - 2026-05-15

### Added
- NextAuth.js v5 authentication with JWT
- Role-based access control (Student, Teacher, Admin)
- Gamification: XP, levels, streaks, achievements
- Multi-language support (Russian, English, Chinese)
- PWA support with offline mode
- Dark/light theme with system sync
- Docker support with docker-compose
- GitHub Actions CI/CD pipeline
- ESLint + Prettier + Husky pre-commit hooks

## [0.1.0] - 2026-04-01

### Added
- Initial SQL training platform
- SQLite-based user management
- SQL editor with CodeMirror
- Task system with 20 SQL topics
- Result visualization with charts
- Database schema viewer
- Query explanation tool
- Basic admin dashboard

---

For a detailed list of changes, see the [git commit history](https://github.com/dupleymi-aup/sql-trainer/commits/main).
