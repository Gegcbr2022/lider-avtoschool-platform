# Отчет по AI-интеграции

## Реализовано

- Добавлен server-only endpoint `POST /api/ai/chat` в Next.js.
- Добавлены Firebase/Express endpoints `POST /ai/chat` и `POST /ai/leads`.
- Добавлены shared Zod-схемы `aiChatRequestSchema`, `aiLeadSchema`, `aiChatMessageSchema`.
- Добавлен RAG-поиск по локальной базе знаний сайта: категории, филиалы, FAQ, страницы, отзывы, выпускники, соцсети, mobile app.
- Добавлен fallback-ответ, чтобы dev и временный сбой OpenAI не ломали UX.
- Добавлен prompt-injection guard.
- Добавлен rate limit 20 запросов/мин на Next route и общий API rate limit в Firebase/Express.
- Добавлен плавающий AI-чат с быстрыми вопросами, lead form и событиями аналитики.
- Добавлена AI-вкладка в мобильное приложение.
- Добавлен сценарий объяснения ошибок ПДР в мобильных тестах.

## OpenAI

Интеграция использует OpenAI Responses API через `fetch("https://api.openai.com/v1/responses")`.

Причины выбора:

- не добавляет новую SDK-зависимость;
- ключ остается только на сервере;
- формат легко проксируется из Next route и Firebase API;
- модель можно заменить через `OPENAI_MODEL`.

Текущий дефолт: `gpt-4.1-mini`.

## RAG

Runtime RAG находится в `apps/web/lib/ai-assistant.ts`.

Алгоритм:

1. Собрать knowledge chunks из shared-данных и SEO-страниц.
2. Токенизировать вопрос пользователя.
3. Оценить совпадения по title, tags и content.
4. Передать в модель только top chunks.
5. Ответить кратко на языке пользователя.

## AI leads

Коллекция: `aiLeads`.

Поля:

- `name`
- `phone`
- `telegram`
- `city`
- `category`
- `question`
- `comment`
- `source`
- `createdAt`
- `status`

В dev endpoint возвращает `local-dev-fallback`. В production Next route отправляет лид в `API_URL/ai/leads`.

## Ограничения и следующий шаг

- Реальные фото выпускников нужно подключить после юридического согласования.
- Для production желательно добавить долговременный rate limit через Redis/Firestore, а не только in-memory.
- `ai-knowledge.json` сейчас стартовый артефакт; runtime строит базу знаний из кода. Для большого объема контента можно перенести chunks в Firestore или vector store.
