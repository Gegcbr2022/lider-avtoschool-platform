# Журнал изменений

## 2026-06-02

### Добавлено

- Новый премиальный landing для `apps/web` с усиленным hero, CTA, trust-фактами, этапами обучения, онлайн-блоком, инструкторами, автопарком и финальным CTA.
- Блок `Наші випускники` как современный аналог идеи `Гордість` с временными структурированными данными.
- Popup-заявка с задержкой, затемнением, закрытием, `Escape`, localStorage и повторным показом через время.
- Расширенные SEO-страницы: `avtoshkola-kyiv`, `avtoshkola-dnipro`, `avtoshkola-kramatorsk`, `avtoshkola-sloviansk`, `avtoshkola-dobropillia`, `kategoriia-a`, `kategoriia-b`, `kategoriia-c`, `kategoriia-ce`.
- JSON-LD schema: `DrivingSchool`, `FAQPage`, `BreadcrumbList`, `Course`, city `DrivingSchool`.
- Shared marketing data: этапы обучения, преимущества, выпускники, инструкторы, автопарк, FAQ.
- Mobile UI components: `InsightCard`, `SkeletonBlock`, `EmptyState`.
- Mobile home: onboarding, быстрые действия, skeleton и empty state.
- Документы: `PROJECT_AUDIT.md`, `APK_BUILD_REPORT.md`, `ANDROID_TEST_REPORT.md`, `GITHUB_DEPLOY_REPORT.md`, `USER_GUIDE.md`, `HOW_TO_USE_PROJECT.md`, `FINAL_IMPROVEMENT_REPORT.md`.

### Изменено

- `LeadForm` стала переиспользуемой для страницы и popup, получила уникальные `id`, заголовки, описание и кастомный submit label.
- `apps/web/app/[slug]/page.tsx` теперь рендерит полноценные посадочные страницы вместо шаблонной заглушки.
- `apps/mobile/metro.config.js` сохраняет Expo default watch folders и добавляет workspace root.
- Mobile Expo-зависимости приведены к ожидаемым версиям SDK 53.
- Метаданные OpenGraph/Twitter обновлены под все филиалы и текущий коммерческий фокус.
- `.gitignore` игнорирует временные Playwright-артефакты.

### Проверено

- `npm run typecheck` — успешно.
- `npm run build` — успешно.
- `npx expo-doctor` в `apps/mobile` — 18/18 проверок.
- Playwright smoke: desktop главная, mobile главная, popup, SEO page `/avtoshkola-kyiv`, dev-отправка лид-формы.

### Ограничения

- APK не собран: EAS требует Expo account или `EXPO_TOKEN`, Android SDK/ADB/emulator отсутствуют.
- `npm audit --omit=dev` показывает moderate advisories в транзитивных зависимостях Expo/Next/Firebase; high/critical нет.

## 2026-06-01

- Создан production-oriented scaffold монорепозитория.
- Добавлены web, admin, mobile, api и shared packages.
- Добавлены Firebase rules, indexes и GitHub CI.
