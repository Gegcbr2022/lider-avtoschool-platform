# CLAUDE.md — проект «Лідер» (Lider Avtoschool)

Mobile-first super-app для автомобилиста (Украина), логика Monobank, бренд `#ff1e1e`, маскот «Лідік».

## Структура (монорепо npm-workspaces — только npm, lock = package-lock.json)
- `apps/mobile` — **главный продукт**: Expo Router, RN 19, Firebase (auth/firestore/storage/messaging+notifee).
- `apps/web` — Next.js лендинг + воронка (popup/menu/CTA зрелые — не трогать без причины).
- `apps/admin` — Next.js CRM под AuthGate + TOTP MFA.
- `apps/api` — Firebase Functions (Express, Zod, rate-limit, TG-мост, AI Лідік).
- `packages/{shared,types,ui,config}` — контент/i18n, типы, UI-токены, runtime-конфиг.

## Команды
```
npm run dev:mobile|dev:web|dev:admin|dev:api
npm run typecheck   # tsc, не эмитит JS
npm run lint | test | build
npm run test:rules  # Firestore rules (нужен эмулятор)
```
Mobile APK: `EXPO_NO_METRO_WORKSPACE_ROOT=1 NODE_ENV=production` + `cd apps/mobile/android && ./gradlew assembleRelease`.
Пакет `ua.lider.avtoschool`. QA через ADB — `docs/ANDROID_QA_ADB.md`.

## Ключевые файлы mobile
- `app/(tabs)/_layout.tsx` — таб-бар + бейджи (бейдж профиля фильтрует daily-test/streak — НЕ откатывать).
- `app/(tabs)/index.tsx` — главная (гость/студент/инструктор; quick-actions 2×2).
- `app/(tabs)/club.tsx` — Клуб: сторис, стрічка, рейтинг (`LeaderboardView`), нагороди, Лідік.
- `app/(tabs)/profile.tsx`, `app/(tabs)/tests.tsx`, `app/(tabs)/chat.tsx`, `app/(tabs)/learning.tsx`.
- `lib/{firebase,firestore,auth,notifications,theme,themeContext,appCheck,api,pdr-*}.ts`.

## Правила
- Украинский основной; **без мок-данных на проде**; ≤3 нажатия; премиально, без инфантильности.
- Не хардкодить цвета (токены темы), секреты только в env; проверять light **и** dark.
- Источник истины mobile = APK+ADB. После изменений: typecheck + ADB-smoke + logcat без FATAL.
- Сначала читать `docs/PROJECT_AUDIT_2026.md` и `docs/BUGS_AND_RISKS.md`; стратегия — `C:\AI_Brain\Projects\Lider\`.

## Известное состояние (10.06.2026)
Безопасность закрыта (2FA/бэкапы/rules). Push внедрён (notifee+FCM). Исправлено: фантомный бейдж «1»,
сжатые карточки главной. Открыто: рейтинг-UX рерайт, App Check на устройствах, prod keystore, эквайринг, контент.
