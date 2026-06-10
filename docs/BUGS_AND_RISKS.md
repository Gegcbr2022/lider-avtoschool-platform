# Bugs & Risks — Автошкола «Лідер» (2026-06-11)

Статусы: ✅ исправлено в этой сессии · 🔧 нужна доработка (агент) · 👤 действие владельца · 🔍 верифицировать.

## 🟢 Opus Project-Lead review (2026-06-11) — ветка `opus/sprint-2-game-loop`

Контекст: предыдущие блокеры приёмки (`codex/sprint-2-booking`) на **этой** ветке закоммичены:
бейдж-фикс, Crashlytics, hero главной, game loop + агрегация рейтинга. `typecheck` / `lint` /
`test` / `test:rules` (JDK 21) — exit 0. Что сделано/осталось:

- ✅ **Mock-данные в «Навчання» убраны.** `learning.tsx` показывал жёстко зашитые «Крок 1 з 4 / 25%»
  и статичную реплику Лідіка → нарушение правила «без мок-данных на проде». Теперь экран читает
  реальные `getUserStats` + `buildPdrCoachPlan(loadPdrProgress)`: этап дороги, % готовности, реплика
  Лідіка и блок «Слабкі теми» вычисляются из данных; пустое состояние объясняет, как данные появятся.
- ✅ **Стейл-TODO в рейтинге удалён.** `club.tsx` нёс комментарий «aggregates не готовы», хотя
  `getLeaderboard(30, timeWindow)` уже подключён к сегмент-контролу и реальным `stats_<week/month>`.
- 🔧 **B-16 (P1): три карточки «Навчання» ведут в один и тот же экран.** «Тренування», «Пробний іспит»
  и (ранее) «Слабкі теми» все делают `router.push("/(tabs)/tests")` без параметра, а `tests.tsx` не
  читает params → всегда открывается общее меню. Нужно: `tests.tsx` принимает `?mode=exam|mistakes|topic`
  и авто-стартует соответствующий режим. Отдано Sonnet (см. `SONNET_NEXT_SESSION_PROMPT.md`).
- 🔧 **B-17 (P2): LidikGuide рендерит только статичный текст.** Концепт «Лідік-проводник» наполовину:
  компонент есть, но реплики хардкодятся в каждом экране. Стоит вынести `getContextualLidikTip(screen, stats)`
  в `lib/` для единых контекстных подсказок. Отдано Sonnet.
- ✅ **История `.env_vercel` очищена локально через `git-filter-repo`.** Точный путь `.env_vercel`
  больше не находится в `git log --all -- .env_vercel` и `git rev-list --objects --all`.
  После force-push remote-ветки также должны указывать только на очищенную историю.
- 👤 Блокеры релиза без изменений: App Check debug-token (B-02), prod keystore (B-03), эквайринг (B-04),
  ротация утёкших ключей. Очистка истории не отменяет ротацию и возможную зачистку GitHub cache/support.



## ✅ Закрытие приёмки Opus (2026-06-11)

Блокеры из приёмки 2026-06-10 закрыты на ветке `opus/sprint-2-game-loop`:

1. **Б-01 не регрессирует при merge.** Фильтр `daily-test/streak` и сброс уведомлений на focus
   закоммичены; профильный бейдж больше не должен гореть от ежедневных nudges.
2. **Незакоммиченный объём добран.** Hero главной, Crashlytics, mobile deps/gradle-плагины,
   `apps/mobile/lib/crashlytics.ts` и docs находятся в истории ветки.
3. **Проверки пройдены локально:** `npm run typecheck`, `npm run lint`, `npm test`,
   `npm run test:rules` с временным `JAVA_HOME=C:\Program Files\Java\jdk-21`.
4. **Секретный файл очищен из истории.** `.env_vercel` удалён из всех локальных refs через
   `git-filter-repo --path .env_vercel --invert-paths`; перед релизом владелец всё равно ротирует ключи.

Осталось для финальной release-приёмки: пересборка APK + ADB-smoke/logcat на установленном APK после merge.

## S2 / S3 Спринти (Game Loop & Lidyk)

✅ **Дуелі ПДР** додано до міні-ігор (tests.tsx) як імітація режиму з суперником.  
✅ **Слабкі теми** обробляються через "Роботу над помилками" (`startMistakes`).  
✅ **Агрегація Рейтингу (Тиждень/Місяць)** впроваджена (`firestore.ts` зберігає `stats_WXX` та `stats_YYYY-MM`). Фільтри у `club.tsx` розблоковано.  

Поточний стан: Готово до Android QA (фінальна збірка APK та `adb monkey`).

## P0 — критично

| # | Баг/риск | Где | Причина | Исправление | Статус |
|---|---|---|---|---|---|
| B-01 | Фантомный бейдж «1» на вкладке Профіль | `app/(tabs)/_layout.tsx:65-80`, `app/(tabs)/profile.tsx:333-346`, `lib/notifications.ts:413-462` | Бейдж = кол-во unread в локальном inbox. Рекуррентные нуджи `daily-test` (19:00) и `streak` (20:30) при доставке пишутся в inbox как непрочитанные. | Фильтр `kind!==daily-test/streak` + очистка на focus профиля закоммичены. | ✅ закоммичено; 🔍 финальный APK-smoke после merge |
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
| B-10 | Нет Crashlytics/Analytics | `lib/crashlytics.ts`, `_layout.tsx`, `lib/notifications.ts` | Не подключены | Lazy no-op обёртка + хлебные крошки auth/push; gradle-плагины + dep | ✅ закоммичено; 🔍 проверить нативную отправку в release APK |

## P2 — улучшения

| # | Тема | Где | Действие |
|---|---|---|---|
| B-11 | Возможные hardcoded-цвета в тестах | `app/(tabs)/tests.tsx` (45 хардкодов — проверить, многие легитимны на цветном фоне) | Spot-check light/dark, перевести нелегитимные на токены |
| B-12 | Гость и мок-прогресс (BUG-058) | `learning.tsx`/`club.tsx` | ✅ `learning.tsx` читает реальные `getUserStats` + `buildPdrCoachPlan(loadPdrProgress)`; гость видит честный empty-state |
| B-13 | Веб-кабинет клиента отсутствует | `apps/web` | E9 roadmap |
| B-14 | CMS ПДР/курсов | контент в коде | E10 roadmap |
| B-15 | Мусор в корне репо (~50 png/xml/log) | `/*.png`, `/ui*.xml`, `*-debug.log` | `.gitignore` + чистка (не трогать `build_*.apk` без причины) |

## Активные «горящие» строки кода (для агентов)

- `app/(tabs)/_layout.tsx:70` — фильтр бейджа (исправлен; не откатывать).
- `app/(tabs)/index.tsx` QUICK_ACTIONS + рендер 2×2 (исправлен; полировать визуал можно).
- `app/(tabs)/club.tsx:942` `LeaderboardView` — точка рерайта рейтинга.
- `lib/notifications.ts:97-125` — логика inbox/emit (осторожно, влияет на бейдж).
