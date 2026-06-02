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
- **Telegram-документи**: після загрузки файлів у Storage — `PATCH /leads/:id/documents` запускає `sendDocumentsToTelegram` у API (скачує з bucket і надсилає у чат). Явна назва bucket через `FIREBASE_STORAGE_BUCKET`.
- **Email-уведомлення**: `sendLeadEmail()` у API — підтримує Resend (через SMTP) і прямий SMTP (nodemailer). Активується `LEAD_EMAIL_ENABLED=true`. Підтримка окремих адрес за філіями.
- **Переклади uk/ru/en**: homepage, форма, мобільне меню, sticky footer — повністю перекладені.
- **Privacy/Terms сторінки**: черновик юридичного тексту на uk/ru/en. Потребує фінального юридичного підтвердження.
- **Відгуки**: тільки реальний `ReviewsCarousel`, блок фейкових карток прибраний.
- **Admin CRM**: CSV-export лідів, фільтри за містом і джерелом, кнопки копіювання номера і виклику.
- **ENV_GUIDE_RU.md**: детальна інструкція для кожної ENV змінної, включно з email.
- **Головна сторінка спрощена**: блок категорій показує лише 4 картки з кнопкою "Усі категорії та ціни" → `/categories`.
- **Мобільний sticky footer**: один головний CTA "Залишити заявку" + Telegram-іконка.
- **Footer**: прибраний номер телефону, додано Telegram + email CTA.
- **Адреси філіалів оновлено**: Київ (ТРК «Аркадія», 2-й поверх), Слов'янськ (Дім Побуту, 1-й поверх), Краматорськ (буд. 56), Дніпро (82Г, 3-й поверх, кім. 11).
- **Мобільне меню**: переклади uk/ru/en через `menuCopy`.

---

## Потребує зовнішніх доступів або ENV

### Firebase / API

| Пункт | Що потрібно |
|---|---|
| Firebase public config | `NEXT_PUBLIC_FIREBASE_*` у Vercel — отримати з Firebase Console → Project Settings → Web app |
| `FIREBASE_STORAGE_BUCKET` | `lider-avtoschool.firebasestorage.app` — задати у Firebase Functions env |
| Telegram bot | `TELEGRAM_BOT_TOKEN` і `TELEGRAM_LOG_CHAT_ID` в Firebase Functions secrets |
| Email (Resend) | `RESEND_API_KEY` + `LEAD_EMAIL_ENABLED=true` + `LEAD_EMAIL_TO=...` в Firebase Functions |
| Email (SMTP) | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` замість `RESEND_API_KEY` |
| CAPTCHA (anti-spam) | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` |
| Real payments | LiqPay / Fondy / Monobank keys в ENV |

### Vercel (Web)

| Пункт | Що потрібно |
|---|---|
| ENV у Vercel dashboard | Усі `NEXT_PUBLIC_FIREBASE_*` + `OPENAI_API_KEY` + `TELEGRAM_*` — детально в `ENV_GUIDE_RU.md` |
| Custom domain | Прив'язати `lider.bdslab.net` у Vercel → Domains |
| Analytics | `NEXT_PUBLIC_GA4_ID`, `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_TIKTOK_PIXEL_ID` |

---

## Потребує коду (залишилось)

### Web

- **Реальна валідація CAPTCHA**: Cloudflare Turnstile підключається після отримання ключів.
- **Privacy / Terms тексти**: черновик готовий, потрібен фінальний юридичний review.

### Admin

- **Авторизація менеджерів**: Firebase Auth + custom claims (`role: "manager"` / `"admin"`).
- **Реальний Firestore CRUD**: зараз тільки sample data — потрібно підключити Firebase Admin SDK у Next.js admin app.
- **Ролі**: розмежування прав між admin і manager.

### Mobile

- **EAS credentials**: потрібні акаунти Google Play / App Store Connect і підписи.
- **Push-повідомлення**: `expo-notifications` + FCM token registration.
- **Реальна синхронізація**: розклад, оплати, прогрес з production Firestore.

---

## Legal та бізнес

- Фінальне підтвердження цін, строків і умов CE під час воєнного стану.
- Актуальні адреси філіалів підтверджено, але графіки роботи і канали зв'язку потребують підтвердження.
- **Тексти privacy policy та terms of use**: черновики готові, потрібен юридичний review перед публікацією як офіційні документи.

---

## Smoke QA після деплою

Деталі в `DEPLOY.md` → розділ 5.

Production URL: **https://lider.bdslab.net/**
API URL: **https://europe-west1-lider-avtoschool.cloudfunctions.net/api**
