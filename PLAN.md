# SQL Trainer — Plan of 10 Quality Improvements

> Created: 2026-06-19 | Updated: 2026-06-22

## Plan

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

## Next 10 — Phase 2 Roadmap

1. **Enable TypeScript `strict: true`** — already enabled in tsconfig ✅
2. ~~**Migrate middleware.ts → proxy**~~ ✅ Done — renamed file + updated all references, deprecation warning resolved
3. ~~**Fix flaky db-progress test**~~ ✅ Done — use `.some()` instead of index-based assertion
4. ~~**Add loading.tsx boundaries**~~ ✅ Done — skeleton loaders for /app, /dashboard, /admin, /teacher, /profile
5. ~~**Fix flaky SQLite timeout tests**~~ ✅ Done — increased timeout to 15s for first-run DB initialization tests
6. ~~**Add integration tests for API routes**~~ ✅ Done — tests for /api/sql/verify and /api/auth/register (6 new tests)
7. **Bundle size audit** — analyze with `next build --analyze`, lazy-load heavy components (recharts, codemirror)
8. **Automate i18n key sync** — script to diff keys across ru/en/zh, detect missing or stale translations
9. **Performance monitoring** — add Web Vitals reporting to admin dashboard
10. **E2E coverage expansion** — add tests for admin CRUD, teacher workflows, password reset flow

## Remaining (Priority Order)

1. ~~**Split `i18n.ts`** → convert 327KB file to `src/locales/{ru,en,zh}.json` with modular imports~~ ✅ Done
2. **TypeScript strictness** → enable `strict: true` in tsconfig and fix resulting errors
3. ~~**Migrate middleware.ts → proxy**~~ ✅ Done
