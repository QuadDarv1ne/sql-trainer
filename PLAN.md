# SQL Trainer — Plan of 10 Quality Improvements

> Created: 2026-06-19 | Updated: 2026-06-23

## Phase 1 — Completed

- [x] 1. Remove blanket `eslint-disable` from `db-users.ts`, fix all hidden warnings
- [x] 2. Split `db-users.ts` (10K+ lines) into focused modules under `src/lib/db/`
- [x] 3. Split `i18n.ts` (327KB) into `src/locales/{ru,en,zh}.json` with modular imports
- [x] 4. Add `act()` wrappers to `student-dashboard.test.tsx` and `use-analytics-query.test.ts` to eliminate React warnings
- [x] 5. Add unit tests for `db/` modules after split (+37 tests for connection, users, admin, progress)
- [x] 6. Create `CONTRIBUTING.md` with setup, code style, and PR guidelines
- [x] 7. Add Zod validation to all unprotected API routes (currently ~100+ endpoints)
- [x] 8. Implement Redis-backed rate limiting for auth endpoints (replace in-memory)
- [x] 9. Add OpenAPI/Swagger docs for core API endpoints (`/api/sql/verify`, `/api/user/progress`)
- [x] 10. Add Firefox + WebKit to Playwright config, write 3 new E2E scenarios

## Additional Improvements

- [x] CSRF protection added to `withRoleAuth` wrapper — covers ~30 admin/teacher endpoints
- [x] `sqlVerifySchema.dbType` changed from `z.string()` to `z.enum(VALID_DB_TYPES)`
- [x] Removed `userId` leak from `auth/verify-reset` response
- [x] Fix `$_id` group key exclusion bug in `mongodb-engine.ts`
- [x] Replace `||` with `??` in `t()` fallback chain
- [x] Remove unused `getPlural` stub
- [x] Add edge case test: whitespace-only SQL
- [x] **CRITICAL**: Rename `proxy.ts` → `middleware.ts` — security headers + CSRF were not active
- [x] Remove unused dependencies: `mongodb`, `@tanstack/react-table`
- [x] Remove stale `/api/deadlines` CSRF prefix
- [x] Remove unused `db/index.ts` barrel file (dead re-export of `db-users.ts`)
- [x] Fix flaky SQLite DB tests — add `crypto.randomUUID()` suffix to test DB filenames
- [x] Fix Redis `getStatus` to use window-based keys instead of O(N) `KEYS` pattern scan
- [x] Fix unsafe `Number()` coercion in teacher API routes (`churn-prediction`, `engagement`)
- [x] Remove `confirmAction` event-listener memory leak in `page.tsx`
- [x] Add `isHealthy()` to `RateLimiter` interface + Redis status in `/api/health`

## Phase 2 — Next 10 Quality Improvements

1. [x] **Redis-backed rate limiting for auth endpoints** — replace in-memory fallback with Redis for `/api/auth/login`, `/api/auth/register`, `/api/auth/forgot-password` to prevent brute-force attacks in production
2. [x] **Add health check endpoint for Redis** — extend `/api/health` to report Redis connection status, useful for monitoring and load balancer readiness probes
3. [x] **Add rate limit headers to all protected endpoints** — return `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers so clients can self-throttle
4. [x] **Web Vitals reporting** — add `web-vitals` package to track LCP, FID, CLS and send metrics to admin dashboard for performance monitoring
5. [x] **E2E tests for admin CRUD** — Playwright scenarios for user management (ban/unban, role change, soft delete, bulk operations)
6. [x] **E2E tests for teacher workflows** — Playwright scenarios for group creation, student invitations, deadline management
7. [x] **E2E tests for password reset flow** — Playwright scenarios for forgot-password → email → reset → login cycle
8. [x] **API response type safety** — add Zod schemas and TypeScript inferred types for all API response payloads to eliminate `as any` casts in client code
9. [x] **Bundle analysis automation** — add `@next/bundle-analyzer` with CI step to catch size regressions before merge
10. [x] **Accessibility audit** — run `@axe-core/react` against all pages, fix critical WCAG violations (missing aria-labels, color contrast, keyboard navigation)

## Phase 3 — Next 10 Quality Improvements

1. [x] **Add loading.tsx for auth routes** — skeleton loaders for /login, /register, /forgot-password to prevent blank screens during navigation
2. [x] **Error boundary for all API routes** — centralized error handler with structured JSON responses and correlation IDs for debugging
3. [x] **Response time logging for slow queries** — log SQL execution time > 1s with query summary in production
4. **Input sanitization audit** — review all user-facing inputs for XSS, ensure consistent escaping across components
5. **Database connection pool monitoring** — add metrics for active/idle connections, connection wait time, and pool exhaustion events
6. **Image optimization audit** — ensure all images use next/image with proper sizes, formats (WebP/AVIF), and lazy loading
7. **Dead code elimination** — run `ts-prune` or similar to find and remove unused exports across the codebase
8. **CSP nonce for inline scripts** — implement dynamic nonce generation for Content Security Policy to allow necessary inline scripts
9. **API response compression** — enable gzip/brotli compression for API responses to reduce payload sizes
10. **Automated dependency updates** — configure Renovate or Dependabot for automated security patches

## Phase 4 — Next 10 Quality Improvements

1. [x] **Extract SQL safety into shared module** — move `validateTrainingSql` from `route.ts` to `src/lib/sql-safety.ts`, secure `/api/sql/explain` endpoint (was missing DDL/DML validation)
2. [x] **Fix duplicate VALID_DB_TYPES** — remove local `VALID_DB_TYPES` from `explain/route.ts`, use shared export from `sql-schema.ts` (was silently falling back to sqlite for clickhouse)
3. [x] **Consolidate manual auth routes** — rewrite `user/delete`, `user/change-password`, `user/change-email`, `push/subscribe`, `push/unsubscribe` to use `withUserAuthStrict` wrapper (removes CSRF gap + duplicated boilerplate, -73 lines)
4. [x] **Add CSRF validation to `/api/auth/register`** — added `validateCsrfTokenEdge` + `csrfErrorResponse` to register endpoint
5. [x] **Add rate-limit headers to manual routes** — now injected by `withRoleAuth` wrapper on all routes including `withUserAuthStrict`
6. [x] **Type-safe Zustand store** — already fixed by upstream (e7c2aec) with proper `StoreApi<CombinedState>` types
7. [x] **Standardize API response envelope** — added `success: false` to all error responses across 22 admin/teacher/user/push/web-vitals routes; all routes now return `{ success: boolean, error?: string }` consistently
8. [x] **Consolidate rate-limit window constants** — extracted 17 magic numbers into `RATE_LIMIT_WINDOWS` constants in `src/lib/rate-limit.ts`
9. [x] **Replace manual `as UserRole` casts** — simplified Zod-validated role narrowing in `auth/register` (removed redundant `ALLOWED_SELF_ROLES.includes()`)
10. [x] **Audit push subscription endpoints for auth consistency** — now use `withUserAuthStrict` from `@/lib/auth-internal` (was `@/lib/auth` Edge-only)

## Additional Fixes (Phase 4 continued)

- [x] Fix 26 broken tests — add missing `RATE_LIMIT_WINDOWS` to mocks in `sql-verify.test.ts`, `role-registration.test.ts`, `api-routes-integration.test.ts`; add CSRF + sanitization mocks for register route tests

## Phase 5 — Next 10 Quality Improvements

1. [x] **Standardize API response envelope** — completed in Phase 4 #7 (22 routes fixed)
2. [x] **Add success field to remaining API routes** — api-auth, api-error, web-vitals, scheduled-export
3. [x] **Fix startPracticeMode** — return value, achievement lookup, resetTaskProgress stale data, analytics query guard
4. [x] **Add `parseAndValidate` to remaining manual routes** — replaced manual `request.json()` + `validateBody` two-step with single `parseAndValidate(req, schema)` call in 22 routes
5. [x] **Input sanitization audit** — verified no XSS vectors (no dangerouslySetInnerHTML, no innerHTML). All user inputs sanitized via Zod + api-sanitize.ts
6. [x] **Dead code elimination** — removed `checkDbAccessibility` (db-monitor), `getStudentCompletedTasks` (db/analytics). Created shared `date-utils.ts` deduplicating 3 formatDate functions
7. [x] **API response compression** — already enabled: `compress: true` in next.config.ts
8. [x] **Automated dependency updates** — Dependabot already configured with grouped updates + Docker support
9. [x] **Database connection pool monitoring** — already implemented: `db-monitor.ts` tracks queries, slow queries, errors, P95 timing, Redis metrics. Exposed via `/api/health`
10. [x] **Image optimization audit** — verified: zero raw `<img>` tags, all images use next/image or are static assets
