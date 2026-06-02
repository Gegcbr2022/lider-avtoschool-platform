# Аудит проекта

Дата: 2026-06-02.

## Объём проверки

Проверены:

- структура монорепозитория;
- Git/GitHub/CI;
- зависимости и `npm audit`;
- ENV без вывода секретов;
- Firebase Functions, Firestore rules, Storage rules;
- публичный сайт, все статические и SEO-страницы;
- лид-формы и API route `/api/leads`;
- админка/CRM;
- мобильное Expo-приложение;
- production-сайт `https://lider.bdslab.net/`;
- конкуренты `https://prava.today/`, `https://prava.today/events`, `https://avtoshkola-elita.if.ua/`.

## Что уже было сделано до текущей итерации

- Монорепозиторий с `apps/web`, `apps/admin`, `apps/mobile`, `apps/api`, `packages/*`.
- Next.js сайт и админка.
- Expo mobile app.
- Firebase Functions API с Express, Zod, CORS и rate limiting.
- Firestore/Storage rules.
- Sitemap и robots.
- GitHub Actions CI.
- Production URL уже работает: `https://lider.bdslab.net/`.

## Найденные проблемы

- Главная выглядела слишком просто для коммерческой автошколы: мало эмоционального контента, слабая упаковка преимуществ, нет блока выпускников.
- SEO-страницы существовали, но были шаблонными и не закрывали запрошенные city/category landing pages.
- Не было popup-заявки с повторным показом и сохранением состояния закрытия.
- `LeadForm` была привязана к одному виду и имела повторяющиеся статические `id`.
- В mobile не хватало onboarding, skeleton/empty states и более современных быстрых действий.
- Expo Doctor показывал 2 проблемы: Metro config и несовместимые версии пакетов для SDK 53.
- APK/emulator pipeline заблокирован окружением: нет `adb`, нет `emulator`, нет Expo account/`EXPO_TOKEN`.
- `npm audit --omit=dev` показывает moderate advisories в транзитивных зависимостях Expo/Next/Firebase. High/critical не найдено.

## Исправлено

- Главная переработана в полноценный landing: hero, CTA, trust facts, категории, этапы, онлайн-теория, выпускники, инструкторы, автопарк, филиалы, FAQ, финальный CTA.
- Добавлен блок `Наші випускники` с временными структурированными данными.
- Добавлен `LeadPopup` с задержкой 60 секунд в production, короткой задержкой в dev, затемнением, закрытием и localStorage.
- `LeadForm` стала переиспользуемой: page/popup variants, уникальные `id`, заголовок, описание, submit label.
- Добавлены SEO-страницы по городам и категориям.
- `[slug]` теперь рендерит полноценный landing с branch/category данными, schema и формой.
- Добавлены JSON-LD: `DrivingSchool`, `FAQPage`, `BreadcrumbList`, `Course`.
- Shared-данные расширены: learning steps, advantages, graduate stories, instructors, fleet, FAQ.
- Mobile UI получил `InsightCard`, `SkeletonBlock`, `EmptyState`.
- Mobile home получил onboarding, быстрые действия, skeleton и empty state.
- Metro config исправлен с сохранением Expo defaults.
- Mobile зависимости приведены к ожидаемым версиям Expo SDK 53.
- Expo Doctor после правок: 18/18 проверок.
- `.gitignore` защищает репозиторий от временных Playwright-артефактов.

## Конкурентный анализ

### prava.today

Сильные идеи:

- понятная верхняя навигация и CTA;
- категории A/A1, B, C/CE вынесены на главную;
- блок преимуществ;
- этапы получения водительского удостоверения;
- отзывы учеников;
- отдельная страница `Гордість` с идеей выпускников;
- popup-заявка примерно через минуту.

Слабые места:

- визуальный стиль устаревший;
- popup перегружен полями и текстом;
- страница выпускников эмоциональная, но не структурированная как современная галерея;
- не хватает более чистой типографики и премиального ритма.

Что взято как идея, но сделано иначе:

- этапы обучения перенесены в структурированный блок из 6 шагов;
- `Гордість` превращена в современный блок выпускников с датой, городом, категорией и отзывом;
- popup сделан компактнее и дружелюбнее.

### avtoshkola-elita.if.ua

Сильные идеи:

- сильная коммерческая упаковка hero;
- много CTA;
- офферы, акции, промо;
- блок инструкторов;
- блок автопарка;
- отзывы;
- филиалы с картой;
- FAQ;
- мобильное приложение и онлайн-обучение как преимущество.

Что внедрено:

- усиленный hero;
- блок инструкторов и автопарка;
- отдельный онлайн-блок;
- FAQ и CTA;
- филиалы с коммерческим описанием;
- SEO-посадочные страницы.

## Безопасность

Положительно:

- `.env.example` не содержит реальных секретов.
- API валидирует payload через Zod.
- `/api/leads` обрабатывает битый JSON.
- Production `/api/leads` требует `API_URL`.
- Firebase rules запрещают общий доступ по fallback `/{document=**}`.
- Telegram webhook защищён secret token в production.
- CORS читает разрешённые origin из ENV.

Осталось:

- подключить Firebase Auth/App Check/custom claims;
- настроить мониторинг ошибок;
- регулярно обновлять транзитивные зависимости после стабильных релизов Expo/Next/Firebase;
- не включать реальные фото выпускников без письменного согласия.

## Performance и UI/UX

Сделано:

- CSS-анимации без тяжёлых runtime-зависимостей;
- `prefers-reduced-motion`;
- responsive hero/cards/forms;
- Next image используется для hero;
- popup не блокирует страницу навсегда и сохраняет закрытие.

Осталось:

- запустить Lighthouse на production после деплоя;
- добавить реальные оптимизированные изображения выпускников/инструкторов при наличии прав;
- добавить Web Vitals мониторинг.

## SEO

Сделано:

- sitemap продолжает собираться из `contentPages`;
- robots оставлен открытым;
- добавлены city/category pages;
- добавлены OpenGraph/Twitter metadata;
- добавлены LocalBusiness/DrivingSchool/FAQ/Breadcrumb/Course schema.

Осталось:

- подключить реальные canonical URL от production domain;
- добавить уникальные тексты для каждой SEO-страницы после проверки маркетологом;
- добавить реальные OG-изображения 1200x630.

## Проверки

Успешно:

- `npm run typecheck`
- `npm run build`
- `npx expo-doctor` в `apps/mobile`
- Playwright desktop/mobile render
- Playwright popup render
- Playwright form submit в dev

Ограничения:

- in-app Browser `iab` недоступен в текущей среде, использован Playwright fallback.
- APK/emulator QA заблокированы отсутствием Android SDK/ADB/AVD и Expo token.
