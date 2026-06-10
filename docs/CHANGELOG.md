# Changelog — Автошкола «Лідер»

Формат: дата · ветка · что вошло. Источник истины mobile — APK+ADB.

## 2026-06-10 — `codex/sprint-2-booking` (приёмка Opus: ⛔ не в main, есть блокеры)

### Закоммичено и верифицировано
- **Рейтинг ПДР переписан** (`app/(tabs)/club.tsx`): подиум топ-3, sticky «Ваше місце #N» с дельтой,
  переключатель окон (Тиждень/Місяць/Всі, с честным disclaimer «періоди в підготовці»), порог
  честности `≥20` ответов (ліга «Новачки»), бренд-красный + золото вместо янтарного, solo/empty-CTA
  «Запросити друзів», реплики Лідіка. Реальные данные `getLeaderboard`, без мока.
  Проверено на `emulator-5554` (light+dark).
- **Реальная бронь** (`app/booking.tsx`, `lib/firestore.ts`): слоты из `bookingSlots`, статус-флоу
  `pending→confirmed→completed/cancelled`, честный empty-state «Вільних слотів поки немає».
- **Push по брони** (`apps/api/src/index.ts`): `onBookingCreated` (инструктору), `onBookingStatusChanged`
  (учню); FCM-каналы chat/booking/training, HIGH priority, apns sound.
- **Firestore rules hardening**: гард переходов брони, `bookingSlots`, лимиты `userBonuses`
  (create ≤2, инкремент ≤2, balance ≤100k, history ≤20); `hasRole` через `token.get(...)`.
  Тесты `scripts/firestore-rules.test.mjs` (+233) — прогон на CI (JDK 21).
- **Admin TOTP MFA** (`apps/admin/components/auth-gate.tsx`).
- **Безопасность**: `.env_vercel` снят с трекинга + `.gitignore`; продакшен-логи в API подрезаны.
- **Web**: копирайт, hero-highlights, FAQ, reviews UX.
- **Light-тема**: фиксы контраста (`#1d4ed8`→`colors.info` и др.).

### В рабочем дереве, НЕ закоммичено (не войдёт в merge as-is)
- Фикс фантомного бейджа Профіль (фильтр `daily-test/streak`) — **критично**: без него merge регрессирует B-01.
- Hero-редизайн главной (`index.tsx`): карточка-герой Тренажёра с прогрессом, 3 side-actions, stagger+haptics.
- Crashlytics: `lib/crashlytics.ts` (**untracked**), инструментация auth/push, dep + gradle-плагины.

### Блокеры merge
См. «⛔ Приёмка Opus» в [BUGS_AND_RISKS.md](BUGS_AND_RISKS.md): закоммитить рабочее дерево
(+`git add crashlytics.ts`); пересобрать APK и ADB-verify главной/бейджа в light+dark; `test:rules` на
JDK 21; владельцу — ротировать утёкшие из истории ключи (`TURNSTILE_SECRET_KEY`, `SENTRY_DSN`, `POSTHOG_KEY`).

## 2026-06-10 — `opus/sprint-2-game-loop` (Рев'ю та фіналізація PDR Game Loop)

### Закоммічено та верифіковано
- **UI/UX Редизайн**: 
  - Головний екран перетворено на Dashboard з інтерактивними картками 2x2.
  - Навчання реструктуровано у "Дорожню карту" з підказками Лідіка.
  - Полагоджено вічний бейдж `1` у Профілі (`notificationBadge` обнуляється на `tabPress`).
- **Лідік AI-асистент**: Створено `LidikGuide` (`components/lidik-guide.tsx`) компонент. Лідік тепер супроводжує учня по всьому застосунку, а не лише в чаті.
- **PDR Game Loop (Тренажер ПДР)**: 
  - Додано режим "Дуель ПДР" (локальна симуляція 1v1 з AI-суперником або "знавцем правил" для тренування під тиском).
  - Слабкі теми тепер повноцінно працюють і генерують вибірку на основі помилок (`startMistakes`).
  - Успішна агрегація статистики в `userProfiles` з розподілом на тижні/місяці (`stats_WXX`, `stats_YYYY-MM`). 
  - Фільтри в рейтингу ПДР (Тиждень/Місяць/Всі) розблоковано та підключено до реальних агрегованих Firestore-даних.
- **Оцінка якості**: Typecheck, Lint, Test – всі зелені. Створено звіт та QA-документацію (`MOBILE_QA_REPORT_GEMINI.md`, `MOBILE_UI_CHANGES_GEMINI.md`).

### Блокери
Потребується збірка `assembleRelease` та верифікація за допомогою `adb monkey` з боку власника з доступом до реального Android-середовища.
