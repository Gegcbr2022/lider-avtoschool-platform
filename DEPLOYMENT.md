# Деплой и эксплуатация

## Текущий статус

Проект готовится как production-oriented монорепозиторий, но реальный деплой в текущей сессии ограничен доступами:

- GitHub remote доступен: `https://github.com/Gegcbr2022/lider-avtoschool-platform.git`.
- Ветка `main` синхронизирована с `origin/main`.
- GitHub CLI установлен и авторизован.
- GitHub Actions `CI` на последних двух push завершился успешно.
- Firebase CLI установлен, но Firebase/Google авторизация в текущей сессии отсутствует.
- Vercel CLI в системе не установлен.

## Локальная подготовка

```bash
npm install
npm run lint
npm run typecheck
npm run test
npm run build
```

`npm install` достаточно для локальной разработки. В CI и production-сборках предпочтительно использовать:

```bash
npm ci
```

## Локальный запуск

Публичный сайт:

```bash
npm run dev:web
```

Админка:

```bash
npm run dev:admin
```

Firebase Functions и эмуляторы:

```bash
npm run dev:api
```

Мобильное приложение:

```bash
npm run dev:mobile
```

## Firebase deploy

Перед деплоем нужен вход в Firebase:

```bash
npx firebase login
npx firebase use dev
```

Проверить список проектов:

```bash
npx firebase projects:list
```

Деплой правил и индексов:

```bash
npx firebase deploy --only firestore:rules,firestore:indexes,storage
```

Деплой API:

```bash
npx firebase deploy --only functions
```

Полный Firebase deploy:

```bash
npx firebase deploy
```

Важно: в `firebase.json` сейчас настроены Functions, Firestore, Storage и эмуляторы. Hosting для Next.js не настроен, поэтому web/admin лучше деплоить на Vercel, Netlify или другой Next.js-compatible хостинг.

## Vercel deploy

Если выбран Vercel:

```bash
npm install -g vercel
vercel login
vercel link
vercel env add NEXT_PUBLIC_SITE_URL production
vercel env add APP_DOMAIN production
vercel env add API_URL production
vercel --prod
```

Для монорепозитория лучше завести два проекта:

- `lider-web` с root directory `apps/web`;
- `lider-admin` с root directory `apps/admin`.

Оба проекта должны получить свои переменные окружения из `ENVIRONMENT.md`.

## GitHub workflow

CI находится в `.github/workflows/ci.yml` и запускается на:

- `push` в `main`, `develop`, `staging`;
- `pull_request`.

CI выполняет:

```bash
npm ci
npm run lint
npm run typecheck
npm run test
npm run build
```

## Мобильная сборка

Мобильное приложение находится в `apps/mobile`.

Локальный запуск:

```bash
npm run dev:mobile
```

EAS preview build:

```bash
cd apps/mobile
npx eas build --profile preview --platform android
```

Production build:

```bash
cd apps/mobile
npx eas build --profile production --platform all
```

Для публикации нужны Expo/EAS аккаунт, Android package `ua.lider.avtoschool`, iOS bundle identifier `ua.lider.avtoschool`, и store assets.
