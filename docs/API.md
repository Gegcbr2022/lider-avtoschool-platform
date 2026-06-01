# API

Базовый URL задаётся переменной `API_URL`.

## Endpoints

- `GET /health` — проверка состояния сервиса.
- `POST /leads` — создание заявки из сайта или мобильного приложения.
- `POST /bookings` — запрос записи на практику.
- `POST /payments/create-intent` — создание платёжного intent.
- `POST /telegram/webhook` — приём событий Telegram.
- `POST /ai/consult` — консультация через AI adapter.

## Валидация

Публичные мутации валидируются Zod-схемами из `@lider/shared`. Некорректный payload возвращает `422`.

## Безопасность

В API есть базовый rate limit, ограниченный CORS и проверка Telegram webhook secret. Для production дополнительно включить Firebase App Check, audit logs и проверку подписей платёжных webhook.
