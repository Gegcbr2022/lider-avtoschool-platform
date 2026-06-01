# Переменные окружения

Секреты нельзя хранить в Git. `.env` и `.env.*` игнорируются через `.gitignore`, а `.env.example` содержит только безопасные примеры.

Важно: ранее в `.env.example` были обнаружены реальные значения `TELEGRAM_BOT_TOKEN`, `OPENAI_API_KEY`, Sentry DSN и PostHog key. Эти значения нужно считать скомпрометированными и перевыпустить в кабинетах провайдеров.

## NEXT_PUBLIC_SITE_URL

Что это: публичный URL сайта.

Обязательна: да для staging/production, нет для локальной разработки.

Где получить: домен сайта или preview URL хостинга.

Как заполнить: без завершающего `/`.

Пример:

```env
NEXT_PUBLIC_SITE_URL=https://lider.example.ua
```

## APP_DOMAIN

Что это: домен приложения без протокола.

Обязательна: желательно для production.

Где получить: из production-домена.

Пример:

```env
APP_DOMAIN=lider.example.ua
```

## ADMIN_SITE_URL

Что это: URL админ-панели для CORS и ссылок.

Обязательна: если админка деплоится отдельно.

Пример:

```env
ADMIN_SITE_URL=https://admin.lider.example.ua
```

## ALLOWED_ORIGINS

Что это: список разрешённых CORS origin для API через запятую.

Обязательна: да для production API.

Пример:

```env
ALLOWED_ORIGINS=https://lider.example.ua,https://admin.lider.example.ua
```

## API_URL

Что это: URL Firebase Functions API.

Обязательна: да для production сайта и мобильного приложения.

Где получить: после деплоя Cloud Functions.

Пример:

```env
API_URL=https://europe-west1-lider-avtoschool.cloudfunctions.net/api
```

Локальный пример:

```env
API_URL=http://localhost:5001/lider-avtoschool-dev/europe-west1/api
```

## FIREBASE_PROJECT_ID

Что это: Firebase project ID.

Обязательна: да для Firebase deploy и серверного окружения.

Где получить: Firebase Console, Project settings.

Пример:

```env
FIREBASE_PROJECT_ID=lider-avtoschool-dev
```

## FIREBASE_STORAGE_BUCKET

Что это: bucket Cloud Storage.

Обязательна: да, если используются документы и файлы.

Где получить: Firebase Console, Storage.

Пример:

```env
FIREBASE_STORAGE_BUCKET=lider-avtoschool-dev.firebasestorage.app
```

## SENTRY_DSN

Что это: DSN проекта Sentry для мониторинга ошибок.

Обязательна: нет.

Где получить: Sentry, Project settings, Client Keys.

Пример:

```env
SENTRY_DSN=https://examplePublicKey@o000000.ingest.sentry.io/000000
```

## POSTHOG_KEY

Что это: ключ PostHog для аналитики.

Обязательна: нет.

Где получить: PostHog, Project settings.

Пример:

```env
POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxx
```

## TELEGRAM_BOT_TOKEN

Что это: токен Telegram bot.

Обязательна: только если включается Telegram-интеграция.

Где получить: BotFather.

Пример:

```env
TELEGRAM_BOT_TOKEN=replace_with_telegram_bot_token
```

## TELEGRAM_LOG_CHAT_ID

Что это: ID Telegram чата/группы, куда API будет отправлять уведомления о новых заявках (`POST /leads`).

Обязательна: нет. Если не указана, заявки не отправляются в Telegram и продолжают сохраняться в Firebase.

Как получить:

1. Добавить бота в группу.
2. Отправить сообщение в группу.
3. Открыть `https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getUpdates`.
4. В ответе взять `message.chat.id` (для групп обычно отрицательный ID).

Пример:

```env
TELEGRAM_LOG_CHAT_ID=-1001234567890
```

## TELEGRAM_WEBHOOK_SECRET

Что это: secret token для проверки Telegram webhook header `x-telegram-bot-api-secret-token`.

Обязательна: да, если webhook включён в production.

Где получить: сгенерировать самостоятельно и передать при настройке webhook.

Пример:

```env
TELEGRAM_WEBHOOK_SECRET=replace_with_random_32_chars
```

## OPENAI_API_KEY

Что это: ключ OpenAI API для AI-консультанта.

Обязательна: только если включён OpenAI adapter.

Где получить: OpenAI Platform.

Пример:

```env
OPENAI_API_KEY=replace_with_openai_project_key
```

## LIQPAY_PUBLIC_KEY

Что это: публичный ключ LiqPay.

Обязательна: только если включён LiqPay.

Где получить: кабинет LiqPay.

Пример:

```env
LIQPAY_PUBLIC_KEY=replace_with_liqpay_public_key
```

## LIQPAY_PRIVATE_KEY

Что это: приватный ключ LiqPay.

Обязательна: только если включён LiqPay.

Где получить: кабинет LiqPay.

Пример:

```env
LIQPAY_PRIVATE_KEY=replace_with_liqpay_private_key
```

## FONDY_MERCHANT_ID

Что это: merchant ID Fondy.

Обязательна: только если включён Fondy.

Где получить: кабинет Fondy.

Пример:

```env
FONDY_MERCHANT_ID=1234567
```

## FONDY_SECRET_KEY

Что это: secret key Fondy.

Обязательна: только если включён Fondy.

Где получить: кабинет Fondy.

Пример:

```env
FONDY_SECRET_KEY=replace_with_fondy_secret
```

## MONOBANK_TOKEN

Что это: token Monobank acquiring/API.

Обязательна: только если включён Monobank.

Где получить: кабинет Monobank/FOP acquiring.

Пример:

```env
MONOBANK_TOKEN=replace_with_monobank_token
```
