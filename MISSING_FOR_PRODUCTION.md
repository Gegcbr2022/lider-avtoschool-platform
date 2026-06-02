# Missing For Production

Актуальний стан: що закрито в коді, а що потребує зовнішніх доступів або бізнес-рішень.

---

## Закрито в коді

- Єдина lead-модель і `createLeadSchema` для сайту, popup, AI-чату та API.
- Окремі сторінки `/categories`, `/documents`, `/pride`, `/contacts`, `/faq`, `/app`, `/privacy`, `/terms` зі збереженням мови через `?lang=`.
- Розширена галерея «Гордість Лідера».
- Базовий KPI snapshot: джерела лідів, конверсія lead/student, популярні категорії, міста, Telegram/popup/referral.
- Firestore rules/indexes для публічного створення лідів і KPI read-only. **Задеплоєно в production**.
- Мобільний кабінет з retention-сигналами.
- Виправлено JSON-LD URL (тепер `lider.bdslab.net`).
- Hero highlights показуються і на мобільних.
- Footer містить посилання на `/privacy`, `/terms` і email.
- Storage rules: додано шлях `lead-documents/{leadId}` для анонімного upload документів заявки. **Задеплоєно в production**.
- Файл `DEPLOY.md` з повними інструкціями деплою.
- **Firebase Storage upload реалізовано**: форма завантажує файли в `lead-documents/{leadId}` через Firebase Storage SDK. Потрібні `NEXT_PUBLIC_FIREBASE_*` ENV у Vercel.
- **Переклади uk/ru/en**: homepage та форма заявки повністю перекладені на всіх трьох мовах.
- **Privacy/Terms сторінки**: черновик юридичного тексту на uk/ru/en. Потребує фінального юридичного підтвердження.
- **Блок відгуків**: рефакторинг — прибрано «Соціальний доказ», текст чесний і без фейків.
- **Admin CRM**: CSV-export лідів, фільтри за містом і джерелом, кнопки копіювання номера і виклику.
- **ENV_GUIDE_RU.md**: детальна інструкція для кожної ENV змінної.
- **Firebase Functions задеплоєно** в production: `https://europe-west1-lider-avtoschool.cloudfunctions.net/api`
- **Firestore правила та indexes задеплоєно** в production.

---

## Потребує зовнішніх доступів або ENV

### Firebase / API

| Пункт | Що потрібно |
|---|---|
| Firebase public config | `NEXT_PUBLIC_FIREBASE_API_KEY`, `AUTH_DOMAIN`, `PROJECT_ID`, `STORAGE_BUCKET`, `APP_ID` у Vercel |
| Telegram bot | `TELEGRAM_BOT_TOKEN` і `TELEGRAM_LOG_CHAT_ID` в Vercel + Firebase secrets |
| CAPTCHA (anti-spam) | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` |
| Real payments | LiqPay / Fondy / Monobank keys в ENV |

### Vercel (Web)

| Пункт | Що потрібно |
|---|---|
| ENV у Vercel dashboard | Всі `NEXT_PUBLIC_FIREBASE_*` + `OPENAI_API_KEY` + `TELEGRAM_*` — детально в `ENV_GUIDE_RU.md` |
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
- **Експорт CSV** поверх реального Firestore (зараз sample data → CSV вже реалізовано, інтеграція з production Firestore залишається).

### Mobile

- **EAS credentials**: потрібні акаунти Google Play / App Store Connect і підписи.
- **Push-повідомлення**: `expo-notifications` + FCM token registration.
- **Реальна синхронізація**: розклад, оплати, прогрес з production Firestore.

---

## Legal та бізнес

- Фінальне підтвердження цін, строків і умов CE під час воєнного стану.
- Актуальні адреси філіалів, графіки роботи і контактні канали.
- **Тексти privacy policy та terms of use**: черновики готові, потрібен юридичний review перед публікацією як офіційні документи.

---

## Smoke QA після деплою

Деталі в `DEPLOY.md` → розділ 5.

Production URL: **https://lider.bdslab.net/**
API URL: **https://europe-west1-lider-avtoschool.cloudfunctions.net/api**
