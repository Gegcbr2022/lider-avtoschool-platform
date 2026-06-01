# Production deploy

Каноническая инструкция находится в `DEPLOYMENT.md`. Этот файл — короткая шпаргалка.

## Нужно заранее

- GitHub репозиторий с актуальным `main`.
- Firebase project.
- Hosting для `apps/web`.
- Hosting для `apps/admin`.
- Production переменные окружения из `ENVIRONMENT.md`.

## Проверки

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Firebase

```bash
npx firebase login
npx firebase use production
npx firebase deploy
```

## Web/Admin

Рекомендуемый вариант — два отдельных Vercel/Netlify проекта:

- web root: `apps/web`;
- admin root: `apps/admin`.

После деплоя проверить:

- главную страницу;
- форму заявки;
- `/sitemap.xml`;
- `/robots.txt`;
- API `/health`;
- админку;
- GitHub Actions.
