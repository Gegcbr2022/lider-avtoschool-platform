# Автошкола «Лідер»

Монорепозиторий цифровой платформы автошколы «Лідер»: публичный сайт, CRM/админ-панель, мобильный кабинет ученика, Firebase API, общие доменные пакеты и инфраструктура.

Основной язык продукта: украинский. Документация, отчёты и инструкции по проекту ведутся на русском языке.

## Что входит

- `apps/web` — публичный сайт на Next.js: премиальная главная, SEO-страницы, popup-заявка, лид-форма, sitemap, robots и schema.org.
- `apps/admin` — CRM/админ-панель на Next.js для заявок, учеников, практики, платежей и LMS.
- `apps/mobile` — Expo Router приложение для Android/iOS с кабинетом ученика, onboarding, быстрыми действиями и состояниями UI.
- `apps/api` — Firebase Cloud Functions API на Express с Zod-валидацией, CORS, rate limiting и Telegram-логированием лидов.
- `packages/shared` — филиалы, услуги, маркетинговые данные, демо-данные, Zod-схемы и i18n.
- `packages/types` — общие TypeScript-контракты.
- `packages/ui` — React UI-примитивы и дизайн-токены.
- `packages/config` — публичная runtime-конфигурация URL/API/domain.
- `infrastructure/firebase` — Firestore rules, Storage rules и индексы.

## Быстрый старт

```bash
npm install
npm run typecheck
npm run dev:web
```

Сайт: `http://localhost:3000`.

Админка:

```bash
npm run dev:admin
```

API/Firebase emulators:

```bash
npm run dev:api
```

Мобильное приложение:

```bash
npm run dev:mobile
```

## Проверки

Перед коммитом и деплоем:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Дополнительно для мобильного приложения:

```bash
cd apps/mobile
npx expo-doctor
```

## Production URL

Текущий сайт работает на:

https://lider.bdslab.net/

## Основные документы

- [PROJECT_AUDIT.md](PROJECT_AUDIT.md) — полный аудит кода, UI/UX, SEO, ENV, Firebase, GitHub, mobile и безопасности.
- [FINAL_IMPROVEMENT_REPORT.md](FINAL_IMPROVEMENT_REPORT.md) — что улучшено в текущей итерации.
- [DEPLOYMENT.md](DEPLOYMENT.md) — деплой web/admin/API/mobile.
- [USER_GUIDE.md](USER_GUIDE.md) — как пользоваться сайтом, CRM и мобильным кабинетом.
- [HOW_TO_USE_PROJECT.md](HOW_TO_USE_PROJECT.md) — инструкция для человека без опыта разработки.
- [APK_BUILD_REPORT.md](APK_BUILD_REPORT.md) — статус APK-сборки.
- [ANDROID_TEST_REPORT.md](ANDROID_TEST_REPORT.md) — статус проверки эмулятора Android.
- [GITHUB_DEPLOY_REPORT.md](GITHUB_DEPLOY_REPORT.md) — GitHub, push и CI/CD.
- [CHANGELOG.md](CHANGELOG.md) — история изменений.

## Важный статус

Код собирается локально. Полноценный production-запуск зависит от внешних доступов:

- Firebase/Google доступ для деплоя Functions, Firestore rules и Storage rules.
- Production ENV: `API_URL`, `NEXT_PUBLIC_SITE_URL`, Telegram, AI, платежи, аналитика, мониторинг.
- Expo/EAS аккаунт или `EXPO_TOKEN` для APK/AAB.
- Android SDK/ADB/AVD для локального APK и emulator QA.
