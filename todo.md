# SQL Trainer — Рекомендации по улучшению

> Сформированы на основе анализа кодовой базы v0.3.0 (2026-06-02)

---

## Критические (высокий приоритет)

### 1. Повысить тестовое покрытие
- **Текущее покрытие:** 5.48% statements, 3.06% branches
- **Цель:** минимум 60% statements, 50% branches
- **Что покрывать в первую очередь:**
  - API маршруты (sql-verify, auth, user-progress) — сейчас практически не тестируются
  - Компоненты аналитики админки (~40+ компонентов без тестов)
  - Хуки (`useAnalyticsQuery`, `useSqlExecution`, `useTheme`)
  - Zustand store slices — интеграционные тесты
  - DB adapters — edge cases (сложные SQL запросы, WINDOW FUNCTIONS, CTE)
- **Рекомендация:** добавить тесты для критических путей: auth flow, task verification, XP calculation

### 2. Безопасность: Production Rate Limiter
- **Проблема:** `lib/rate-limit.ts` — in-memory, не работает при масштабировании
- **Решение:** интеграция с Redis (Upstash / ioredis) для распределённого rate limiting
- **Дополнительно:** добавить rate limiting на API маршруты auth (login, register, reset-password)

### 3. SQL Adapters — regex-based parsing
- **Проблема:** PostgreSQL, ClickHouse, MySQL адаптеры используют regex замены, что ненадёжно для сложных запросов
- **Решение:** использовать полноценные SQL парсеры:
  - `node-sql-parser` для PostgreSQL/MySQL
  - AST-based подход вместо regex
- **Бонус:** добавить валидациюUnsupported функции не удалять молча, а возвращать понятную ошибку пользователю

### 4. `.env.example` файл отсутствует
- **Проблема:** переменные окружения описаны только в `env.ts`, нет шаблона для новых разработчиков
- **Решение:** создать `.env.example` с комментариями для каждой переменной
- **Содержимое:** `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, SMTP настройки, DBMS endpoints

---

## Важные (средний приоритет)

### 5. Рефакторинг `db-users.ts` (301KB)
- **Проблема:** файл слишком большой, ESLint настроен с relax rules для него
- **Решение:** разбить на модули:
  - `db-users/crud.ts` — создание, чтение, обновление, удаление
  - `db-users/auth.ts` — аутентификация, сессии
  - `db-users/progress.ts` — прогресс, XP, достижения
  - `db-users/admin.ts` — админские операции
  - `db-users/types.ts` — TypeScript интерфейсы

### 6. i18n.ts (314KB) — слишком большой файл локализации
- **Проблема:** один файл на все языки, сложно поддерживать
- **Решение:**
  - Разбить на отдельные JSON файлы: `locales/en.json`, `locales/ru.json`
  - Рассмотреть `next-intl` или `i18next` для proper i18n
  - Добавить lazy loading переводов

### 7. E2E тесты — только Chromium, 7 тестов
- **Проблема:** минимальное покрытие E2E, один браузер
- **Решение:**
  - Добавить Firefox и Webkit в Playwright config
  - Покрыть критические сценарии: регистрация → решение задачи → получение XP → leaderboard
  - Добавить тесты для teacher/admin панелей
  - Целевой минимум: 25+ E2E тестов

### 8. CONTRIBUTING.md и CHANGELOG.md отсутствуют
- **Решение — CONTRIBUTING.md:**
  - Как настроить dev environment
  - Git workflow (branch naming, commit conventions)
  - Как запустить тесты, линтер
  - Code style guidelines
  - Как добавить новую задачу/тему
- **Решение — CHANGELOG.md:**
  - Использовать Conventional Commits format
  - Сгенерировать из истории git коммитов
  - Автоматизировать через `auto-changelog` или `release-please`

### 9. API документация
- **Проблема:** 100+ API эндпоинтов без документации
- **Решение:**
  - Добавить OpenAPI/Swagger спецификацию
  - Использовать `next-openapi` или `tRPC` для типизированных API
  - Сгенерировать документацию через `scalar` или `swagger-ui`

### 10. CI/CD — запуск только для `dupleymi-aup/sql-trainer`
- **Проблема:** в `ci.yml` жёстко прописан репозиторий, форки не тестируются
- **Решение:** убрать проверку `github.repository` или сделать опциональной
- **Бонус:** добавить кэш для Bun зависимостей (`actions/cache`)

---

## Улучшения функциональности

### 11. Новые темы и задачи
- **Недостающие темы:**
  - Recursive CTE (WITH RECURSIVE)
  - FULL OUTER JOIN эмуляция
  - LATERAL joins
  - JSON/JSONB функции для PostgreSQL
  - Агрегатные функции: `FILTER`, `GROUPING SETS`, `ROLLUP`, `CUBE`
  - Transaction management (BEGIN, COMMIT, ROLLBACK)

### 12. Режим соревнования/турнира
- **Идея:**限时 SQL challenge — решить задачу за минимум попыток/времени
- **Реализация:**
  - Еженедельные турниры с leaderboard
  - Таймер на выполнение
  - Ограничение на подсказки
  - XP bonus за первое место

### 13. AI-powered подсказки
- **Идея:** вместо статических подсказок — генерация через LLM
- **Реализация:** интеграция с Azure OpenAI / другим LLM API
- **Формат:** 3 уровня — "направление", "структура запроса", "почти готовое решение"
- **Экономика:** кэшировать подсказки, rate limit на запросы

### 14. Визуализация схем БД
- **Идея:** интерактивный ERD (Entity Relationship Diagram)
- **Реализация:**
  - `react-flow` или `mermaid.js` для отрисовки
  - Автогенерация из schema definitions
  - Кликабельные таблицы → preview данных

### 15. Экспорт/импорт прогресса
- **Идея:** пользователи могут переносить прогресс между инстансами
- **Форматы:** JSON (полный), CSV (таблица результатов)
- **Сценарий:** преподаватель создаёт курс → экспортирует → студенты импортируют

### 16. Мобильная адаптация
- **Проблема:** SQL редактор и панели могут плохо работать на мобильных
- **Решение:**
  - Адаптивный layout для экранов < 768px
  - Touch-friendly элементы
  - Mobile-first breakpoints в Tailwind

### 17. WebSocket для real-time
- **Идея:** real-time leaderboard, live collaboration
- **Реализация:** Server-Sent Events (SSE) проще WebSocket, достаточно для leaderboard
- **Сценарий:** пользователь видит, как другие поднимаются в рейтинге в реальном времени

### 18. Интеграция с реальными БД
- **Текущее состояние:** все не-SQLite диалекты эмулируются через SQLite
- **Идея:** подключить реальные PostgreSQL/ClickHouse/MySQL для production
- **Реализация:**
  - Docker Compose с PostgreSQL и MySQL сервисами (уже есть заготовка)
  - Connection pooling
  - Sandbox для выполнения пользовательских запросов (изоляция)

---

## Инфраструктурные улучшения

### 19. Monitoring & Observability
- **Добавить:**
  - Structured logging (JSON format) — частично есть через `logger.ts`
  - Health check endpoints (`/api/health`)
  - Metrics: response times, error rates, active users
  - Sentry или аналог для error tracking

### 20. Database migration система
- **Проблема:** SQLite users.db без миграций
- **Решение:** `drizzle-kit` или `kysely` для type-safe миграций
- **Бонус:** seed скрипт для тестовых данных

### 21. PWA Offline режим
- **Текущее состояние:** есть service worker и offline.html
- **Улучшение:**
  - Кэшировать задачи и schema для offline работы
  - LocalStorage/IndexedDB для сохранения запросов offline
  - Sync при восстановлении соединения

### 22. ESLint — ужесточить правила
- **Проблема:** многие правила отключены (`no-irregular-whitespace`, `no-fallthrough`, `no-unreachable`)
- **Решение:** постепенно включать правила обратно после рефакторинга
- **Добавить:** `@typescript-eslint/strict`, `unicorn/recommended`

---

## Мелкие улучшения (low effort, high value)

### 23. Добавить `.dockerignore`
- Исключить `node_modules`, `.next`, `coverage`, `data/` из Docker build

### 24. Pre-commit hooks
- `lint-staged` + `husky` — запускать ESLint и typecheck перед коммитом

### 25. Bundle analysis
- `@next/bundle-analyzer` — выявить тяжёлые зависимости
- Возможная оптимизация: tree-shaking для `node-sql-parser`, CodeMirror

### 26. Accessibility (a11y)
- Проверить через `axe-core` / Lighthouse
- Добавить ARIA labels, keyboard navigation, focus management

### 27. SEO и мета-теги
- Open Graph для соцсетей
- Sitemap.xml
- `robots.txt`

---

## Roadmap приоризация

| Приоритет | Пункты | Ожидаемый эффект |
|-----------|--------|-----------------|
| **P0** | 1, 2, 4 | Стабильность, безопасность, onboarding |
| **P1** | 3, 5, 6, 7, 8 | Качество кода, maintainability |
| **P2** | 9, 10, 11, 14, 18 | Функциональность, DX |
| **P3** | 12, 13, 15, 16, 17 | User experience, engagement |
| **P4** | 19–27 | Infrastructure, polish |
