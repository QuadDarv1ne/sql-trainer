# План улучшений SQL Trainer — Сессия 2026-06-26

> **Версия проекта:** v0.3.0 | **Дата:** 2026-06-26

---

## Батч 1 — Горячие клавиши и UX (коммит 5c7f98d)

| # | Улучшение | Файл |
|---|-----------|------|
| 1 | **Ctrl+B** — toggle боковой панели | `src/app/(main)/app/page.tsx` |
| 2 | **Copy SQL** — копирование решения в буфер обмена | `src/components/task-panel.tsx` |
| 3 | **Row count badge** — количество строк рядом со временем | `src/components/results-table.tsx` |
| 4 | **Ctrl+Shift+D** — циклическое переключение темы | `src/app/(main)/app/page.tsx` |
| 5 | **Shortcuts help** — обновлена справка по горячим клавишам | `src/components/shortcuts-help.tsx` |

## Батч 2 — Навигация и экспорт (текущий)

| # | Улучшение | Файл |
|---|-----------|------|
| 1 | **Copy error** — кнопка копирования ошибки SQL-запроса | `src/components/results-table.tsx` |
| 2 | **JSON export** — экспорт результатов в JSON рядом с CSV | `src/components/results-table.tsx` |
| 3 | **Difficulty badge** — цветной badge сложности задачи в action bar | `src/components/action-bar.tsx` |
| 4 | **Prev/Next navigation** — кнопки навигации между задачами | `src/components/action-bar.tsx` |
| 5 | **Query counter** — счётчик выполненных запросов за сессию | `src/components/action-bar.tsx` |

## Результаты проверки

| Проверка | Батч 1 | Батч 2 |
|----------|--------|--------|
| TypeScript | ✅ | ✅ |
| ESLint | ✅ 0 ошибок | ✅ 0 ошибок |
| Тесты | ✅ 779/779 | ✅ 779/779 |

---

> **Автор:** MiMo Code Agent | **Дата:** 2026-06-26
