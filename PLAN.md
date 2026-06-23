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
- [ ] 8. Implement Redis-backed rate limiting for auth endpoints (replace in-memory)
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

1. **Redis-backed rate limiting for auth endpoints** — replace in-memory fallback with Redis for `/api/auth/login`, `/api/auth/register`, `/api/auth/forgot-password` to prevent brute-force attacks in production
2. [x] **Add health check endpoint for Redis** — extend `/api/health` to report Redis connection status, useful for monitoring and load balancer readiness probes
3. [x] **Add rate limit headers to all protected endpoints** — return `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers so clients can self-throttle
4. [x] **Web Vitals reporting** — add `web-vitals` package to track LCP, FID, CLS and send metrics to admin dashboard for performance monitoring
5. **E2E tests for admin CRUD** — Playwright scenarios for user management (ban/unban, role change, soft delete, bulk operations)
6. **E2E tests for teacher workflows** — Playwright scenarios for group creation, student invitations, deadline management
7. **E2E tests for password reset flow** — Playwright scenarios for forgot-password → email → reset → login cycle
8. [x] **API response type safety** — add Zod schemas and TypeScript inferred types for all API response payloads to eliminate `as any` casts in client code
9. **Bundle analysis automation** — add `@next/bundle-analyzer` with CI step to catch size regressions before merge
10. **Accessibility audit** — run `@axe-core/react` against all pages, fix critical WCAG violations (missing aria-labels, color contrast, keyboard navigation)
