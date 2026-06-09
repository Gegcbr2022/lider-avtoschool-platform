# Project Audit — Автошкола «Лідер» (2026-06-10, Opus 4.8)

> Свежий аудит **по факту кода + живого APK на эмуляторе** (`emulator-5554`, пакет
> `ua.lider.avtoschool`). Дополняет, а не заменяет
> `C:\AI_Brain\Projects\Lider\MasterPlan_Opus_Audit_2026-06-08.md`. Что изменилось с 08.06:
> push реально внедрён (notifee+FCM), 2FA/TOTP для админа добавлен, light-тема починена,
> веб-копия улучшена. Соответственно часть P0/P1 из прошлого аудита **закрыта**.

## 1. Общее состояние

Зрелый mobile-first super-app для автомобилиста (логика Monobank, ≤3 нажатия). Монорепо
npm-workspaces: `apps/{mobile,web,admin,api}` + `packages/{shared,types,ui,config}`. Ядро
качественное; покрытие ТЗ ~50–55%. Приложение **стабильно** — за сессию ADB не зафиксировано
ни одного краша/FATAL. Основные проблемы сейчас — не безопасность (она закрыта), а:
1. **Продуктовые мелочи, бьющие по доверию** (фантомный бейдж «1», бедные карточки на главной,
   пустой/несбалансированный рейтинг).
2. **Релизная готовность** (App Check на устройствах, prod keystore, эквайринг, контент).

## 2. Что изучено

| Область | Пути | Что найдено | Вывод |
|---|---|---|---|
| Монорепо | `package.json`, `apps/*`, `packages/*` | npm workspaces, RN19, Expo Router | Структура здоровая |
| Mobile home | `apps/mobile/app/(tabs)/index.tsx` | Гость/Студент/Инструктор; quick-actions = 4 сжатых квадрата | Карточки переделаны (см. §4) |
| Профиль/бейдж | `app/(tabs)/_layout.tsx`, `app/(tabs)/profile.tsx`, `lib/notifications.ts` | Бейдж = unread inbox; нудж-напоминания дают вечную «1» | **Исправлено** (см. BUGS_AND_RISKS) |
| Рейтинг ПДР | `app/(tabs)/club.tsx:942` `LeaderboardView` | Реальные данные `getLeaderboard(30)`, без мока; нет подиума/закрепления/окон | Рекомендация рерайта (см. MOBILE_UX_AUDIT) |
| Темы | `lib/themeContext.tsx` | Палитры light/dark состоятельны, контраст ОК | Не P0; точечный spot-check tests.tsx |
| Notifications | `lib/notifications.ts` | notifee+FCM, AsyncStorage inbox, daily/streak триггеры | Работает; источник бейдж-бага |
| Firebase client | `lib/firebase.ts`, `lib/appCheck.ts` | App Check включён | На эмуляторе 403 attestation (см. FIREBASE_SETUP) |
| Web | `apps/web` | Лендинг+воронка, popup/menu зрелые | Не трогать без причины |
| Admin | `apps/admin` | CRM под AuthGate + TOTP MFA | Безопасность ОК |
| API | `apps/api/src/index.ts` | Express, Zod, rate-limit, TG-мост, AI | Зрелый; оплата — стуб |
| AI_Brain | `C:\AI_Brain\Projects\Lider\*` (38 файлов) | Полная база знаний + аудит 08.06 | Источник истины для стратегии |

## 3. Живой ADB-прогон (эмулятор)

- Устройство: `emulator-5554`, 1600×900 phys, 240 dpi. Приложение установлено и запущено
  (pid активен, MainActivity в фокусе). **Крашей нет.**
- Главный экран (light): карточка учня (Monobank-стиль) хороша; quick-actions сжаты — подтверждено.
- Клуб: «Запитай Лідика», «Клубна стрічка», «Рейтинг ПДР», «Нагороди 8/32», «Запросити друга» — ок.
- Рейтинг: одна запись (текущий юзер, 30%, 🥇 «ВИ») → solo-state не обыгран; акцент янтарный, не бренд-красный.
- Профиль: **бейдж «1» горит** (подтверждено визуально). Исправлено в коде.
- logcat: повторяющийся `E RNFBAppCheck ... 403 App attestation failed` каждые ~4 мин;
  warning о deprecated namespaced RNFirebase API (миграция v22).

## 4. Что уже сделано в этой сессии

| Файл | Изменение | Причина |
|---|---|---|
| `app/(tabs)/_layout.tsx` | Бейдж профиля игнорит `daily-test`/`streak` | Убирает вечную фантомную «1» |
| `app/(tabs)/index.tsx` | Quick-actions → 2×2 премиум-карточки (иконка-тайл, заголовок, подзаголовок, акцент, прогресс на Тренажёре) | Жалоба №11: «сжато/ущербно» |
| `docs/*` | Создан пакет актуальной документации | Сверка доков с кодом |

Проверка: `npm run typecheck --workspace @lider/mobile` — зелёный. APK не пересобран в этой
сессии → фиксы в исходниках, **требуют rebuild+ADB-verify** (команды — в ANDROID_QA_ADB.md).

## 5. Главные риски

- **P0 (доверие/релиз):** App Check на реальных устройствах (debug-token + решение enforce/monitor);
  prod keystore (сейчас debug-подпись); эквайринг-стуб (деньги).
- **P1:** контент (видео-уроки, полный текст ПДР) blocked на владельце; RNFirebase v22 deprecation;
  рейтинг-UX; solo/empty-states.
- **P2:** веб-кабинет клиента, CMS ПДР/курсов, страховка/юрист до конца, SMS OTP, агрегатор сервисов.

## 6. Главные возможности (где выстрелит продукт)

Геймификация «честная» (стрик, дуэли ПДР, экзамен-режим), Лідік как персональный наставник
(слабые темы → план), клуб/сторис (вирусность), реферальная программа, дорожная карта ученика
«до экзамена N днів». Подробно — `KILLER_FEATURES.md`.

См. также: [BUGS_AND_RISKS.md](BUGS_AND_RISKS.md), [MOBILE_UX_AUDIT.md](MOBILE_UX_AUDIT.md),
[ANDROID_QA_ADB.md](ANDROID_QA_ADB.md), [FIREBASE_SETUP_CHECKLIST.md](FIREBASE_SETUP_CHECKLIST.md),
[ROADMAP_2026.md](ROADMAP_2026.md), [AGENT_TASKS_CODEX.md](AGENT_TASKS_CODEX.md),
[AGENT_TASKS_SONNET.md](AGENT_TASKS_SONNET.md), [README_FOR_OWNER_RU.md](README_FOR_OWNER_RU.md).
