# Скилл: Project Review — Автошкола «Лідер»

Используй этот файл как чеклист при любом техническом ревью итерации проекта.

## Структура монорепозитория

```
apps/web       — Next.js публичный сайт (Vercel)
apps/admin     — Next.js CRM/админка
apps/api       — Firebase Functions API (Express + Zod)
apps/mobile    — Expo Router кабинет ученика
packages/shared — контент, схемы, i18n, sample data
packages/types  — TypeScript типы
packages/ui     — shared React-компоненты
packages/config — runtime ENV-конфигурация
infrastructure/ — Firebase rules, indexes, docker
```

## Точки входа для ревью

| Область | Файл |
|---|---|
| Главная страница | `apps/web/app/page.tsx` |
| Контент-страницы | `apps/web/app/[slug]/page.tsx` |
| Данные и схемы | `packages/shared/src/index.ts` |
| Типы | `packages/types/src/index.ts` |
| API | `apps/api/src/index.ts` |
| CRM | `apps/admin/components/crm-workspace.tsx` |
| Mobile home | `apps/mobile/app/(tabs)/index.tsx` |
| Firestore rules | `infrastructure/firebase/firestore.rules` |
| Storage rules | `infrastructure/firebase/storage.rules` |

## Что проверять при каждой итерации

### Frontend (web)
- [ ] JSON-LD URLs используют `https://lider.bdslab.net`
- [ ] Hero highlights видны на мобильных (без `hidden` без `sm:grid`)
- [ ] Footer содержит `/privacy`, `/terms`, email
- [ ] Нет dev-текстов в production-копии
- [ ] Форма: все поля валидируются, success/error state работают
- [ ] Popup: появляется через 25 сек в production (1.5 сек в dev)
- [ ] Переключатель языка: UA/RU/EN работает, URL сохраняет `?lang=`
- [ ] Мобильное меню: открывается, закрывается, переходы работают
- [ ] Нет горизонтального скролла на 360px
- [ ] Нет console.error в браузере

### Backend (API)
- [ ] Rate limiting включен (18 req/min для leads, 20 для AI chat)
- [ ] Zod-валидация на всех публичных эндпоинтах
- [ ] CORS ограничен списком `ALLOWED_ORIGINS`
- [ ] Telegram logging работает при наличии ENV
- [ ] `/health` эндпоинт возвращает 200

### Firestore / Storage rules
- [ ] Публичное создание лидов разрешено только с `consentAccepted: true`
- [ ] `lead-documents/{leadId}` разрешает anonymous create (upload файлов)
- [ ] `student-documents/{studentId}` — только auth пользователь + staff
- [ ] kpiSnapshots — read-only для staff
- [ ] auditLogs — read-only для admin, write: false

### SEO
- [ ] `<title>` уникален для каждой страницы
- [ ] `description` заполнен
- [ ] OG-теги корректны
- [ ] JSON-LD DrivingSchool, FAQPage, BreadcrumbList на главной
- [ ] robots.ts разрешает индексацию
- [ ] sitemap.ts содержит все contentPages

## Команды проверки

```bash
npm run lint
npm run typecheck
npm run build
node scripts/smoke-test.mjs
```

## Production URL

https://lider.bdslab.net/
