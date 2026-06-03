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
- **Firebase Storage upload реалізовано**: форма завантажує файли в `lead-documents/{leadId}` через Firebase Storage SDK.
- **Telegram-документи**: після загрузки файлів у Storage — `PATCH /leads/:id/documents` запускає `sendDocumentsToTelegram` у API.
- **Email-уведомлення**: `sendLeadEmail()` у API — Resend і SMTP, graceful fallback, `emailNotificationStatus`. Активується `LEAD_EMAIL_ENABLED=true`.
- **Переклади uk/ru/en**: homepage, форма, мобільне меню, sticky footer.
- **Privacy/Terms сторінки**: повноцінні тексти uk/ru/en, 13 та 16 розділів, оглавлення.
- **Публічний дисклеймер прибраний**: ✅ `/privacy` та `/terms` показують нейтральну відмітку дати оновлення без попереджень. Юридичний sign-off — бізнес-задача власника.
- **Відправка заявок виправлена**: ✅ Vercel тепер пересилає `x-forwarded-for` та `user-agent` у Firebase Functions — rate-limit більше не блокує всіх після 2-ї заявки. `verifyTurnstile` gracefully пропускає якщо ключ не задано.
- **Згода у формах**: клікабельні посилання на `/privacy` та `/terms`.
- **Smart CAPTCHA / Cloudflare Turnstile**: risk-based flow. Нормальний користувач без CAPTCHA; підозрілий отримує Turnstile.
- **Admin DEMO-режим**: жовтий банер, "DEMO — зразкові дані", `ADMIN_ROLES_GUIDE.md`.
- **MOBILE_RELEASE_GUIDE_RU.md**: повний гайд по збірці APK/AAB/IPA.
- **Driver Club (мобільний killer feature)**: ✅ нова вкладка «Клуб» — щоденний тест ПДР, streak, бейджі, підказка дня, чек-лист водія, реферальний блок. Mock-дані готові до підключення backend.
- **Контент теорії та практики**: ✅ на `/categories` додано блок — Zoom-заняття, YouTube-лекції, тренажер ПДР, практичні заняття з інструктором. uk/ru/en.
- **CLIENT_DB_ARCHITECTURE_RU.md**: ✅ архітектура спільної клієнтської БД — 12 колекцій, Telegram-sync поля, matching по телефону, Security Rules, roadmap бота.
- **DEPLOY_STRATEGY_RU.md**: ✅ порівняння Vercel+Firebase vs VPS vs гібрид, рекомендація та тригери переходу.
- **Відгуки**: тільки реальний `ReviewsCarousel`.
- **Admin CRM**: CSV-export, фільтри, кнопки дзвінка.
- **ENV_GUIDE_RU.md**: детальна інструкція для кожної ENV змінної.
- **Головна сторінка**: 4 картки категорій + "Усі категорії та ціни".
- **Мобільний sticky CTA**, **Footer**, **Адреси філіалів** оновлено.

---

## Потребує зовнішніх доступів або ENV

### Firebase / API

| Пункт | Що потрібно |
|---|---|
| Firebase public config | `NEXT_PUBLIC_FIREBASE_*` у Vercel — Firebase Console → Project Settings → Web app |
| `FIREBASE_STORAGE_BUCKET` | `lider-avtoschool.firebasestorage.app` — Firebase Functions env |
| Telegram bot | `TELEGRAM_BOT_TOKEN` і `TELEGRAM_LOG_CHAT_ID` в Firebase Functions secrets |
| Email (Resend) | `RESEND_API_KEY` + `LEAD_EMAIL_ENABLED=true` + `LEAD_EMAIL_TO` + `LEAD_EMAIL_FROM` в Firebase Functions |
| CAPTCHA | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (Vercel) + `TURNSTILE_SECRET_KEY` (Firebase Functions) |
| Real payments | LiqPay / Fondy / Monobank keys в ENV |

### Vercel (Web)

| Пункт | Що потрібно |
|---|---|
| ENV у Vercel dashboard | Усі `NEXT_PUBLIC_FIREBASE_*` + `OPENAI_API_KEY` + `TURNSTILE_*` — детально в `ENV_GUIDE_RU.md` |
| Custom domain | `lider.bdslab.net` прив'язано |
| Analytics | `NEXT_PUBLIC_GA4_ID`, `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_TIKTOK_PIXEL_ID` |

---

## Потребує коду або зовнішніх доступів (залишилось)

### Admin

- **Firebase Admin SDK**: service account ключ. Інструкція у `docs/ADMIN_ROLES_GUIDE.md`.
- **Авторизація**: Firebase Auth + middleware auth guard.
- **Реальний Firestore CRUD**: після Firebase Admin SDK.
- **Ролі admin/manager**: `setCustomUserClaims` (скрипт у `ADMIN_ROLES_GUIDE.md`).

### Mobile

- **EAS credentials**: Google Play / App Store Connect і підписи. Гайд: `MOBILE_RELEASE_GUIDE_RU.md`.
- **Push-повідомлення**: `expo-notifications` + FCM token registration.
- **Реальна синхронізація Driver Club**: mock → Firestore після запуску в stores.
- **Firebase мобільний**: `google-services.json` / `GoogleService-Info.plist`.

### Telegram-бот

- **Код бота**: після отримання — аналіз БД і інтеграція за `CLIENT_DB_ARCHITECTURE_RU.md`.
- **Migration**: стара БД бота → Firestore `botUsers`.
- **Webhook**: бот → Firebase Functions → спільний Firestore.

---

## Legal та бізнес

- **Privacy/terms**: тексти готові, дисклеймер прибраний. Потрібен **підпис власника** для офіційного статусу.
- Підтвердження цін, строків CE під час воєнного стану.
- Графіки роботи і контакти філіалів.
- Підтвердження використання реальних фотографій у «Гордість Лідера».

---

## Smoke QA після деплою

Деталі в `DEPLOY.md` → розділ 5.

Production URL: **https://lider.bdslab.net/**
API URL: **https://europe-west1-lider-avtoschool.cloudfunctions.net/api**
