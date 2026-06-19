# SQL Trainer — Plan of 10 Quality Improvements

> Created: 2026-06-18 | Updated: 2026-06-19 (revised)

## Plan

- [x] 1. Remove blanket `eslint-disable` from `db-users.ts`, fix all hidden warnings
- [x] 2. Split `db-users.ts` (10K+ lines) into focused modules under `src/lib/db/`
- [ ] 3. Split `i18n.ts` (327KB) into `src/locales/{ru,en}.json` with lazy loading
- [x] 4. Add `act()` wrappers to `student-dashboard.test.tsx` and `use-analytics-query.test.ts` to eliminate React warnings
- [x] 5. Add unit tests for `db/` modules after split (+37 tests for connection, users, admin, progress)
- [x] 6. Create `CONTRIBUTING.md` with setup, code style, and PR guidelines
- [x] 7. Add Zod validation to all unprotected API routes (currently ~100+ endpoints)
- [ ] 8. Implement Redis-backed rate limiting for auth endpoints (replace in-memory)
- [x] 9. Add OpenAPI/Swagger docs for core API endpoints (`/api/sql/verify`, `/api/user/progress`)
- [x] 10. Add Firefox + WebKit to Playwright config, write 3 new E2E scenarios

## Security Hardening (2026-06-19)

- [x] CSRF protection added to `withRoleAuth` wrapper — covers ~30 admin/teacher endpoints
- [x] `sqlVerifySchema.dbType` changed from `z.string()` to `z.enum(VALID_DB_TYPES)`
- [x] Removed `userId` leak from `auth/verify-reset` response

## Progress

| # | Task | Status | Date |
|---|------|--------|------|
| 1 | Remove blanket eslint-disable | Done | 2026-06-18 |
| 2 | Split db-users.ts | Done | 2026-06-19 |
| 3 | Split i18n.ts | Pending | |
| 4 | Fix React act() warnings in tests | Done | 2026-06-18 |
| 5 | Add db/ module tests | Done | 2026-06-19 |
| 6 | CONTRIBUTING.md | Done | 2026-06-18 |
| 7 | Zod validation for API routes | Done | 2026-06-18 |
| 8 | Redis rate limiter integration | Pending | |
| 9 | OpenAPI docs | Done | 2026-06-18 |
| 10 | Multi-browser E2E | Done | 2026-06-18 |

## Batch 2 — Code Quality Pass (2026-06-19)

- [x] 11. Fix `$_id` group key exclusion bug in `mongodb-engine.ts` (line 260)
- [x] 12. Fix misleading test description in `utils.test.ts` — "treats negatives as positive" (actually modulo preserves sign)
- [x] 13. Replace `||` with `??` in `t()` fallback chain — prevents falsy-value skipping
- [x] 14. Fix misleading comment in `getPlural()` — said "return the key" but returned translation
- [x] 15. Remove unused `getPlural` stub (dead code) + its test
- [x] 16. Add edge case test: whitespace-only string passes `z.string().min(1)` in SQL schema

## Remaining Items (Priority Order)

1. **Split `i18n.ts`** → convert 327KB file to `src/locales/{ru,en}.json` with lazy loading
2. **Redis rate limiter** → replace in-memory with `ioredis` for auth endpoints
3. **Security headers** → add Content-Security-Policy, X-Frame-Options via middleware
4. **TypeScript strictness** → enable `strict: true` in tsconfig and fix resulting errors
