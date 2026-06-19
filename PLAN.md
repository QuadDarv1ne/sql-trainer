# SQL Trainer — Plan of 10 Quality Improvements

> Created: 2026-06-18 | Updated: 2026-06-19

## Plan

- [x] 1. Remove blanket `eslint-disable` from `db-users.ts`, fix all hidden warnings
- [x] 2. Split `db-users.ts` (10K+ lines) into focused modules under `src/lib/db/`
- [ ] 3. Split `i18n.ts` (327KB) into `src/locales/{ru,en}.json` with lazy loading
- [x] 4. Add `act()` wrappers to `student-dashboard.test.tsx` and `use-analytics-query.test.ts` to eliminate React warnings
- [ ] 5. Add unit tests for `db/` modules after split (target: +50 tests)
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
| 5 | Add db/ module tests | Pending | |
| 6 | CONTRIBUTING.md | Done | 2026-06-18 |
| 7 | Zod validation for API routes | Done | 2026-06-18 |
| 8 | Redis rate limiter integration | Pending | |
| 9 | OpenAPI docs | Done | 2026-06-18 |
| 10 | Multi-browser E2E | Done | 2026-06-18 |

## Remaining Items (Priority Order)

1. **Split `i18n.ts`** → convert to `src/locales/{ru,en}.json` with lazy loading
2. **Add unit tests for `db/` modules** → target +50 tests
3. **Redis rate limiter** → replace in-memory with `ioredis` for auth endpoints
4. **Extract analytics from `db-users.ts`** → move remaining ~8K lines of analytics into `db/analytics.ts`
