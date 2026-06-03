# Руководство по переменным окружения

Этот файл объясняет простым языком каждую переменную из `.env.example`:  
что это, где взять, куда вставить и что будет, если оставить пустым.

---

## Быстрая шпаргалка

| ENV | Где брать | Куда вставлять | Секретный? | Можно пустым? |
|---|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Vercel → Domains | Vercel + `.env` | Нет | Только локально |
| `APP_DOMAIN` | Vercel → Domains | Vercel | Нет | Нет (CORS) |
| `ALLOWED_ORIGINS` | Вручную | Vercel + Firebase | Нет | Нет (CORS) |
| `API_URL` | Firebase Console | Vercel | Нет | Нет (production) |
| `FIREBASE_PROJECT_ID` | Firebase Console | Vercel + Firebase | Нет | Нет |
| `FIREBASE_STORAGE_BUCKET` | Firebase Console | Vercel + Firebase | Нет | Нет (для upload) |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Console | Vercel | Нет | Нет (для upload) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Console | Vercel | Нет | Нет (для upload) |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Console | Vercel | Нет | Нет (для upload) |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Console | Vercel | Нет | Нет (для upload) |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase Console | Vercel | Нет | Нет (для upload) |
| `OPENAI_API_KEY` | platform.openai.com | Vercel + Firebase | **ДА** | Без него нет AI-чата |
| `TELEGRAM_BOT_TOKEN` | @BotFather в Telegram | Vercel + Firebase | **ДА** | Без него нет уведомлений |
| `TELEGRAM_LOG_CHAT_ID` | @userinfobot или Telegram API | Vercel + Firebase | Нет | Без него нет лог-канала |
| `TELEGRAM_DEFAULT_START_PARAM` | Придумать самому | Vercel | Нет | Нет (AYYUTE по умолчанию) |
| `NEXT_PUBLIC_GA4_ID` | Google Analytics | Vercel | Нет | Без него нет аналитики GA4 |
| `NEXT_PUBLIC_META_PIXEL_ID` | Meta Events Manager | Vercel | Нет | Без него нет Meta пикселя |
| `NEXT_PUBLIC_TIKTOK_PIXEL_ID` | TikTok Ads Manager | Vercel | Нет | Без него нет TikTok пикселя |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Dashboard | Vercel | Для production | Без него подозрительные заявки не смогут пройти CAPTCHA |
| `TURNSTILE_SECRET_KEY` | Cloudflare Dashboard | Firebase Functions + Vercel | **ДА** | Без него high-risk заявки получат `captcha_unavailable` |
| `LEAD_EMAIL_ENABLED` | Вручную | Firebase Functions | Нет | `false` → email выключен |
| `LEAD_EMAIL_TO` | Ваш email | Firebase Functions | Нет | Без него email не отправится |
| `LEAD_EMAIL_FROM` | Подтверждённый sender | Firebase Functions | Нет | Будет fallback из SMTP/Resend |
| `LEAD_EMAIL_CC` | Доп. email | Firebase Functions | Нет | Можно пустым |
| `LEAD_EMAIL_PROVIDER` | `resend` / `smtp` | Firebase Functions | Нет | Только подсказка, код выбирает транспорт автоматически |
| `RESEND_API_KEY` | resend.com | Firebase Functions | **ДА** | Нужен для Resend |
| `SMTP_HOST` | Хостинг / Gmail | Firebase Functions | Нет | Нужен для SMTP |
| `SMTP_USER` / `SMTP_PASS` | Хостинг / Gmail | Firebase Functions | **ДА** | Нужны для SMTP |

---

## Детальные объяснения

---

### `NEXT_PUBLIC_SITE_URL`

**Что это:** Публичный URL вашего сайта. Используется для генерации
OpenGraph-тегов, sitemap, robots.txt и JSON-LD schema.org.

**Формат:** `https://lider.bdslab.net`

**Где взять:**  
Vercel → ваш проект → Settings → Domains → скопировать production домен.

**Куда вставить:**  
- Vercel → Project → Settings → Environment Variables → Production  
- В `.env` для локальной разработки: `NEXT_PUBLIC_SITE_URL=http://localhost:3000`

**Что будет, если пустым:**  
SEO-ссылки и JSON-LD будут ломаться или показывать `localhost`.

---

### `NEXT_PUBLIC_GA4_ID`

**Что это:** Google Analytics 4 Measurement ID.  
Этот идентификатор — не секрет, он виден всем пользователям в коде страницы.

**Формат:** `G-XXXXXXXXXX` (начинается с `G-`)

**Где взять:**
1. Перейди на [analytics.google.com](https://analytics.google.com/)
2. Войди под аккаунтом Google
3. Admin (шестерёнка) → Data Streams → Web → твой поток
4. Скопируй **Measurement ID** в правом верхнем углу

**Куда вставить:**  
Vercel → Project → Settings → Environment Variables → имя: `NEXT_PUBLIC_GA4_ID`, значение: `G-XXXXXXX`

**Для `.env` / локальной работы:** не нужен, аналитика работает только в production.

**Что будет, если пустым:**  
Google Analytics не будет собирать данные. Всё остальное работает нормально.

---

### `NEXT_PUBLIC_META_PIXEL_ID`

**Что это:** Meta/Facebook Pixel ID — идентификатор, который позволяет
Facebook/Instagram отслеживать посетителей и показывать ретаргетинговую рекламу.  
Не секрет, виден в коде страницы.

**Формат:** числовой, обычно 15–16 цифр, например `1234567890123456`

**Где взять:**
1. Перейди на [business.facebook.com](https://business.facebook.com/) → Events Manager
2. Открой свой пиксель
3. Скопируй **Pixel ID** (число вверху)

**Куда вставить:**  
Vercel → Environment Variables → `NEXT_PUBLIC_META_PIXEL_ID`

**Что будет, если пустым:**  
Meta-пиксель не загружается, ретаргетинговая реклама Facebook/Instagram не работает.

---

### `NEXT_PUBLIC_TIKTOK_PIXEL_ID`

**Что это:** TikTok Pixel ID — идентификатор для трекинга конверсий в TikTok Ads.  
Не секрет, виден в браузере.

**Формат:** строка вида `CXXXXXXXXXXXXXXX`

**Где взять:**
1. TikTok Ads Manager → Assets → Events
2. Web Events → твой пиксель → Details
3. Скопируй **Pixel ID**

**Куда вставить:**  
Vercel → Environment Variables → `NEXT_PUBLIC_TIKTOK_PIXEL_ID`

**Что будет, если пустым:**  
TikTok не получает данные о посещениях и конверсиях. Реклама в TikTok не оптимизируется по конверсиям.

---

### `NEXT_PUBLIC_TURNSTILE_SITE_KEY`

**Что это:** Публичный ключ Cloudflare Turnstile — система защиты форм от ботов
(современная замена Google reCAPTCHA). Этот ключ используется **только на frontend**,
его не нужно скрывать.

В проекте включён **Smart CAPTCHA**: нормальный пользователь видит короткую форму без CAPTCHA.
Виджет появляется только при риск-сигналах: быстрый submit, повторные попытки, тот же телефон в
текущей sessionStorage-сессии, заполненный honeypot, частые открытия popup, подозрительный user-agent
или ответ API `captcha_required`.

**Формат:** строка вида `0x4AAAAAAAAXXXXXXXXXX`

**Где взять:**
1. Перейди на [dash.cloudflare.com](https://dash.cloudflare.com/)
2. Раздел **Turnstile** в левом меню
3. Создай виджет для домена `lider.bdslab.net`
4. Скопируй **Site Key** (публичный)

**Куда вставить:**  
Vercel → Environment Variables → `NEXT_PUBLIC_TURNSTILE_SITE_KEY`

**Что будет, если пустым:**  
Low-risk заявки продолжат отправляться без CAPTCHA. Если API потребует CAPTCHA для suspicious/high-risk
заявки, пользователь увидит сообщение, что проверка временно недоступна. Для production ключ нужен.

---

### `TURNSTILE_SECRET_KEY`

**Что это:** Секретный ключ Cloudflare Turnstile для серверной проверки CAPTCHA-токена.  
Отправляется с сервера в Cloudflare API, чтобы убедиться, что CAPTCHA пройдена честно.

> ⚠️ **СЕКРЕТ**: никогда не коммить в Git, не добавляй в frontend-код.

**Формат:** строка вида `0x4AAAAAAAAXXXXXXXXXX` (другой от Site Key)

**Где взять:** Та же страница Cloudflare Turnstile → **Secret Key**

**Куда вставить (ТОЛЬКО серверные ENV):**
- Firebase Functions / Cloud Run environment variable: `TURNSTILE_SECRET_KEY=...`
- Vercel → Project → Settings → Environment Variables → Production, если edge-route `/api/leads` будет проверять Turnstile напрямую

В текущем коде Firebase API читает именно `process.env.TURNSTILE_SECRET_KEY`. Если хочешь использовать
Firebase Secrets, сначала привяжи secret к функции в `onRequest({ secrets: [...] })`, иначе secret не попадёт
в `process.env`.

**Не добавляй как `NEXT_PUBLIC_*`** — иначе ключ утечёт в браузер.

**Что будет, если пустым:**  
Low-risk заявки принимаются без Turnstile. High-risk заявки с требованием CAPTCHA вернут
`captcha_unavailable`, потому что сервер не сможет проверить токен Cloudflare.

**Как проверить:**
- обычная заявка: `POST /api/leads` без `turnstileToken` должен пройти;
- повторная/быстрая заявка: API вернёт `{ "error": "captcha_required" }`;
- после прохождения Turnstile frontend повторит submit с `turnstileToken`;
- failed token даёт `{ "error": "captcha_failed" }`, без логирования секретов или токена.

---

### `TELEGRAM_DEFAULT_START_PARAM`

**Что это:** Реферальный параметр Telegram-бота по умолчанию.  
Когда пользователь открывает `https://t.me/LiderDriveBot?start=AYYUTE` — бот
получает `start=AYYUTE` и записывает его как `telegramStartParam` в лид.

Значение по умолчанию в проекте: `AYYUTE`

**Секретный ли?** Нет. Это просто метка для трекинга источника.

**Где используется:**
- Ссылки в Telegram на записаются с этим параметром
- Лид в Firestore получает `telegramStartParam: "AYYUTE"`, `referralCode: "AYYUTE"`

**Куда вставить:**  
Vercel → Environment Variables → `TELEGRAM_DEFAULT_START_PARAM=AYYUTE`

> **Важно об именовании:** в текущем коде это поле используется на сервере.
> Если нужно читать его в браузере (например, для динамической генерации Telegram-ссылки),
> переименуй в `NEXT_PUBLIC_TELEGRAM_DEFAULT_START_PARAM` и обнови все обращения
> к `process.env.NEXT_PUBLIC_TELEGRAM_DEFAULT_START_PARAM`.

---

### `TELEGRAM_BOT_TOKEN`

**Что это:** Токен доступа к Telegram Bot API. Нужен для отправки уведомлений
о новых заявках в Telegram-чат менеджеров.

> ⚠️ **СЕКРЕТ**: никогда не коммить. Кто получит — может управлять ботом.

**Формат:** `1234567890:ABCDEFGhijklmnop-XXXXXXXXXXXXXXXX`

**Где взять:**
1. Напиши @BotFather в Telegram
2. `/newbot` → придумай имя и username
3. BotFather даст токен — сохрани его

**Куда вставить:**
- Vercel → Environment Variables → `TELEGRAM_BOT_TOKEN`
- Firebase Functions: `firebase functions:secrets:set TELEGRAM_BOT_TOKEN`

---

### `TELEGRAM_LOG_CHAT_ID`

**Что это:** ID Telegram-чата или канала, куда бот будет присылать уведомления о новых лидах.

**Формат:** число (например `-1001234567890` для группы) или `@username` для канала

**Где взять:**
1. Создай группу или канал в Telegram
2. Добавь своего бота как администратора
3. Отправь сообщение в чат
4. Зайди на `https://api.telegram.org/bot{TOKEN}/getUpdates`
5. Найди `"chat": {"id": -1001234567890}` — это и есть chat_id

Или используй бот @userinfobot — просто напиши ему и он ответит твоим ID.

**Куда вставить:**  
Vercel + Firebase Functions Environment Variables → `TELEGRAM_LOG_CHAT_ID`

---

### Firebase конфиги (`NEXT_PUBLIC_FIREBASE_*`)

Эти переменные нужны для подключения Firebase Storage в браузере —
чтобы файлы документов загружались напрямую из браузера в Firebase Storage.

**Все они НЕ секретные** — Firebase устроен так, что API-ключ виден публично,
а доступ контролируется через Firebase Security Rules.

**Где взять все сразу:**
1. Firebase Console → твой проект (`lider-avtoschool`)
2. Шестерёнка (Project Settings) → раздел **Your apps**
3. Нажми иконку `</>` (Web app) или выбери существующее приложение
4. В разделе `firebaseConfig` увидишь все нужные значения

```javascript
const firebaseConfig = {
  apiKey: "...",           → NEXT_PUBLIC_FIREBASE_API_KEY
  authDomain: "...",       → NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  projectId: "...",        → NEXT_PUBLIC_FIREBASE_PROJECT_ID
  storageBucket: "...",    → NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  appId: "...",            → NEXT_PUBLIC_FIREBASE_APP_ID
};
```

**Куда вставить:**  
Vercel → Environment Variables (производственные и preview)

Для локальной разработки добавь в `.env`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=lider-avtoschool.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=lider-avtoschool
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=lider-avtoschool.firebasestorage.app
NEXT_PUBLIC_FIREBASE_APP_ID=1:xxx:web:xxx
```

**Что будет, если пустым:**  
Firebase Storage upload в форме заявки не работает. Форма всё равно принимает заявки,
но файлы документов не загружаются — только имена файлов сохраняются.

---

### `OPENAI_API_KEY`

**Что это:** Секретный ключ OpenAI API для работы AI-помощника на сайте.

> ⚠️ **СЕКРЕТ**: никогда не коммить.

**Где взять:** [platform.openai.com](https://platform.openai.com/) → API Keys → Create new key

**Куда вставить:**  
Vercel + Firebase Functions → `OPENAI_API_KEY`

**Рекомендуемая модель:** `gpt-4.1-mini` (уже задана в `OPENAI_MODEL`)

---

### Платёжные системы (`LIQPAY_*`, `FONDY_*`, `MONOBANK_TOKEN`)

Все три — секретные ключи платёжных провайдеров. Нужны, когда будешь
подключать реальные онлайн-платежи.

Сейчас в проекте API-заготовка, но реальная обработка платежей не активирована.

Вставлять только в Firebase Functions secrets, не в Vercel (платежи идут через API,
а не через Next.js).

---

## Как добавить переменные в Vercel

1. Войди на [vercel.com](https://vercel.com/)
2. Открой проект → **Settings** → **Environment Variables**
3. Для каждой переменной: Name + Value + выбери окружение (Production / Preview / Development)
4. После добавления новых переменных **нужно сделать новый деплой** (Deployments → Redeploy)

> Vercel не перечитывает переменные автоматически — нужен редеплой или `vercel --prod`.

---

## Как добавить секреты в Firebase Functions

```bash
# Установить значение секрета (вводится интерактивно, не видно в истории)
firebase functions:secrets:set TELEGRAM_BOT_TOKEN
firebase functions:secrets:set OPENAI_API_KEY

# Для текущей функции TURNSTILE_SECRET_KEY задаётся как Firebase/Cloud Run ENV.
# Если переводишь его в Firebase Secret, добавь binding в onRequest({ secrets: [...] }).

# Проверить список секретов
firebase functions:secrets:access TELEGRAM_BOT_TOKEN
```

---

## Email-уведомления о заявках

Новые заявки могут приходить не только в Telegram, но и на email.

### Вариант 1 — Resend (рекомендуется)

1. Зарегистрируйся на [resend.com](https://resend.com/)
2. Подтверди домен или разрешённый sender
3. Создай API Key → скопируй
4. Добавь прямые ENV/Secrets в Firebase Functions:

```env
LEAD_EMAIL_ENABLED=true
LEAD_EMAIL_TO=owner@example.com
LEAD_EMAIL_FROM="Лідер CRM <noreply@yourdomain.com>"
RESEND_API_KEY=re_xxxx
```

### Вариант 2 — SMTP (Gmail, собственный хостинг)

Для Gmail нужно App Password (двухфакторная аутентификация):
1. myaccount.google.com → Security → App passwords → Mail
2. Скопируй пароль приложения

```env
LEAD_EMAIL_ENABLED=true
LEAD_EMAIL_TO=owner@gmail.com
LEAD_EMAIL_FROM="Лідер CRM <your@gmail.com>"
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
```

### Адреса получателей по филиалам

Можно задать разный email для каждого филиала:

```env
LEAD_EMAIL_TO=general@example.com       # общий fallback
LEAD_EMAIL_TO_KYIV=kyiv@example.com
LEAD_EMAIL_TO_SLOVIANSK=sloviansk@example.com
LEAD_EMAIL_TO_KRAMATORSK=kramatorsk@example.com
LEAD_EMAIL_TO_DNIPRO=dnipro@example.com
```

Если филиальный email не задан — заявка приходит на `LEAD_EMAIL_TO`.

### Как добавить email ENV в Firebase Functions

```bash
firebase functions:secrets:set RESEND_API_KEY
# или
firebase functions:secrets:set SMTP_PASS
```

Обычные переменные добавляй как прямые environment variables для функции `api`:

```env
LEAD_EMAIL_ENABLED=true
LEAD_EMAIL_TO=owner@example.com
LEAD_EMAIL_FROM="Лідер CRM <noreply@yourdomain.com>"
LEAD_EMAIL_CC=
LEAD_EMAIL_PROVIDER=resend
```

`LEAD_EMAIL_PROVIDER` оставлен как подсказка для людей. Код сам выбирает Resend, если есть `RESEND_API_KEY`; иначе пробует SMTP при наличии `SMTP_HOST`, `SMTP_USER` и `SMTP_PASS`.

Firebase Console → Functions → `api` → Configuration → Add variable.

### Диагностика email

API не ломает создание лида и Telegram, если email выключен или провайдер упал. В ответе `/leads` и в записи Firestore сохраняются:

```txt
emailNotificationStatus: sent | skipped | failed
emailNotificationProvider: resend | smtp
emailNotificationReason: disabled | no_transport | missing_to | provider_error
emailNotificationMessageId
emailNotificationError
```

Проверки:

```bash
firebase functions:log --only api --limit 100
curl https://europe-west1-lider-avtoschool.cloudfunctions.net/api/health/email
curl -X POST https://europe-west1-lider-avtoschool.cloudfunctions.net/api/health/email/test-lead
```

Частые причины, почему Telegram работает, а email нет: `LEAD_EMAIL_ENABLED=false`, не задан `LEAD_EMAIL_TO`, нет `RESEND_API_KEY`/SMTP-транспорта, `LEAD_EMAIL_FROM` не подтверждён в Resend или SMTP отклоняет отправителя.

---

## Минимум для запуска в production

```env
# Vercel
NEXT_PUBLIC_SITE_URL=https://lider.bdslab.net
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=lider-avtoschool
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=lider-avtoschool.firebasestorage.app
NEXT_PUBLIC_FIREBASE_APP_ID=...
API_URL=https://europe-west1-lider-avtoschool.cloudfunctions.net/api
OPENAI_API_KEY=...
TELEGRAM_BOT_TOKEN=...
TELEGRAM_LOG_CHAT_ID=...
TELEGRAM_DEFAULT_START_PARAM=AYYUTE

# Firebase Functions (дополнительно к Telegram)
LEAD_EMAIL_ENABLED=true
LEAD_EMAIL_TO=owner@example.com
RESEND_API_KEY=...
```
