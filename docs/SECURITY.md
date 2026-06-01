# Безопасность

## Что уже есть

- TypeScript strict mode.
- Zod validation для публичных payload.
- Firestore rules с RBAC.
- Storage rules с ограничением owner/staff.
- Базовый per-IP rate limit.
- Ограниченный CORS.
- Проверка Telegram webhook secret.
- Demo payment adapter заблокирован в production.
- Секреты вынесены из `.env.example`.

## Что обязательно перед production

- Перевыпустить скомпрометированные ключи.
- Включить Firebase App Check.
- Хранить секреты в Firebase/Vercel/Netlify secret store.
- Добавить audit log writes для staff mutations.
- Проверять подписи платёжных webhook.
- Подключить Sentry/PostHog только после privacy review.
- Добавить E2E и integration tests для критичных flows.

## Dependency audit

`npm audit --omit=dev` показывает moderate advisories в транзитивных цепочках Next/Expo/Firebase. `npm audit fix --force` сейчас предлагает потенциально ломающие изменения, поэтому применять его нельзя без отдельного framework-upgrade плана и регрессионной проверки.
