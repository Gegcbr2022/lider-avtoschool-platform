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
