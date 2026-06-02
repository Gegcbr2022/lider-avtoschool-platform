# Missing For Production

Актуальний стан: що закрито в коді, а що потребує зовнішніх доступів або бізнес-рішень.

---

## Закрито в коді

- Єдина lead-модель і `createLeadSchema` для сайту, popup, AI-чату та API.
- Окремі сторінки `/categories`, `/documents`, `/pride`, `/contacts`, `/faq`, `/app`, `/privacy`, `/terms` зі збереженням мови через `?lang=`.
- Розширена галерея «Гордість Лідера».
- Базовий KPI snapshot: джерела лідів, конверсія lead/student, популярні категорії, міста, Telegram/popup/referral.
- Firestore rules/indexes для публічного створення лідів і KPI read-only.
- Мобільний кабінет з retention-сигналами.
- Виправлено JSON-LD URL (тепер `lider.bdslab.net`).
- Hero highlights показуються і на мобільних.
- Footer містить посилання на `/privacy`, `/terms` і email.
- Storage rules: додано шлях `lead-documents/{leadId}` для анонімного upload документів заявки.
- Файл `DEPLOY.md` з повними інструкціями деплою.

---

## Потребує зовнішніх доступів або ENV

### Firebase / API

| Пункт | Що потрібно |
|---|---|
| Production Firebase project | Доступ до Firebase Console, налаштований `.firebaserc` |
| Service account | JSON-ключ для server-side читання Firestore |
| Firestore indexes deploy | `firebase deploy --only firestore:indexes` після логіну |
| Storage rules deploy | `firebase deploy --only storage` |
| Telegram bot | `TELEGRAM_BOT_TOKEN` і `TELEGRAM_LOG_CHAT_ID` в ENV |
| CAPTCHA (anti-spam) | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` |
| Real payments | LiqPay / Fondy / Monobank keys в ENV |

### Vercel (Web)

| Пункт | Що потрібно |
|---|---|
| ENV у Vercel dashboard | `NEXT_PUBLIC_SITE_URL=https://lider.bdslab.net` та решта (див. `DEPLOY.md`) |
| Custom domain | Прив'язати `lider.bdslab.net` у Vercel → Domains |
| OpenAI API key | `OPENAI_API_KEY` для AI-чату |
| Analytics | `NEXT_PUBLIC_GA4_ID`, `NEXT_PUBLIC_META_PIXEL_ID` |

---

## Потребує коду (можна зробити без зовнішніх доступів)

### Web

- **Повні переклади:** переключатель мови працює, але більша частина контенту залишається українською. Потрібно перекласти секції categories, documents, pride, FAQ, форму і success/error стани для `ru` та `en`.
- **Реальна завантажування файлів:** форма передає лише імена файлів. Потрібно підключити Firebase Storage upload (шлях `lead-documents/{leadId}`).
- **Privacy / Terms сторінки:** сторінки існують у роутингу, але потребують фінальних юридичних текстів.

### Admin

- **Реальні CRUD поверх Firestore:** зараз тільки sample data.
- **Авторизація менеджерів:** Firebase Auth + custom claims (`role: "manager"` / `"admin"`).
- **Експорт заявок:** CSV/XLSX для менеджерів.
- **Ролі:** розмежування прав між admin і manager.

### Mobile

- **EAS credentials:** потрібні акаунти Google Play / App Store Connect і підписи.
- **Push-повідомлення:** `expo-notifications` + FCM token registration.
- **Deep links:** schema `lider://` налаштована в `app.config.ts`, потребує тесту.
- **Реальна синхронізація:** розклад, оплати, прогрес з production Firestore.

---

## Legal та бізнес

- Фінальне підтвердження цін, строків і умов CE під час воєнного стану.
- Актуальні адреси філіалів, графіки роботи і контактні канали.
- Тексти privacy policy та terms of use (юридичні, не технічні).

---

## Smoke QA після деплою

Деталі в `DEPLOY.md` → розділ 5.

Production URL: **https://lider.bdslab.net/**
