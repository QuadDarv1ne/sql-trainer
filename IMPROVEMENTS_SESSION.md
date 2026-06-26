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

## Батч 2 — Навигация и экспорт (коммит 8b6724a)

| # | Улучшение | Файл |
|---|-----------|------|
| 6 | **Copy error** — кнопка копирования ошибки SQL-запроса | `src/components/results-table.tsx` |
| 7 | **JSON export** — экспорт результатов в JSON рядом с CSV | `src/components/results-table.tsx` |
| 8 | **Difficulty badge** — цветной badge сложности задачи в action bar | `src/components/action-bar.tsx` |
| 9 | **Prev/Next navigation** — кнопки навигации между задачами | `src/components/action-bar.tsx` |
| 10 | **Query counter** — счётчик выполненных запросов за сессию | `src/components/action-bar.tsx` |

## Батч 3 — Закладки и визуал (текущий)

| # | Улучшение | Файл |
|---|-----------|------|
| 11 | **Bookmark toggle** — кнопка закладки текущей задачи в action bar | `src/components/action-bar.tsx` |
| 12 | **Clear confirmation** — диалог подтверждения при очистке непустого редактора | `src/components/action-bar.tsx` |
| 13 | **Progress mini-bar** — мини-прогресс-бар по уровню сложности в сайдбаре | `src/components/sidebar.tsx` |

## Результаты проверки

| Проверка | Батч 1 | Батч 2 | Батч 3 |
|----------|--------|--------|--------|
| TypeScript | ✅ | ✅ | ✅ |
| ESLint | ✅ 0 | ✅ 0 | ✅ 0 |
| Тесты | ✅ 779/779 | ✅ 779/779 | ✅ 779/779 |

---

> **Автор:** MiMo Code Agent | **Дата:** 2026-06-26
