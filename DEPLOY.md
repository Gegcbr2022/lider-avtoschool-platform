# Деплой Автошкола «Лідер»

Документ описує весь процес деплою монорепозиторію: сайт на Vercel, API + Firestore на Firebase, мобільний додаток через Expo EAS.

---

## Передумови

| Інструмент | Версія | Як встановити |
|---|---|---|
| Node.js | 20+ | [nodejs.org](https://nodejs.org) |
| npm | 10+ | разом з Node |
| Vercel CLI | актуальна | `npm i -g vercel` |
| Firebase CLI | актуальна | `npm i -g firebase-tools` |
| Expo CLI / EAS | актуальна | `npm i -g eas-cli` |

---

## 1. Підготовка ENV

### 1.1. Web (Vercel)

Потрібні змінні в Vercel → Settings → Environment Variables:

```
NEXT_PUBLIC_SITE_URL=https://lider.bdslab.net
APP_DOMAIN=lider.bdslab.net
ALLOWED_ORIGINS=https://lider.bdslab.net,https://admin.lider.bdslab.net
API_URL=https://europe-west1-lider-avtoschool-prod.cloudfunctions.net/api
FIREBASE_PROJECT_ID=lider-avtoschool-prod
FIREBASE_STORAGE_BUCKET=lider-avtoschool-prod.firebasestorage.app
NEXT_PUBLIC_GA4_ID=G-XXXXXXXXXX
NEXT_PUBLIC_TURNSTILE_SITE_KEY=...
TURNSTILE_SECRET_KEY=...
TELEGRAM_BOT_TOKEN=...
TELEGRAM_LOG_CHAT_ID=...
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4.1-mini
```

> Змінні без `NEXT_PUBLIC_` — серверні, не потрапляють у браузер.

### 1.2. API (Firebase Functions)

Задаються через `firebase functions:config:set` або `.env.production` у `apps/api`:

```
ALLOWED_ORIGINS=https://lider.bdslab.net
TELEGRAM_BOT_TOKEN=...
TELEGRAM_LOG_CHAT_ID=...
TELEGRAM_WEBHOOK_SECRET=...
OPENAI_API_KEY=...
```

### 1.3. Mobile (Expo EAS)

Задаються в `eas.json` або Expo dashboard (eas.expo.dev):

```
API_URL=https://europe-west1-lider-avtoschool-prod.cloudfunctions.net/api
```

---

## 2. Деплой Web → Vercel

### Перший деплой

```bash
# Встановити залежності
npm install

# Запустити перевірки
npm run lint
npm run typecheck

# Прив'язати проект до Vercel (один раз)
vercel link

# Задати ENV у Vercel (один раз, або через UI)
vercel env add NEXT_PUBLIC_SITE_URL production
# ... решта змінних аналогічно

# Збудувати і задеплоїти
npm run build --workspace @lider/web
vercel --prod
```

### Повторний деплой

```bash
npm install
npm run lint
npm run typecheck
npm run build --workspace @lider/web
vercel --prod --yes
```

### Конфігурація Vercel

Файл `vercel.json` у корені вже налаштований. Якщо використовується Vercel dashboard:

- **Framework Preset:** Next.js
- **Root Directory:** `apps/web`
- **Build Command:** `cd ../.. && npm run build --workspace @lider/web`
- **Output Directory:** `.next`
- **Node.js Version:** 20.x

---

## 3. Деплой Firebase (API + Firestore + Storage)

### Авторизація

```bash
firebase login
firebase use production   # або назва вашого production alias
```

### Збірка і деплой API (Functions)

```bash
npm install --workspace @lider/api
npm run build --workspace @lider/api
firebase deploy --only functions
```

### Деплой Firestore rules і indexes

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

### Деплой Storage rules

```bash
firebase deploy --only storage
```

### Повний деплой Firebase одною командою

```bash
npm run build --workspace @lider/api
firebase deploy --only functions,firestore:rules,firestore:indexes,storage
```

### Перевірка після деплою

```bash
# Перевірити health endpoint
curl https://europe-west1-lider-avtoschool-prod.cloudfunctions.net/api/health
# Очікуваний результат: {"status":"ok","..."}
```

---

## 4. Деплой Mobile → Expo EAS

### Перший налаштунок (один раз)

```bash
cd apps/mobile
eas login
eas build:configure
```

### Збірка для Android

```bash
eas build --platform android --profile production
```

### Збірка для iOS (потрібен macOS + Xcode або EAS cloud)

```bash
eas build --platform ios --profile production
```

### Публікація OTA-оновлення (без збірки)

```bash
eas update --branch production --message "Fix: lead form validation"
```

> **Увага:** Публікація в Google Play / App Store потребує власного акаунту і credentials. Без них збірки доступні як APK/IPA для тестування.

---

## 5. Smoke QA після деплою

Після кожного production деплою пройди:

### Сайт (https://lider.bdslab.net)

| Перевірка | Очікуваний результат |
|---|---|
| Головна (`/`) | Завантажується без помилок |
| Hero section | Картинка, заголовок, CTA-кнопки |
| Категорії (`/categories`) | Список усіх категорій і цін |
| Документи (`/documents`) | Список документів для вступу |
| Гордість (`/pride`) | Галерея фото випускників |
| FAQ (`/faq`) | Акордеон розкривається |
| Контакти (`/contacts`) | Форма, адреси, Telegram |
| Форма заявки | Відправляється, показує успіх |
| Popup | З'являється через 25 сек |
| Telegram CTA | Посилання відкриваються |
| Переключатель мови | UA / RU / EN переключаються |
| Мобільне меню | Відкриває і закриває |
| 404 | Показує кастомну сторінку |
| Console errors | Немає JS-помилок |
| Mobile 360px | Немає горизонтального scroll |
| Tablet 768px | Нормальна сітка |
| Desktop 1440px | Нормальна сітка |

### API

```bash
curl -X POST https://europe-west1-lider-avtoschool-prod.cloudfunctions.net/api/leads \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","phone":"0501234567","city":"Київ","category":"B","source":"website","status":"new","consentAccepted":true,"createdAt":"2026-01-01T00:00:00Z"}'
```

Очікується `200` або `201` з `leadId`.

---

## 6. Rollback

### Web (Vercel)

У Vercel dashboard → Deployments → вибрати попередній → «Promote to Production».

Або через CLI:

```bash
vercel rollback [deployment-url]
```

### Firebase Functions

```bash
firebase functions:rollback
```

> Якщо `rollback` недоступний — задеплой попередній git tag:
> ```bash
> git checkout v0.X.X
> npm run build --workspace @lider/api
> firebase deploy --only functions
> ```

### Firebase Firestore rules

```bash
git checkout HEAD~1 -- infrastructure/firebase/firestore.rules
firebase deploy --only firestore:rules
```

---

## 7. Checklist перед кожним production деплоєм

- [ ] `npm run lint` — без помилок
- [ ] `npm run typecheck` — без помилок
- [ ] `npm run build` — успішна збірка
- [ ] Немає секретів у git diff
- [ ] ENV змінні задані у Vercel/Firebase
- [ ] PR змерджений в `main`
- [ ] Smoke QA пройдено після деплою
