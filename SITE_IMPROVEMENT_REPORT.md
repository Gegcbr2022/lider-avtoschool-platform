# Отчет по улучшению сайта

Дата: 2 июня 2026

## Главные изменения

- Добавлен AI-чат с RAG, быстрыми вопросами, сбором лида и server-only OpenAI интеграцией.
- Popup заявки заменен на smart-popup: 25 секунд до первого показа, повтор через 35 секунд, max 3 показа за сессию, exit-intent, scroll-depth, section-depth, A/B-варианты.
- Добавлен блок соцсетей: Facebook, Instagram, YouTube, Telegram, WhatsApp.
- Добавлен social proof блок со статистикой: 15 000+ выпускников, 10+ лет, рейтинг, 5 городов.
- Блок выпускников превращен в фильтруемую галерею «Наша гордість».
- Добавлена современная карусель отзывов с рейтингом.
- Филиалы получили карты, часы работы, маршрут, звонок и запись.
- Добавлен промо-блок мобильного приложения с phone mockup, преимуществами и store-кнопками «Скоро».
- Добавлена AI-вкладка в Expo mobile app.
- В ПДР-тесты mobile app добавлено объяснение ошибки через AI-сценарий.
- Добавлена JSON-LD разметка отзывов и aggregate rating.

## Основные файлы

- `apps/web/app/page.tsx`
- `apps/web/components/ai-chat-widget.tsx`
- `apps/web/components/lead-popup.tsx`
- `apps/web/components/graduate-showcase.tsx`
- `apps/web/components/reviews-carousel.tsx`
- `apps/web/app/api/ai/chat/route.ts`
- `apps/web/lib/ai-assistant.ts`
- `apps/web/lib/analytics.ts`
- `apps/api/src/ai-providers.ts`
- `apps/api/src/index.ts`
- `apps/mobile/app/(tabs)/assistant.tsx`
- `apps/mobile/app/(tabs)/tests.tsx`
- `packages/shared/src/index.ts`
- `packages/types/src/index.ts`
- `scripts/build-ai-knowledge.ts`
- `ai-knowledge.json`

## Что было взято из prava.today

- Смысловая структура: категории, преимущества, шаги обучения, отзывы, «Гордість»/выпускники, контакты и форма заявки.
- Важные доверительные тезисы: 10+ лет, 15 000+ выпускников, филиальная сеть, опытные инструкторы.
- Логика popup-заявки сохранена, но улучшена по времени, триггерам и аналитике.

## Что улучшено поверх prava.today

- AI-консультант и AI-заявки.
- RAG-база знаний по сайту.
- Фильтры выпускников по городу и категории.
- Карусель отзывов.
- Полные карточки филиалов с картами.
- Мобильный app promo и мобильная AI-вкладка.
- Более явная архитектура аналитики и A/B-тестов.

## Проверки

Промежуточно пройдены:

- `npm --workspace @lider/web run typecheck`
- `npm --workspace @lider/api run typecheck`
- `npm --workspace @lider/mobile run typecheck`

Финальные проверки выполняются после завершения документации:

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
