# Деплой и эксплуатация

Дата обновления: 2026-06-02.

## Локальная подготовка

```bash
npm install
npm run lint
npm run typecheck
npm run test
npm run build
```

`npm ci` использовать в CI и чистых production-сборках.

## Локальный запуск

```bash
npm run dev:web      # http://localhost:3000
npm run dev:admin    # http://localhost:3001
npm run dev:api      # Firebase emulators
npm run dev:mobile   # Expo
```

## Web/Admin

`apps/web` и `apps/admin` — Next.js приложения. Для Vercel/Netlify лучше заводить отдельные проекты:

- web root: `apps/web`;
- admin root: `apps/admin`.

Обязательные production ENV:

- `NEXT_PUBLIC_SITE_URL`
- `APP_DOMAIN`
- `API_URL`
- `ALLOWED_ORIGINS`

Опциональные ENV:

- `SENTRY_DSN`
- `POSTHOG_KEY`
- `TELEGRAM_LOG_CHAT_ID`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET`
- `OPENAI_API_KEY`
- `LIQPAY_PUBLIC_KEY`
- `LIQPAY_PRIVATE_KEY`
- `FONDY_MERCHANT_ID`
- `FONDY_SECRET_KEY`
- `MONOBANK_TOKEN`

## Firebase

Перед деплоем:

```bash
npx firebase login
npx firebase projects:list
npx firebase use <project-id>
```

Деплой rules/indexes:

```bash
npx firebase deploy --only firestore:rules,firestore:indexes,storage
```

Деплой Functions API:

```bash
npx firebase deploy --only functions
```

Полный Firebase deploy:

```bash
npx firebase deploy
```

В `firebase.json` настроены Functions, Firestore, Storage и emulators. Hosting для Next.js не используется.

## GitHub Actions

Workflow: `.github/workflows/ci.yml`.

Запуск:

- `push` в `main`, `develop`, `staging`;
- `pull_request`.

Команды CI:

```bash
npm ci
npm run lint
npm run typecheck
npm run test
npm run build
```

Проверка статуса:

```bash
gh run list --limit 5
gh run watch <run-id>
```

## Mobile / APK

Проверка Expo-проекта:

```bash
cd apps/mobile
npx expo-doctor
```

Preview APK/AAB через EAS:

```bash
cd apps/mobile
npx eas login
npx eas build --profile preview --platform android
```

CI-вариант:

```bash
set EXPO_TOKEN=<token>
cd apps/mobile
npx eas build --profile preview --platform android --non-interactive
```

Локальная Android-сборка дополнительно требует:

- Android Studio / Android SDK;
- `adb` в PATH;
- `emulator` в PATH;
- хотя бы один AVD;
- Java JDK;
- Expo/EAS аккаунт или `EXPO_TOKEN`.

## Текущие ограничения окружения

В текущей сессии проверено:

- `adb` не найден;
- `emulator` не найден;
- EAS CLI доступен, но APK build требует Expo account или `EXPO_TOKEN`;
- `npx expo-doctor` после правок проходит 18/18 проверок.
