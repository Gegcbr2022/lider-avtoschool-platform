# Финальный отчёт улучшений

Дата: 2026-06-02.

## Что было найдено

- Сайт работал, но выглядел слишком простым для коммерческой автошколы.
- Не хватало сильного hero, эмоционального контента, выпускников, инструкторов, автопарка и плотных CTA.
- SEO-страницы были шаблонными и не закрывали запрошенные города/категории.
- Popup-заявки не было.
- Mobile app был аккуратным, но слишком статичным.
- Expo Doctor находил 2 проблемы.
- APK/emulator QA невозможны без Android SDK/ADB/AVD и Expo/EAS доступа.

## Что улучшено на сайте

- Полностью усилена главная страница.
- Добавлены этапы получения прав.
- Добавлен блок онлайн-обучения.
- Добавлен блок `Наші випускники`.
- Добавлены инструкторы и автопарк.
- Усилены филиалы, CTA, FAQ и финальный conversion-блок.
- Добавлен popup с задержкой и сохранением закрытия.
- Добавлены плавные CSS-анимации и `prefers-reduced-motion`.

## Какие страницы переработаны

- `/`
- `/about`
- `/branches`
- `/categories`
- `/prices`
- `/documents`
- `/faq`
- `/contacts`
- `/reviews`
- `/online-application`
- `/avtoshkola-kyiv`
- `/avtoshkola-dnipro`
- `/avtoshkola-kramatorsk`
- `/avtoshkola-sloviansk`
- `/avtoshkola-dobropillia`
- `/kategoriia-a`
- `/kategoriia-b`
- `/kategoriia-c`
- `/kategoriia-ce`

## Какие компоненты созданы

- `apps/web/components/lead-popup.tsx`
- `apps/mobile/components/mobile-ui.tsx`: `InsightCard`, `SkeletonBlock`, `EmptyState`

## Какие компоненты улучшены

- `LeadForm` получила page/popup variants, уникальные field ids и кастомные тексты.
- `[slug]/page.tsx` стал полноценным renderer для SEO landing pages.
- Mobile home получил onboarding и быстрые действия.

## Какие данные добавлены

В `packages/shared/src/index.ts`:

- `learningSteps`
- `commercialAdvantages`
- `graduateStories`
- `instructorProfiles`
- `vehicleFleet`
- `homeFaq`

## Изображения

- Используется существующее production-изображение `apps/web/public/images/hero-driving-school.png`.
- Реальные фото выпускников не добавлялись, потому что нет подтверждённых прав/согласий. Вместо этого создана безопасная структура временных данных с initials.

## Анимации

- `reveal-up`
- `float-slow`
- `popup-in`
- `popup-out`
- hover-поднятие карточек
- reduced-motion fallback

## Что улучшено в мобильном приложении

- Onboarding steps на главной.
- Insight cards.
- Быстрые действия.
- Skeleton block.
- Empty state.
- Исправлен Metro config.
- Зависимости приведены к Expo SDK 53.
- `npx expo-doctor` проходит 18/18.

## APK

APK не создан в текущем окружении.

Причины:

- нет `adb`;
- нет `emulator`;
- нет Android SDK/AVD;
- EAS требует Expo account или `EXPO_TOKEN`.

Подробно: [APK_BUILD_REPORT.md](APK_BUILD_REPORT.md), [ANDROID_TEST_REPORT.md](ANDROID_TEST_REPORT.md).

## Проверки

Выполнено:

- `npm run typecheck`
- `npm run build`
- `npx expo-doctor`
- Playwright desktop/mobile render
- Playwright popup smoke
- Playwright SEO page smoke
- Playwright dev form submit

Перед push дополнительно выполняется полный набор CI-команд.

## Дальнейшие рекомендации

- Подключить реальные фото выпускников только после согласий.
- Добавить уникальные тексты для всех SEO-страниц после маркетинговой редакции.
- Подключить Sentry/PostHog/Web Vitals.
- Настроить Firebase Auth/App Check/custom claims.
- Получить Expo/EAS доступ и собрать preview APK.
- После production-деплоя запустить Lighthouse.
