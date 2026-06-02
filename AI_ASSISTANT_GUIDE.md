# Инструкция по AI-помощнику

## Где находится

- Веб-чат: плавающая кнопка справа снизу на главной странице.
- Backend endpoint сайта: `apps/web/app/api/ai/chat/route.ts`.
- Firebase/Express endpoint: `apps/api/src/index.ts`, маршруты `/ai/chat` и `/ai/leads`.
- RAG-логика сайта: `apps/web/lib/ai-assistant.ts`.
- Экспорт базы знаний: `scripts/build-ai-knowledge.ts`, артефакт `ai-knowledge.json`.
- Мобильная вкладка: `apps/mobile/app/(tabs)/assistant.tsx`.

## Что умеет

- Отвечает про цены, длительность, категории A/A1/B/C/CE, филиалы, документы, запись, оплату, обучение и ПДР.
- Подбирает категорию через 3-5 уточняющих вопросов.
- Объясняет ошибки ПДР в мобильном приложении.
- Мягко переводит пользователя в заявку.
- Собирает AI-лид: имя, телефон, Telegram, город, категория, вопрос, комментарий.
- Сохраняет AI-лиды в `aiLeads` через API в production.

## Безопасность

- `OPENAI_API_KEY` используется только на сервере.
- Во фронтенд ключ не передается.
- Есть rate limit на `/api/ai/chat`.
- Сообщения ограничены Zod-схемой до 1000 символов.
- Есть guard против prompt injection и запросов на секреты/системный промпт.
- Вне темы автошколы помощник отвечает фиксированно:

```text
Я помогаю с вопросами автошколы: обучение, категории прав, документы, цены, филиалы и запись. Могу помочь подобрать обучение?
```

## Переменные окружения

- `OPENAI_API_KEY` уже должен быть в `.env` и Vercel env.
- `OPENAI_MODEL` опционален. Если не задан, используется `gpt-4.1-mini`.
- `API_URL` нужен production-сайту для пересылки AI-лидов в Firebase/Express API.

## Аналитика

Реализованные события:

- `ai_chat_open`
- `ai_message_sent`
- `ai_lead_created`
- `popup_shown`
- `popup_closed`
- `popup_lead_created`
- `exit_popup_shown`

События отправляются в `dataLayer`, `window.posthog.capture` при наличии и debug-консоль в dev.
