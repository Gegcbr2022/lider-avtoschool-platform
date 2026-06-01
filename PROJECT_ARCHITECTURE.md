# Архитектура проекта

## Общая модель

Проект — npm workspaces монорепозиторий. Развёртываемые приложения лежат в `apps/*`, общие пакеты — в `packages/*`, инфраструктура — в `infrastructure/*`.

```text
apps/
  web/      публичный сайт
  admin/    CRM и операционная панель
  mobile/   Expo приложение ученика
  api/      Firebase Functions API
packages/
  config/   runtime-конфигурация
  shared/   бизнес-данные, схемы, i18n
  types/    общие типы
  ui/       UI-примитивы
infrastructure/
  firebase/ правила и индексы Firebase
  docker/   вспомогательная локальная инфраструктура
```

## Web

`apps/web` — Next.js App Router.

Функции:

- главный лендинг;
- SEO metadata;
- `sitemap.xml`;
- `robots.txt`;
- динамические контентные страницы (`/[slug]`);
- форма заявки;
- API route `/api/leads`.

Язык пользовательского интерфейса: украинский.

## Admin

`apps/admin` — Next.js CRM workspace.

Текущий статус: интерфейс CRM существует как рабочий демо-слой на sample data. Для production нужно подключить Firebase Auth, Firestore и реальные роли.

Основные зоны:

- лиды;
- ученики;
- практика;
- платежи;
- LMS;
- документы;
- настройки.

## Mobile

`apps/mobile` — Expo Router приложение.

Экраны:

- главная;
- обучение;
- практика;
- тесты;
- профиль.

Приложение использует общие данные из `@lider/shared` и готово к подключению API через `API_URL`.

## API

`apps/api` — Express-приложение, опубликованное как Firebase Cloud Function `api`.

Текущие endpoints:

- `GET /health`;
- `POST /leads`;
- `POST /bookings`;
- `POST /payments/create-intent`;
- `POST /telegram/webhook`;
- `POST /ai/consult`.

Валидация входных данных выполняется через Zod-схемы из `@lider/shared`.

## Данные

Основные доменные сущности:

- `Branch`;
- `ServiceCard`;
- `Lead`;
- `BookingSlot`;
- `Payment`;
- `LessonProgress`;
- `UserRole`.

Основные Firestore collections:

- `leads`;
- `students`;
- `bookings`;
- `payments`;
- `courses`;
- `auditLogs`;
- `telegramEvents`;
- `paymentIntents`.

## Авторизация и роли

Плановая модель:

- Firebase Authentication создаёт пользователя.
- Backend или администратор назначает custom claim `role`.
- Firestore/Storage rules читают `request.auth.token.role`.

Роли:

- `admin` — полный доступ, настройки, аудит, экспорт.
- `manager` — лиды, ученики, документы, практика, оплаты.
- `student` — собственный профиль, прогресс, документы, практика, платежи.

## Платежи

Типы провайдеров:

- LiqPay;
- Fondy;
- Monobank.

Сейчас платежные адаптеры являются безопасными demo-заглушками для non-production. В production demo adapter возвращает `501`, пока не подключён реальный провайдер.

## Telegram

API содержит endpoint `/telegram/webhook`. В production webhook должен проверяться через `TELEGRAM_WEBHOOK_SECRET`.

## OpenAI и AI

AI endpoint `/ai/consult` поддерживает схему провайдера:

- `openai`;
- `claude`;
- `gemini`;
- `openrouter`;
- `local`.

Сейчас это архитектурная заготовка. Для production нужно добавить adapter, secret store и лимиты использования.

## SEO и контент

Сайт имеет sitemap, robots, JSON-LD DrivingSchool и SEO-ready страницы. Главный экран адаптирован под реальный бренд и факты автошколы:

- 10+ лет работы;
- 15000+ учеников;
- категории A, A1, B, C, CE;
- филиалы Киев, Словянск, Краматорск, Днипро, Доброполье;
- онлайн-теория, тесты МВС, практическая подготовка.

Часть внутренних страниц пока шаблонная. Для настоящего production их нужно наполнить реальными текстами или подключить CMS/Firestore.

Исходный украинский контент с ценами, документами и программой обучения сохранён в:

```text
docs/source-content/avtoshkola-lider-content-uk.txt
```
