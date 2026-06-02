# Пользовательское руководство

Дата: 2026-06-02.

## Для посетителя сайта

1. Откройте сайт.
2. Выберите категорию или город.
3. Нажмите `Записатися`, `Підібрати курс` или кнопку на SEO-странице.
4. Заполните имя, телефон, город, категорию и филиал.
5. Отправьте форму.
6. Менеджер получает заявку через API/CRM-процесс.

Popup-форма появляется автоматически: в production примерно через 60 секунд, в dev быстрее для тестирования.

## Для менеджера автошколы

CRM находится в `apps/admin`.

Локально:

```bash
npm run dev:admin
```

В CRM уже заложены:

- лиды;
- статусы заявки;
- фильтры;
- практика и инструкторы;
- платежи;
- уведомления;
- LMS-метрики.

Демо-данные находятся в `packages/shared/src/index.ts`.

## Для ученика

Мобильное приложение находится в `apps/mobile`.

Основные экраны:

- `Головна` — прогресс, onboarding, быстрые действия, практика, уведомления.
- `Навчання` — уроки, активные темы, программы.
- `Практика` — ближайший слот и доступные занятия.
- `Тести` — ПДР-тренажер.
- `Кабінет` — профиль, документы и платежи.

## Для администратора

Важные файлы:

- `.env` — реальные секреты, не коммитить.
- `.env.example` — безопасный шаблон.
- `infrastructure/firebase/firestore.rules` — доступ к Firestore.
- `infrastructure/firebase/storage.rules` — доступ к Storage.
- `apps/api/src/index.ts` — API endpoints.
- `apps/web/lib/site-pages.ts` — SEO-страницы.
- `packages/shared/src/index.ts` — филиалы, услуги, FAQ и маркетинговые данные.

## Как менять контент сайта

Филиалы:

```text
packages/shared/src/index.ts -> branches
```

Услуги:

```text
packages/shared/src/index.ts -> services
```

SEO-страницы:

```text
apps/web/lib/site-pages.ts -> contentPages
```

FAQ:

```text
packages/shared/src/index.ts -> homeFaq
```

Выпускники:

```text
packages/shared/src/index.ts -> graduateStories
```

## Как смотреть заявки

В production поток такой:

1. Сайт отправляет POST `/api/leads`.
2. Next route валидирует данные.
3. В production route отправляет данные в Firebase Functions по `API_URL`.
4. Functions API сохраняет лид в Firestore.
5. Если настроен Telegram, заявка логируется в чат.

В dev-режиме `/api/leads` возвращает успешный local response без записи в Firestore.
