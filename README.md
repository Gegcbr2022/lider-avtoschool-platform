# Автошкола «Лідер»

Монорепозиторий цифровой платформы автошколы «Лідер»: публичный сайт, CRM/админка, мобильный кабинет ученика, API на Firebase Functions и общие пакеты с контентом, типами и UI.

Основной язык клиентского продукта — украинский. Документация для команды ведется на русском, чтобы быстрее запускать, проверять и передавать проект.

## Что Входит

- `apps/web` — публичный сайт на Next.js: главная страница, SEO-страницы, формы заявок, popup, sitemap, robots и schema.org.
- `apps/admin` — CRM/админ-панель на Next.js для заявок, учеников, практики, платежей и LMS.
- `apps/mobile` — Expo Router приложение для Android/iOS: кабинет ученика, расписание, прогресс, платежи, быстрые действия и основа retention после получения прав.
- `apps/api` — Firebase Cloud Functions API на Express с Zod-валидацией, CORS, rate limiting и Telegram-логированием лидов.
- `packages/shared` — услуги, филиалы, маркетинговые данные, демо-данные, Zod-схемы и i18n.
- `packages/types` — общие TypeScript-контракты.
- `packages/ui` — общие React UI-примитивы и дизайн-токены.
- `packages/config` — runtime-конфигурация URL/API/domain.
- `infrastructure/firebase` — Firestore rules, Storage rules и индексы.

## Требования

- Node.js 20+
- npm 10+
- Для мобильной разработки: Expo CLI, Android Studio/SDK или Xcode на macOS.
- Для Firebase production: доступ к Firebase-проекту и переменные окружения.

## Настройка ENV

Скопируй `.env.example` в `.env` и заполни нужные переменные:

```bash
cp .env.example .env
```

Минимум для локальной разработки сайта:

```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
API_URL=http://localhost:5001/lider-avtoschool-dev/europe-west1/api
```

Для AI-чата дополнительно нужен `OPENAI_API_KEY`.

## Запуск С Нуля

```bash
npm install
npm run typecheck
npm run dev:web
```

Сайт откроется на `http://localhost:3000`.

Админка:

```bash
npm run dev:admin
```

API/Firebase emulators (требует firebase-tools и Java 11+):

```bash
firebase emulators:start
npm run dev:api
```

Мобильное приложение:

```bash
npm run dev:mobile
# Затем отсканировать QR-код в приложении Expo Go
```

## Проверки

Перед коммитом и деплоем:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Для мобильного приложения дополнительно:

```bash
cd apps/mobile
npx expo-doctor
```

## Production

Текущий production URL: **https://lider.bdslab.net/**

Полная инструкция деплоя — в файле [`DEPLOY.md`](DEPLOY.md).

Быстрый деплой Web:

```bash
npm run lint && npm run typecheck && npm run build
vercel --prod --yes
```

Деплой Firebase (API + rules + indexes):

```bash
npm run build --workspace @lider/api
firebase deploy --only functions,firestore:rules,firestore:indexes,storage
```

## Контент И Дизайн

- Главный CTA сайта — заявка и Telegram, а не прямой звонок.
- Категории, цены, сроки, документы для поступления, условия по CE и примечание про срок действия теории хранятся в `packages/shared/src/index.ts`.
- Реальные фото выпускников для блока «Гордість Лідера» лежат в `apps/web/public/images/pride/`.
- `design-references/` и `Images_with_prava/` используются как локальные исходные материалы и не должны попадать в production-сборку целиком.
- Языковой переключатель на сайте поддерживает `?lang=uk|ru|en`, сохраняет выбор в `localStorage` и меняет `html lang`.

## Формы И Лиды

Форма заявки использует React Hook Form и Zod. Сейчас она принимает:

- тип запроса;
- имя, телефон, город/филиал, категорию;
- удобный способ связи;
- комментарий;
- имена приложенных файлов документов.

Важно: загрузка файлов документов пока подготовлена на уровне UI/payload, но не подключена к Firebase Storage. Это отмечено в `MISSING_FOR_PRODUCTION.md`.

## Что Проверять Вручную

- Desktop и mobile: `360`, `390`, `768`, `1024`, `1440` px.
- Мобильное меню: открытие, закрытие, переходы по якорям, языковой переключатель.
- Форма заявки: обязательные поля, ошибки, успешная отправка, выбор файлов.
- Popup: появление, закрытие, повторное открытие.
- Блоки `#services`, `#documents`, `#pride`, `#branches`, `#signup`.
- Отсутствие горизонтального скролла.

## Production Lead Flow

- Все публичные формы, popup и AI-виджет сходятся в общую `createLeadSchema`.
- Лид хранит `source`, `preferredContactMethod`, UTM-метки, referral code, Telegram start param, `page`, `device`, язык, согласие на обработку данных и документы как payload-метаданные.
- `apps/web/app/api/leads/route.ts` добавляет rate limit и production-forwarding в `API_URL`.
- `apps/api` пишет лиды в общую коллекцию `leads`, добавляет audit log, Telegram-логирование и KPI summary endpoint `/kpi/summary`.
- Главная навигация ведет на отдельные страницы `/categories`, `/documents`, `/pride`, `/branches`, `/contacts`, `/faq`, `/app`, `/privacy`, `/terms` с сохранением `?lang=`.

## Troubleshooting

**`npm install` падает с ERESOLVE** → попробуй `npm install --legacy-peer-deps`.

**Typecheck не видит `@lider/*` пакеты** → убедись, что `npm install` запущен из корня, а не из подпапки.

**Firebase emulators не стартуют** → нужна Java 11+. Установи через `firebase setup:emulators:firestore`.

**Expo не запускается на устройстве** → убедись, что телефон и компьютер в одной Wi-Fi сети; или запусти через тоннель: `npx expo start --tunnel`.

**Vercel build падает** → проверь, что все ENV переменные заданы в Vercel dashboard; локально `.env` не деплоится.

## Недостающее

Актуальный список того, что еще нужно для настоящего production, находится в [`MISSING_FOR_PRODUCTION.md`](MISSING_FOR_PRODUCTION.md).
