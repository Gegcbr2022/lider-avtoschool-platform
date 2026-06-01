# Автошкола «Лідер»

Монорепозиторий цифровой платформы автошколы «Лідер»: публичный сайт, CRM/админ-панель, мобильный кабинет ученика, Firebase API, общие доменные пакеты и инфраструктура.

Основной язык продукта: украинский. Документация для разработки и поддержки ведётся на русском языке.

## Что входит в проект

- `apps/web` — публичный сайт на Next.js с SEO-страницами, лид-формой, sitemap и robots.
- `apps/admin` — CRM/админ-панель на Next.js для заявок, учеников, практики, платежей и LMS.
- `apps/mobile` — Expo Router приложение для Android/iOS с кабинетом ученика.
- `apps/api` — Firebase Cloud Functions API на Express с Zod-валидацией.
- `packages/types` — общие TypeScript-контракты.
- `packages/shared` — филиалы, услуги, демо-данные, схемы валидации и i18n.
- `packages/ui` — общие React UI-примитивы и дизайн-токены.
- `packages/config` — конфигурация URL, домена и окружений.
- `infrastructure/firebase` — Firestore rules, Storage rules и индексы.

## Быстрый старт

```bash
npm install
npm run typecheck
npm run dev:web
```

Сайт будет доступен на `http://localhost:3000`.

Для админки:

```bash
npm run dev:admin
```

Админка будет доступна на `http://localhost:3001`.

Для API-эмуляторов:

```bash
npm run dev:api
```

Для мобильного приложения:

```bash
npm run dev:mobile
```

## Обязательные проверки

Перед коммитом и деплоем выполнять:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Документация

- [DEPLOYMENT.md](DEPLOYMENT.md) — локальный запуск, сборка, деплой и CI/CD.
- [FIREBASE_SETUP.md](FIREBASE_SETUP.md) — Firebase, rules, Functions, эмуляторы и доступы.
- [ENVIRONMENT.md](ENVIRONMENT.md) — все переменные окружения и правила хранения секретов.
- [PROJECT_ARCHITECTURE.md](PROJECT_ARCHITECTURE.md) — архитектура, приложения, пакеты, API и данные.
- [ADMIN_GUIDE.md](ADMIN_GUIDE.md) — роли, CRM-процесс и работа админки.
- [CHANGELOG.md](CHANGELOG.md) — история изменений.
- [FINAL_REPORT.md](FINAL_REPORT.md) — итоговый технический отчёт по текущему аудиту.

Дополнительные узкие материалы по мобильным сторам, CI и безопасности лежат в `docs/`.

## Важный статус

Проект собирается локально, но полноценный production-запуск зависит от ручных доступов:

- Google/Firebase авторизация для деплоя Functions, Firestore rules и Storage rules.
- Production-домены для сайта и админки.
- Секреты платёжных, Telegram, AI, аналитических и мониторинговых провайдеров.
- Финальная настройка Firebase Auth, App Check, custom claims и реальных коллекций Firestore.
