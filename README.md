<div align="center">

# SQL Trainer

### Интерактивная платформа для изучения и практики SQL

**SQL Trainer — Interactive Platform for SQL Learning and Practice**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-new--york-black)](https://ui.shadcn.com/)
[![CodeMirror](https://img.shields.io/badge/CodeMirror-6-purple)](https://codemirror.net/)
[![Recharts](https://img.shields.io/badge/Recharts-2-ff7300)](https://recharts.org/)
[![SQLite](https://img.shields.io/badge/SQLite-3-003b57?logo=sqlite)](https://www.sqlite.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](./LICENSE)

---

**Автор / Author:** Дуплей Максим Игоревич / Dupley Maxim Igorevich

**Интеллектуальная собственность / Intellectual Property:** Дуплей Максим Игоревич / Dupley Maxim Igorevich

</div>

---

## Интерфейс

<table>
  <tr>
    <td align="center"><a href="img/Главная страница.png"><img src="img/Главная страница.png" width="400" alt="Главная страница"/></a><br/><sub>Главная страница</sub></td>
    <td align="center"><a href="img/Задания.png"><img src="img/Задания.png" width="400" alt="Задания"/></a><br/><sub>Режим заданий</sub></td>
  </tr>
  <tr>
    <td align="center"><a href="img/Горячие клавиши.png"><img src="img/Горячие клавиши.png" width="400" alt="Горячие клавиши"/></a><br/><sub>Горячие клавиши</sub></td>
    <td align="center"><a href="img/Свободный режим.png"><img src="img/Свободный режим.png" width="400" alt="Свободный режим"/></a><br/><sub>Свободный режим</sub></td>
  </tr>
  <tr>
    <td align="center"><a href="img/Несколько тем оформления и шаблоны.png"><img src="img/Несколько тем оформления и шаблоны.png" width="400" alt="Темы оформления"/></a><br/><sub>Темы и шаблоны</sub></td>
    <td align="center"><a href="img/Экспорт - импорт.png"><img src="img/Экспорт - импорт.png" width="400" alt="Экспорт и импорт"/></a><br/><sub>Экспорт / Импорт</sub></td>
  </tr>
</table>

---

## 🇷🇺 Описание на русском языке

### О проекте

**SQL Trainer** — это комплексная веб-платформа для интерактивного изучения SQL и работы с базами данных. Проект разработан как полноценное образовательное приложение, объединяющее обучающие задания с автоматической проверкой, свободный режим для произвольных запросов, систему прогресса с геймификацией, аутентификацию пользователей и поддержку нескольких СУБД (SQLite и PostgreSQL). Платформа предназначена для студентов, разработчиков и всех, кто хочет освоить SQL через практические упражнения.

### Ключевые возможности

- **Обучающие задания** — практические задачи по SQL с автоматической проверкой результатов
- **Свободный режим** — пишите любые запросы и исследуйте структуру базы данных
- **SQL-редактор** — подсветка синтаксиса, автодополнение, поддержка горячих клавиш на базе CodeMirror 6
- **Поддержка SQLite и PostgreSQL** — работа с разными СУБД, переключение между источниками данных
- **История запросов** — сохранение и быстрый доступ к предыдущим запросам
- **Экспорт/Импорт** — выгрузка результатов в CSV, JSON и других форматах
- **Система прогресса** — отслеживание серии занятий (streak), статистика и аналитика
- **Рекомендации** — персонализированные предложения заданий для улучшения навыков
- **Темы оформления** — светлая, темная и другие темы с автоматическим определением
- **Аутентификация** — регистрация, вход, восстановление пароля, профиль пользователя
- **Таблица лидеров** — соревнование с другими пользователями по прогрессу
- **Система достижений** — бейджи за различные достижения в обучении
- **Справка по SQL** — встроенный справочник по операторам и функциям SQL
- **Визуализация схем** — просмотр структуры таблиц и связей между ними
- **Графики результатов** — визуализация результатов запросов через Recharts

### Обучающие темы

| # | Тема | Категория | Описание |
|---|------|-----------|----------|
| 1 | **SELECT** | Основы | Базовый выбор данных из таблиц, фильтрация с WHERE |
| 2 | **WHERE** | Основы | Условия фильтрации: сравнение, BETWEEN, IN, LIKE |
| 3 | **ORDER BY** | Основы | Сортировка результатов по одному или нескольким столбцам |
| 4 | **LIMIT / OFFSET** | Основы | Ограничение количества возвращаемых строк, постраничная навигация |
| 5 | **JOIN (INNER)** | Соединения | Внутреннее соединение таблиц по ключу |
| 6 | **LEFT JOIN** | Соединения | Левое внешнее соединение с сохранением всех строк левой таблицы |
| 7 | **RIGHT JOIN** | Соединения | Правое внешнее соединение с сохранением всех строк правой таблицы |
| 8 | **FULL JOIN** | Соединения | Полное внешнее соединение с сохранением всех строк обеих таблиц |
| 9 | **CROSS JOIN** | Соединения | Декартово произведение строк двух таблиц |
| 10 | **GROUP BY** | Агрегация | Группировка строк с агрегатными функциями: COUNT, SUM, AVG, MIN, MAX |
| 11 | **HAVING** | Агрегация | Фильтрация групп после агрегации |
| 12 | **UNION** | Множества | Объединение результатов двух запросов с удалением дубликатов |
| 13 | **INTERSECT** | Множества | Пересечение результатов двух запросов |
| 14 | **EXISTS** | Подзапросы | Проверка существования строк в подзапросе |
| 15 | **Подзапросы** | Подзапросы | Вложенные SELECT в WHERE, FROM, SELECT |
| 16 | **DML (INSERT/UPDATE/DELETE)** | Модификация | Вставка, обновление и удаление данных |
| 17 | **CREATE TABLE** | DDL | Создание таблиц с определением столбцов и типов |
| 18 | **ALTER TABLE** | DDL | Изменение структуры существующих таблиц |
| 19 | **VIEW** | Объекты БД | Создание представлений для упрощения запросов |
| 20 | **INDEX** | Объекты БД | Создание индексов для ускорения поиска |

### Система прогресса

Платформа использует геймифицированную систему прогрессии. За выполнение заданий и взаимодействие с платформой начисляются очки опыта (XP), которые определяют уровень пользователя и открывают новые достижения.

| Действие | XP |
|----------|-----|
| Выполнение задания (правильно) | +20 XP |
| Выполнение задания (неправильно) | +5 XP |
| Свободный режим (запрос) | +10 XP |
| Изучение справки | +5 XP |
| Просмотр схемы таблицы | +5 XP |
| Серия занятий (streak бонус) | +10 XP/день |

**Уровни:**

| Уровень | Название | Необходимый XP |
|---------|----------|----------------|
| 1 | Новичок | 0 |
| 2 | Ученик | 500 |
| 3–4 | Практик | 1 100+ |
| 5–6 | Аналитик | 2 800+ |
| 7–9 | Разработчик | 6 400+ |
| 10–14 | Инженер БД | 15 000+ |
| 15–19 | Архитектор БД | 40 000+ |
| 20+ | Мастер SQL | 100 000+ |

### Технологии

| Технология | Версия | Назначение |
|------------|--------|------------|
| **Next.js** | 16 | React-фреймворк с App Router, SSR и оптимизацией |
| **TypeScript** | 5 | Статическая типизация для надёжности кода |
| **Tailwind CSS** | 4 | Утилитарные CSS-стили для быстрой разработки UI |
| **shadcn/ui** | — | Компоненты интерфейса в стиле New York |
| **CodeMirror 6** | — | SQL-редактор с подсветкой синтаксиса и автодополнением |
| **Recharts** | 2 | Интерактивные графики и диаграммы для визуализации данных |
| **Zustand** | 5 | Лёгкое управление состоянием |
| **Better SQLite3** | 12 | Встроенная база данных SQLite для тренировочных данных |
| **PostgreSQL** | 16 | Поддержка внешней базы данных PostgreSQL |
| **NextAuth.js** | 5 | Аутентификация и управление сессиями |
| **Framer Motion** | 12 | Плавные анимации и переходы |
| **React Hook Form** | 7 | Валидация и управление формами |
| **Zod** | 4 | Валидация данных на TypeScript |

### Установка и запуск

#### Предварительные требования

- **Node.js** версии 18 или выше (рекомендуется 20+)
- **npm**, **yarn**, **pnpm** или **bun** в качестве пакетного менеджера

#### Установка

```bash
# Клонировать репозиторий
git clone https://github.com/dupleymi-aup/sql-trainer.git
cd sql-trainer

# Установить зависимости
npm install

# Запустить в режиме разработки
npm run dev
```

Приложение будет доступно по адресу [http://localhost:3000](http://localhost:3000)

#### Сборка для продакшена

```bash
# Сборка проекта
npm run build

# Запуск собранного приложения
npm start
```

### Структура проекта

```
sql-trainer/
├── public/                         # Статические файлы
│   └── logo.svg                    # SVG-логотип проекта
├── img/                            # Скриншоты интерфейса
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Корневой layout с ThemeProvider и AuthProvider
│   │   ├── globals.css             # Глобальные стили и CSS-переменные
│   │   ├── (auth)/                 # Страницы аутентификации
│   │   │   ├── login/page.tsx      # Страница входа
│   │   │   ├── register/page.tsx   # Страница регистрации
│   │   │   └── reset-password/page.tsx  # Восстановление пароля
│   │   ├── (main)/                 # Основные страницы
│   │   │   └── profile/page.tsx    # Профиль пользователя
│   │   └── api/                    # API маршруты
│   │       ├── auth/               # Аутентификация (NextAuth)
│   │       ├── sql/                # SQL-запросы и проверка
│   │       └── user/               # Прогресс, достижения, лидерборд
│   ├── components/
│   │   ├── sql-editor.tsx          # SQL-редактор на CodeMirror 6
│   │   ├── results-table.tsx       # Таблица результатов запросов
│   │   ├── query-result-chart.tsx  # Визуализация результатов
│   │   ├── task-panel.tsx          # Панель заданий
│   │   ├── query-history.tsx       # История запросов
│   │   ├── db-selector.tsx         # Переключатель баз данных
│   │   ├── schema-viewer.tsx       # Просмотр схемы БД
│   │   ├── sql-reference.tsx       # Справка по SQL
│   │   ├── sql-templates.tsx       # Шаблоны SQL-запросов
│   │   ├── sidebar.tsx             # Боковая панель
│   │   ├── welcome-panel.tsx       # Приветственная панель
│   │   ├── shortcuts-help.tsx      # Справка по горячим клавишам
│   │   ├── export-import-dialog.tsx # Экспорт/Импорт данных
│   │   ├── practice-mode-dialog.tsx # Свободный режим
│   │   ├── auth/                   # Компоненты аутентификации
│   │   ├── profile/                # Компоненты профиля
│   │   └── ui/                     # shadcn/ui компоненты (60+ компонентов)
│   ├── lib/
│   │   ├── auth.ts                 # Конфигурация NextAuth
│   │   ├── auth-internal.ts        # Внутренние утилиты аутентификации
│   │   ├── db-users.ts             # Работа с пользователями в БД
│   │   ├── sql-engine.ts           # SQL-движок для проверки запросов
│   │   ├── training-tasks.ts       # Генерация обучающих заданий
│   │   ├── postgresql-adapter.ts   # Адаптер PostgreSQL
│   │   ├── store.ts                # Zustand-хранилище состояния
│   │   └── utils.ts                # Утилиты (cn, форматирование)
│   ├── hooks/
│   │   ├── use-mobile.ts           # Хук для определения мобильных устройств
│   │   └── use-toast.ts            # Хук для уведомлений
│   └── types/
│       └── next-auth.d.ts          # Типы NextAuth
├── package.json                    # Зависимости и скрипты
├── next.config.ts                  # Конфигурация Next.js
├── tsconfig.json                   # Конфигурация TypeScript
├── tailwind.config.ts              # Конфигурация Tailwind CSS
├── README.md                       # Документация проекта (двуязычная)
├── LICENSE                         # Лицензия (двуязычная)
└── .gitignore                      # Исключения Git
```

### Дорожная карта

- [x] SQL-редактор с подсветкой синтаксиса и автодополнением
- [x] Обучающие задания с автоматической проверкой
- [x] Свободный режим для произвольных запросов
- [x] Поддержка SQLite и PostgreSQL
- [x] История запросов с сохранением
- [x] Экспорт/Импорт результатов (CSV, JSON)
- [x] Система прогресса с серией занятий (streak)
- [x] Рекомендации заданий
- [x] Аутентификация пользователей
- [x] Профиль с достижениями и статистикой
- [x] Таблица лидеров
- [x] Темы оформления (светлая/тёмная)
- [x] Справка по SQL-операторам
- [x] Визуализация результатов (графики)
- [ ] Мультиязычность (полная поддержка EN/RU)
- [ ] Дополнительные обучающие модули
- [ ] Интеграция с внешними LMS
- [ ] PWA-манифест для офлайн-работы

---

## 🇬🇧 Description in English

### About the Project

**SQL Trainer** is a comprehensive web platform for interactive learning of SQL and database operations. The project is designed as a full-featured educational application that combines training tasks with automatic verification, a free mode for arbitrary queries, a progress system with gamification, user authentication, and support for multiple DBMS (SQLite and PostgreSQL). The platform is intended for students, developers, and anyone who wants to master SQL through practical exercises.

### Key Features

- **Training tasks** — practical SQL exercises with automatic result verification
- **Free mode** — write any queries and explore the database structure
- **SQL editor** — syntax highlighting, autocompletion, keyboard shortcuts powered by CodeMirror 6
- **SQLite and PostgreSQL support** — work with different DBMS, switch between data sources
- **Query history** — save and quickly access previous queries
- **Export/Import** — export results to CSV, JSON and other formats
- **Progress system** — track streaks, statistics and analytics
- **Recommendations** — personalized task suggestions to improve skills
- **Themes** — light, dark and other themes with automatic detection
- **Authentication** — registration, login, password recovery, user profile
- **Leaderboard** — compete with other users on progress
- **Achievement system** — badges for various learning accomplishments
- **SQL reference** — built-in reference for SQL operators and functions
- **Schema visualization** — view table structures and relationships
- **Result charts** — visualize query results via Recharts

### Learning Topics

| # | Topic | Category | Description |
|---|-------|----------|-------------|
| 1 | **SELECT** | Basics | Basic data selection from tables, filtering with WHERE |
| 2 | **WHERE** | Basics | Filtering conditions: comparison, BETWEEN, IN, LIKE |
| 3 | **ORDER BY** | Basics | Sorting results by one or more columns |
| 4 | **LIMIT / OFFSET** | Basics | Limiting the number of returned rows, pagination |
| 5 | **JOIN (INNER)** | Joins | Inner join of tables by key |
| 6 | **LEFT JOIN** | Joins | Left outer join preserving all rows from the left table |
| 7 | **RIGHT JOIN** | Joins | Right outer join preserving all rows from the right table |
| 8 | **FULL JOIN** | Joins | Full outer join preserving all rows from both tables |
| 9 | **CROSS JOIN** | Joins | Cartesian product of rows from two tables |
| 10 | **GROUP BY** | Aggregation | Row grouping with aggregate functions: COUNT, SUM, AVG, MIN, MAX |
| 11 | **HAVING** | Aggregation | Filtering groups after aggregation |
| 12 | **UNION** | Set Operations | Combining results of two queries with duplicate removal |
| 13 | **INTERSECT** | Set Operations | Intersection of results of two queries |
| 14 | **EXISTS** | Subqueries | Checking for existence of rows in a subquery |
| 15 | **Subqueries** | Subqueries | Nested SELECT in WHERE, FROM, SELECT |
| 16 | **DML (INSERT/UPDATE/DELETE)** | Modification | Inserting, updating and deleting data |
| 17 | **CREATE TABLE** | DDL | Creating tables with column and type definitions |
| 18 | **ALTER TABLE** | DDL | Modifying existing table structures |
| 19 | **VIEW** | DB Objects | Creating views to simplify queries |
| 20 | **INDEX** | DB Objects | Creating indexes to speed up searches |

### Progress System

The platform uses a gamified progression system. Experience points (XP) are awarded for completing tasks and interacting with the platform, determining the user's level and unlocking new achievements.

| Action | XP |
|--------|-----|
| Task completion (correct) | +20 XP |
| Task completion (incorrect) | +5 XP |
| Free mode (query) | +10 XP |
| Reference exploration | +5 XP |
| Table schema view | +5 XP |
| Streak bonus | +10 XP/day |

**Levels:**

| Level | Title | Required XP |
|-------|-------|-------------|
| 1 | Novice | 0 |
| 2 | Learner | 500 |
| 3–4 | Practitioner | 1,100+ |
| 5–6 | Analyst | 2,800+ |
| 7–9 | Developer | 6,400+ |
| 10–14 | DB Engineer | 15,000+ |
| 15–19 | DB Architect | 40,000+ |
| 20+ | SQL Master | 100,000+ |

### Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16 | React framework with App Router, SSR, and optimization |
| **TypeScript** | 5 | Static typing for code reliability |
| **Tailwind CSS** | 4 | Utility-first CSS for rapid UI development |
| **shadcn/ui** | — | UI components in New York style |
| **CodeMirror 6** | — | SQL editor with syntax highlighting and autocompletion |
| **Recharts** | 2 | Interactive charts and data visualization |
| **Zustand** | 5 | Lightweight state management |
| **Better SQLite3** | 12 | Embedded SQLite database for training data |
| **PostgreSQL** | 16 | External PostgreSQL database support |
| **NextAuth.js** | 5 | Authentication and session management |
| **Framer Motion** | 12 | Smooth animations and transitions |
| **React Hook Form** | 7 | Form validation and management |
| **Zod** | 4 | TypeScript-first data validation |

### Installation and Setup

#### Prerequisites

- **Node.js** version 18 or higher (20+ recommended)
- **npm**, **yarn**, **pnpm**, or **bun** as package manager

#### Installation

```bash
# Clone the repository
git clone https://github.com/dupleymi-aup/sql-trainer.git
cd sql-trainer

# Install dependencies
npm install

# Run in development mode
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

#### Production Build

```bash
# Build the project
npm run build

# Run the built application
npm start
```

### Roadmap

- [x] SQL editor with syntax highlighting and autocompletion
- [x] Training tasks with automatic verification
- [x] Free mode for arbitrary queries
- [x] SQLite and PostgreSQL support
- [x] Query history with persistence
- [x] Export/Import results (CSV, JSON)
- [x] Progress system with streak tracking
- [x] Task recommendations
- [x] User authentication
- [x] Profile with achievements and statistics
- [x] Leaderboard
- [x] Themes (light/dark)
- [x] SQL operators reference
- [x] Result visualization (charts)
- [ ] Full multilingual support (EN/RU)
- [ ] Additional training modules
- [ ] LMS integration
- [ ] PWA manifest for offline mode

---

## 👤 Автор / Author

**Дуплей Максим Игоревич / Dupley Maxim Igorevich**

Данный проект является интеллектуальной собственностью Дуплей Максима Игоревича. Все права на программный код, дизайн, контент и учебные материалы принадлежат автору.

This project is the intellectual property of Dupley Maxim Igorevich. All rights to the source code, design, content, and educational materials belong to the author.

---

## 📄 Лицензия / License

Данный проект является интеллектуальной собственностью Дуплей Максима Игоревича (Dupley Maxim Igorevich). Условия использования описаны в файле [LICENSE](./LICENSE).

This project is the intellectual property of Dupley Maxim Igorevich. Terms of use are described in the [LICENSE](./LICENSE) file.

---

<div align="center">

**SQL Trainer** — © 2025 Дуплей Максим Игоревич / Dupley Maxim Igorevich

</div>
