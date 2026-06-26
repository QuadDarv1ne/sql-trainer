# План улучшений SQL Trainer — Сессия 2026-06-26

> **Версия проекта:** v0.3.0 | **Дата:** 2026-06-26

---

## Батч 1 — Горячие клавиши и UX (коммит 5c7f98d)

| # | Улучшение | Файл |
|---|-----------|------|
| 1 | Ctrl+B — toggle боковой панели | `page.tsx` |
| 2 | Copy SQL — копирование решения | `task-panel.tsx` |
| 3 | Row count badge — строки рядом со временем | `results-table.tsx` |
| 4 | Ctrl+Shift+D — переключение темы | `page.tsx` |
| 5 | Shortcuts help — обновлена справка | `shortcuts-help.tsx` |

## Батч 2 — Навигация и экспорт (коммит 8b6724a)

| # | Улучшение | Файл |
|---|-----------|------|
| 6 | Copy error — копирование ошибки SQL | `results-table.tsx` |
| 7 | JSON export — экспорт в JSON | `results-table.tsx` |
| 8 | Difficulty badge — цветной badge сложности | `action-bar.tsx` |
| 9 | Prev/Next nav — навигация между задачами | `action-bar.tsx` |
| 10 | Query counter — счётчик запросов | `action-bar.tsx` |

## Батч 3 — Закладки и визуал (коммит d8cf048)

| # | Улучшение | Файл |
|---|-----------|------|
| 11 | Bookmark toggle — закладка задачи | `action-bar.tsx` |
| 12 | Clear confirmation — подтверждение очистки | `action-bar.tsx` |
| 13 | Progress mini-bar — мини-прогресс по уровням | `sidebar.tsx` |

## Батч 4 — Уведомления и статус (текущий)

| # | Улучшение | Файл |
|---|-----------|------|
| 14 | Clear history — кнопка очистки истории | `action-bar.tsx` |
| 15 | Completion toast — XP в уведомлении | `use-query-executor.ts` |
| 16 | Cols badge — количество колонок в заголовке | `results-table.tsx` |

## Результаты проверки

| Проверка | Батч 1 | Батч 2 | Батч 3 | Батч 4 |
|----------|--------|--------|--------|--------|
| TypeScript | ✅ | ✅ | ✅ | ✅ |
| ESLint | ✅ 0 | ✅ 0 | ✅ 0 | ✅ 0 |
| Тесты | 779/779 | 779/779 | 779/779 | 779/779 |

---

> **Автор:** MiMo Code Agent | **Дата:** 2026-06-26
