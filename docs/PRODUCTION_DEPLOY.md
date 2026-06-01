# Production Deploy

## Что нужно до деплоя

- GitHub репозиторий с кодом.
- Vercel или Netlify аккаунт.
- Firebase проект.
- Production переменные окружения.

## Переменные

```text
NEXT_PUBLIC_SITE_URL
APP_DOMAIN
API_URL
FIREBASE_PROJECT_ID
FIREBASE_STORAGE_BUCKET
```

## Вариант Vercel

1. Откройте Vercel.
2. Нажмите `Add New Project`.
3. Выберите GitHub репозиторий.
4. Укажите папку приложения: `apps/web`.
5. Добавьте переменные окружения.
6. Нажмите `Deploy`.

## Вариант Netlify

1. Откройте Netlify.
2. Нажмите `Add new site`.
3. Выберите GitHub репозиторий.
4. Build command: `npm run build --workspace @lider/web`.
5. Publish directory: `apps/web/.next`.
6. Добавьте переменные окружения.
7. Нажмите `Deploy`.
