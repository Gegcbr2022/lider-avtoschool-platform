# Bugs & Risks — Автошкола «Лідер» (2026-06-10)

Статусы: ✅ исправлено в этой сессии · 🔧 нужна доработка (агент) · 👤 действие владельца · 🔍 верифицировать.

## ⛔ Приёмка Opus (2026-06-10) — ветка `codex/sprint-2-booking` НЕ готова к merge

Статика зелёная (typecheck/lint/test — все workspace, exit 0; рейтинг и бронь верифицированы на
`emulator-5554` в light+dark). Но merge заблокирован — **блокеры**:

1. **Б-01 регрессирует при merge as-is.** Коммит-версия `_layout.tsx` вешает на Профіль бейдж
   `items.filter(!readAt)` — БЕЗ фильтра kind. Фильтр `daily-test/streak` лежит **только в рабочем
   дереве (не закоммичен)**. На `main` бейджа не было вовсе → merge сейчас вернёт фантомную «1».
2. **Большой объём работы не закоммичен.** Незакоммичены: фильтр бейджа, hero-редизайн главной
   (`index.tsx`), Crashlytics (`_layout.tsx`/`chat`/`assistant`/`booking`/`notifications.ts`),
   `package.json` (dep crashlytics), `android/*build.gradle` (плагины). Файл
   `apps/mobile/lib/crashlytics.ts` — **untracked**, но его импортит код → без `git add` сборка упадёт.
3. **Hero-главная и фикс бейджа НЕ проверены на пересобранном APK.** Единственный скрин главной
   (`qa_now.png`, 00:55) показывает СТАРЫЕ 4 сжатых квадрата и фантомную «1» на Профіль.
4. **`test:rules` локально НЕ выполнен** — нужен JDK 21 (локально 17): `firebase-tools no longer
   supports Java version before 21`. Правила прошли только статическую вычитку; их прогон — на CI (jdk 21).
5. **Секреты в истории git.** Удалённый `.env_vercel` (untrack ✅) содержал реальные
   `TURNSTILE_SECRET_KEY`, `SENTRY_DSN`, `POSTHOG_KEY` — они остаются в истории → 👤 **ротация ключей**.

Порядок разблокировки: (a) закоммитить рабочее дерево + `git add crashlytics.ts`; (b) пересобрать APK,
ADB-verify главной (2×2 hero) и Профіль (бейдж не горит) в light+dark, logcat без FATAL;
(c) прогнать `test:rules` на JDK 21; (d) владельцу — ротировать утёкшие ключи.

## S2 / S3 Спринти (Game Loop & Lidyk)

✅ **Дуелі ПДР** додано до міні-ігор (tests.tsx) як імітація режиму з суперником.  
✅ **Слабкі теми** обробляються через "Роботу над помилками" (`startMistakes`).  
✅ **Агрегація Рейтингу (Тиждень/Місяць)** впроваджена (`firestore.ts` зберігає `stats_WXX` та `stats_YYYY-MM`). Фільтри у `club.tsx` розблоковано.  

Поточний стан: Готово до Android QA (фінальна збірка APK та `adb monkey`).

## P0 — критично

| # | Баг/риск | Где | Причина | Исправление | Статус |
|---|---|---|---|---|---|
| B-01 | Фантомный бейдж «1» на вкладке Профіль | `app/(tabs)/_layout.tsx:65-80`, `app/(tabs)/profile.tsx:333-346`, `lib/notifications.ts:413-462` | Бейдж = кол-во unread в локальном inbox. Рекуррентные нуджи `daily-test` (19:00) и `streak` (20:30) при доставке пишутся в inbox как непрочитанные; пометить read можно только открыв Профіль→Сповіщення. Итог — «1» горит всегда. | Фильтр `kind!==daily-test/streak` есть **только в рабочем дереве**. Коммит-версия `_layout.tsx:71` считает все unread → merge as-is вернёт «1». | ⛔ фикс НЕ закоммичен + не проверен на rebuild |
| B-02 | App Check 403 «App attestation failed» | logcat `RNFBAppCheck`; `lib/appCheck.ts` | Play Integrity на эмуляторе не зарегистрирован как debug-token; на устройствах нужен SHA + (если enforce) корректная аттестация | Зарегистрировать debug-token; решить enforce vs monitor | 👤 (см. FIREBASE_SETUP) |
| B-03 | Нет production keystore (debug-подпись) | `apps/mobile/eas.json`, `android/` | Релиз подписан debug-ключом | Создать upload keystore, настроить EAS/gradle signing | 👤 |
| B-04 | Эквайринг — стуб | `apps/api/src/payment-providers.ts` | Нет провайдера/ключей | Monobank Acquiring sandbox→prod + вебхук-подпись | 👤 ключи / 🔧 код |

## P1 — важно

| # | Баг/риск | Где | Причина | Исправление | Статус |
|---|---|---|---|---|---|
| B-05 | Карточки «Тренажер/Лідік/Чат/Клуб» сжаты | `app/(tabs)/index.tsx` (QUICK_ACTIONS) | 4 квадрата `flex:1`, эмодзи 24 + текст 11px, ~76px шириной | 2×2 премиум-карточки: иконка-тайл, заголовок 15, подзаголовок 12, акцент, прогресс на Тренажёре | ✅ (rebuild+verify) |
| B-06 | Рейтинг ПДР: solo/empty не обыгран, нет подиума/закрепления, янтарный акцент | `app/(tabs)/club.tsx:942+` | Простой список; сортировка только по критерию; `colors.warning` вместо `colors.red` | Подиум топ-3, sticky «Ваше місце #N» + дельта, окна (тиждень/місяць/всі с честным disclaimer), порог `≥20` (ліга Новачки), бренд-красный/золото, solo/empty-CTA «Запросити друзів», реплики Лідіка | ✅ закоммичено + верифицировано на устройстве (light+dark) |
| B-07 | Рекуррентные daily/streak хранят старый `readAt` при повторной доставке | `lib/notifications.ts:116-125` | merge сохраняет `readAt` существующего id → нудж не «загорается» снова | После B-01 на бейдж не влияет; для «центра» — сбрасывать readAt при доставке нового нуджа | 🔧 (low) |
| B-08 | RNFirebase namespaced API deprecated (v22) | весь `lib/*` (messaging(), appCheck(), и т.д.) | Старый namespaced стиль | Миграция на модульный `getApp()`/`getToken()` | 🔧 (tech debt) |
| B-09 | Бронь без реального календаря/подтверждения | `app/booking.tsx`, `lib/firestore.ts`, `bookingSlots`/`bookings` | Нет слотов/статус-флоу | Реальные `bookingSlots` (Firestore, без мока), `pending→confirmed→completed/cancelled`, rules-гард на переходы, push инструктору/учню (`onBookingCreated`/`onBookingStatusChanged`) | ✅ закоммичено + верифицировано (qa_booking_slots) |
| B-10 | Нет Crashlytics/Analytics | `lib/crashlytics.ts`, `_layout.tsx`, `lib/notifications.ts` | Не подключены | Lazy no-op обёртка + хлебные крошки auth/push; gradle-плагины + dep | ⛔ код есть, но НЕ закоммичен; `crashlytics.ts` untracked |

## P2 — улучшения

| # | Тема | Где | Действие |
|---|---|---|---|
| B-11 | Возможные hardcoded-цвета в тестах | `app/(tabs)/tests.tsx` (45 хардкодов — проверить, многие легитимны на цветном фоне) | Spot-check light/dark, перевести нелегитимные на токены |
| B-12 | Гость и мок-прогресс (BUG-058) | `learning.tsx`/`club.tsx` | Убедиться, что гость видит empty-state+CTA, не мок |
| B-13 | Веб-кабинет клиента отсутствует | `apps/web` | E9 roadmap |
| B-14 | CMS ПДР/курсов | контент в коде | E10 roadmap |
| B-15 | Мусор в корне репо (~50 png/xml/log) | `/*.png`, `/ui*.xml`, `*-debug.log` | `.gitignore` + чистка (не трогать `build_*.apk` без причины) |

## Активные «горящие» строки кода (для агентов)

- `app/(tabs)/_layout.tsx:70` — фильтр бейджа (исправлен; не откатывать).
- `app/(tabs)/index.tsx` QUICK_ACTIONS + рендер 2×2 (исправлен; полировать визуал можно).
- `app/(tabs)/club.tsx:942` `LeaderboardView` — точка рерайта рейтинга.
- `lib/notifications.ts:97-125` — логика inbox/emit (осторожно, влияет на бейдж).
