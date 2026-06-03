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
- **CAPTCHA safe mode**: ✅ env-флаг `LEAD_CAPTCHA_ENABLED=false` (default off) — заявки відправляються без CAPTCHA. Включається через Vercel + Firebase Functions ENV. Пороги підвищено: score≥5, ipAttempts≥5, phoneAttempts≥4 (було 3/2/2).
- **source enum виправлено**: ✅ `sticky_mobile`, `floating_phone`, `branch_card`, `hero_cta`, `footer`, `about`, `cta_link`, `documents` додані в `leadFormSchema` та `leadSources`. Firebase Functions перезадеплоєно з актуальним enum.
- **`normalizeLeadSource()` додано**: ✅ будь-який невідомий UI-source тепер нормалізується до `website` замість того, щоб ламати заявку. Оригінальний source зберігається у `sourceDetail`. Захист від майбутніх нових CTA. Реалізовано у `packages/shared`, web route та Firebase Functions.
- **Firebase Functions перезадеплоєно (2026-06-03)**: ✅ `https://api-jd6b6vy57a-ew.a.run.app` — актуальний enum + normalizeLeadSource. Заявки більше не падають через `hero_cta` або будь-який інший CTA-source.
- **Admin DEMO-режим**: жовтий банер, "DEMO — зразкові дані", `ADMIN_ROLES_GUIDE.md`.
- **MOBILE_RELEASE_GUIDE_RU.md**: повний гайд по збірці APK/AAB/IPA через EAS.
- **LOCAL_ANDROID_BUILD_RU.md**: ✅ інструкція локальної збірки APK для BlueStacks (Windows, без EAS) — JDK 17, Android Studio, gradle assembleDebug, adb install.
- **Driver Club (мобільний killer feature)**: ✅ нова вкладка «Клуб» — щоденний тест ПДР, streak + progress bar, маскот «Лідик» (адаптивні повідомлення за streak), 25 нагород «Лідер Клуб» по 7 категоріях (earned/locked + progress bars + фільтри), клубна стрічка (4 пости від інструкторів/випускників з лайками), підказка дня, чек-лист водія, реферальний блок. Mock-дані готові до підключення Firestore backend.
- **Нагороди Driver Club**: ✅ 25 awards: streak (3/7/14/30/100 днів), tests (ПДР-ніндзя, знавець, чемпіон), learning (перший урок, теорія), practice (місто, паркування, самурай), community (клубний голос, story, 100 реакцій), safety (без паніки, спокійний), graduation (права в Дії, машина, маршрут, випускник). Фільтри по категоріях в UI.
- **Маскот «Лідик»**: ✅ адаптивні повідомлення залежно від streak + 9 станів (loading/error/empty/lost-streak/success/no-internet/test-failed/test-passed/story-posted). Компонент `MascotMessage` — reusable по всьому додатку.
- **Лідер Stories (Telegram-стиль, без музики)**: ✅ горизонтальна лента historій, viewer з повноекранним переглядом (кольоровий фон по тону), реакції, теги. 5 mock stories. Create Story sheet з шаблонами (без медіа upload поки). Музика ПРИБРАНА з MVP — Stories як Telegram Stories. `musicTitle`, `mockMusicTracks`, `storyMusicTracks` видалено з UI та типів.
- **Lidyk AI-помічник**: ✅ картка у Клубі з 5 швидкими підказками (Поясни правило / Тест 1 хвилину / Перший урок / Практика / Іспит), mock відповіді. Future: підключення OpenAI/Claude API.
- **Клубна стрічка Threads/X-like**: ✅ `ClubThreadPost` тип з reactions {like, fire, clap} + commentsCount, ready для Firestore. UI з лайками і тегами.
- **`MascotMessage` component**: ✅ reusable — emoji + title + message + tone (neutral/success/warning/error). Використовується в тесті дня та нагородах.
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
| CAPTCHA (опціонально) | `LEAD_CAPTCHA_ENABLED=true` у Vercel + Firebase Functions ENV щоб увімкнути. Без нього — off. `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (Vercel) + `TURNSTILE_SECRET_KEY` (Firebase Functions secrets) |
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

- **EAS credentials**: Google Play Console ($25 once) + Apple Developer ($99/рік). Гайд: `MOBILE_RELEASE_GUIDE_RU.md`.
- **Локальна збірка APK**: ✅ `LOCAL_ANDROID_BUILD_RU.md` — збірка для BlueStacks без EAS, потрібні JDK 17 + Android Studio + Gradle.
- **Push-повідомлення**: `expo-notifications` + FCM token registration.
- **Реальна синхронізація Driver Club**: streak, нагороди, checklist, stories → Firestore після запуску в stores. Типи `ClubAward`, `ClubStory`, `ClubThreadPost`, `MascotStateId` готові.
- **Firebase мобільний**: `google-services.json` / `GoogleService-Info.plist` потрібні для production build.
- **AI API**: ✅ OpenAI підключено через Firebase Functions `/ai/lidyk` + Vercel proxy. Ключ у `.env.lider-avtoschool`. Модель: `gpt-4o-mini` (fallback від `OPENAI_MODEL`).
- **Media upload for Stories**: Firebase Storage для фото/відео — після модерації.
- **Модерація**: Stories і лента потребують перегляду перед публічним запуском. Кнопка "Поскаржитись" + панель у admin.
- **Music licensing**: ❌ НЕ входить у MVP. Stories без музики (як Telegram). Музику можна додати пізніше через royalty-free каталог. `expo-av` не встановлено. Детально: `MOBILE_MUSIC_STORIES_RU.md`.
- **APK build**: ✅ Проект перенесено на `C:\Avtoschool_APP\` (без проблемних символів). `npm install` після переносу виправив broken symlinks workspace. Android build потребує `expo prebuild` + `gradlew assembleDebug`. Детально `LOCAL_ANDROID_BUILD_RU.md`.
- **APP_ICON_PROMPT_RU.md**: ✅ промт для генерації іконки додатку (4 варіанти: мінімал, динамік, преміум, маскот).
- **MOBILE_PRODUCT_ROADMAP_RU.md**: ✅ дорожня карта 10 фаз: MVP → Driver Club → Stories → Push → Firestore → Модерація → Монетизація → Telegram → Privacy → Release.
- **Маскот реальна картинка**: ✅ `maskot_test.png` та `app_logo_test.png` скопійовано в `apps/mobile/assets/`. `app.config.ts` оновлено: `icon`, `splash`, `adaptiveIcon.foregroundImage`. Маскот Лідик — червоний автомобіль з очима — використовується у MascotCard, LidykAssistant header, loading/response states, Create Story sheet.
- **Lidyk AI — реальний endpoint**: ✅ Firebase Functions `/ai/lidyk` — приймає питання, викликає OpenAI GPT-4o-mini з system prompt Лідика, повертає `{answer, mode}`. Vercel proxy `/api/ai/lidyk` з rate limit 15 req/хв/IP. Mobile `askLidyk()` у `apps/mobile/lib/api.ts` — 15s timeout, fallback на мережеву помилку. UI: TextInput + quick prompts + loading state + response з маскотом.
- **MOBILE_MUSIC_STORIES_RU.md**: ✅ оновлено — музика НЕ входить у MVP, Stories робляться без музики як Telegram Stories. Майбутня музика — тільки через royalty-free/licensed каталог, без Spotify/Apple Music embedding.
- **Club Feed розширено**: ✅ 6 постів (мем "не заглохнемо", новини набору Краматорськ) + 2 нові шаблони в clubFeedPosts.
- **Локальна збірка APK**: ✅ **BUILD SUCCESSFUL** (2026-06-03). `expo prebuild --clean` + `gradlew assembleDebug` з `C:\Avtoschool_APP\`. APK: `apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk` (144 MB). Встановлення: `adb connect 127.0.0.1:5555 && adb install -r <шлях до APK>`. Детально у `LOCAL_ANDROID_BUILD_RU.md`.

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
