# Missing For Production

Актуальний стан: що закрито в коді, а що потребує зовнішніх доступів або бізнес-рішень.

---

## Закрито в коді

- Єдина lead-модель і `createLeadSchema` для сайту, popup, AI-чату та API.
- Окремі сторінки `/categories`, `/documents`, `/pride`, `/contacts`, `/faq`, `/app`, `/privacy`, `/terms` зі збереженням мови через `?lang=`.
- Розширена галерея «Гордість Лідера».
- Базовий KPI snapshot: джерела лідів, конверсія lead/student, популярні категорії, міста, Telegram/popup/referral.
- Firestore rules/indexes для публічного створення лідів і KPI read-only. **Задеплоєно в production**.
- Storage rules: додано шлях `lead-documents/{leadId}` для анонімного upload документів заявки. **Задеплоєно в production**.
- **Firebase Functions задеплоєно**: `https://europe-west1-lider-avtoschool.cloudfunctions.net/api`
- **Firebase Storage upload реалізовано**: форма завантажує файли в `lead-documents/{leadId}` через Firebase Storage SDK. Потрібні `NEXT_PUBLIC_FIREBASE_*` ENV у Vercel.
- **Telegram-документи**: після загрузки файлів у Storage — `PATCH /leads/:id/documents` запускає `sendDocumentsToTelegram` у API.
- **Email-уведомлення**: `sendLeadEmail()` у API — підтримує Resend і прямий SMTP, не блокує Telegram/створення ліда при помилці, зберігає `emailNotificationStatus`. Активується `LEAD_EMAIL_ENABLED=true`.
- **Переклади uk/ru/en**: homepage, форма, мобільне меню, sticky footer — повністю перекладені.
- **Privacy/Terms сторінки**: ✅ **повністю перероблено** — повноцінні тексти на uk/ru/en з 13 (privacy) та 16 (terms) розділами, структурованими буллетами та оглавленням. Потребує фінального юридичного підтвердження.
- **Згода у формах**: ✅ чекбокс тепер містить клікабельні посилання на `/privacy` та `/terms` з правильними локалізованими текстами.
- **Cloudflare Turnstile**: ✅ клієнтський віджет `TurnstileWidget` компонент + server-side верифікація у `/api/leads`. Graceful fallback: якщо `TURNSTILE_SECRET_KEY` не задано — перевірка пропускається. Фронтенд приховує віджет якщо `NEXT_PUBLIC_TURNSTILE_SITE_KEY` не задано.
- **Admin DEMO-режим**: ✅ доданий жовтий банер що чітко вказує на зразкові дані, змінено "production workspace" → "DEMO — зразкові дані", додано `ADMIN_ROLES_GUIDE.md` з інструкцією по підключенню Firebase Admin SDK і призначенню ролей.
- **MOBILE_RELEASE_GUIDE_RU.md**: ✅ створено — повний гайд по збірці APK/AAB/IPA, EAS профілях, ENV змінних, Google Play і App Store.
- **Відгуки**: тільки реальний `ReviewsCarousel`, блок фейкових карток прибраний.
- **Admin CRM**: CSV-export лідів, фільтри за містом і джерелом, кнопки копіювання номера і виклику.
- **ENV_GUIDE_RU.md**: детальна інструкція для кожної ENV змінної, включно з email та Turnstile.
- **Головна сторінка спрощена**: блок категорій показує лише 4 картки з кнопкою "Усі категорії та ціни" → `/categories`.
- **Мобільний sticky CTA**: один головний CTA "Залишити заявку", з'являється після скролу.
- **Footer**: прибраний номер телефону, компактні іконки соцмереж включно з TikTok; privacy/terms/email залишені дрібним текстом.
- **Адреси філіалів оновлено**: Київ (ТРК «Аркадія», 2-й поверх), Слов'янськ (Дім Побуту, 1-й поверх), Краматорськ (буд. 56), Дніпро (82Г, 3-й поверх, кім. 11).

---

## Потребує зовнішніх доступів або ENV

### Firebase / API

| Пункт | Що потрібно |
|---|---|
| Firebase public config | `NEXT_PUBLIC_FIREBASE_*` у Vercel — отримати з Firebase Console → Project Settings → Web app |
| `FIREBASE_STORAGE_BUCKET` | `lider-avtoschool.firebasestorage.app` — задати у Firebase Functions env |
| Telegram bot | `TELEGRAM_BOT_TOKEN` і `TELEGRAM_LOG_CHAT_ID` в Firebase Functions secrets |
| Email (Resend) | `RESEND_API_KEY` + `LEAD_EMAIL_ENABLED=true` + `LEAD_EMAIL_TO=...` + `LEAD_EMAIL_FROM=...` в Firebase Functions |
| Email (SMTP) | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` замість `RESEND_API_KEY` |
| CAPTCHA (anti-spam) | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` — ✅ інтеграція готова, потрібні лише ключі |
| Real payments | LiqPay / Fondy / Monobank keys в ENV |

### Vercel (Web)

| Пункт | Що потрібно |
|---|---|
| ENV у Vercel dashboard | Усі `NEXT_PUBLIC_FIREBASE_*` + `OPENAI_API_KEY` + `TELEGRAM_*` — детально в `ENV_GUIDE_RU.md` |
| Custom domain | Прив'язати `lider.bdslab.net` у Vercel → Domains |
| Analytics | `NEXT_PUBLIC_GA4_ID`, `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_TIKTOK_PIXEL_ID` |

---

## Потребує коду або зовнішніх доступів (залишилось)

### Admin

- **Firebase Admin SDK**: встановлення + service account ключ. Інструкція у `docs/ADMIN_ROLES_GUIDE.md`.
- **Авторизація**: Firebase Auth + middleware auth guard. Архітектура та гайд у `docs/ADMIN_ROLES_GUIDE.md`.
- **Реальний Firestore CRUD**: підключення після Firebase Admin SDK.
- **Ролі admin/manager**: призначення custom claims через Firebase Admin SDK (скрипт у `ADMIN_ROLES_GUIDE.md`).

### Mobile

- **EAS credentials**: потрібні акаунти Google Play / App Store Connect і підписи. Гайд: `MOBILE_RELEASE_GUIDE_RU.md`.
- **Push-повідомлення**: `expo-notifications` + FCM token registration.
- **Реальна синхронізація**: розклад, оплати, прогрес з production Firestore.
- **Firebase мобільний**: `google-services.json` / `GoogleService-Info.plist`.

---

## Legal та бізнес

- **Тексти privacy policy та terms of use**: ✅ якісні черновики готові (uk/ru/en, 13 та 16 розділів). Потрібен **фінальний юридичний review** перед публікацією як офіційні документи.
- Фінальне підтвердження цін, строків і умов CE під час воєнного стану.
- Графіки роботи і канали зв'язку філіалів потребують підтвердження від власника.
- Підтвердження від власника для використання реальних фотографій у «Гордість Лідера».

---

## Smoke QA після деплою

Деталі в `DEPLOY.md` → розділ 5.

Production URL: **https://lider.bdslab.net/**
API URL: **https://europe-west1-lider-avtoschool.cloudfunctions.net/api**
