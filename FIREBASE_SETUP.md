# Firebase

## Проекты

`.firebaserc` содержит три окружения:

```json
{
  "projects": {
    "dev": "lider-avtoschool-dev",
    "staging": "lider-avtoschool-staging",
    "production": "lider-avtoschool"
  }
}
```

Рекомендуемая модель:

- `dev` — локальная разработка и безопасные тесты;
- `staging` — проверка перед релизом;
- `production` — реальные ученики, заявки, платежи и документы.

## Что должно быть включено в Firebase Console

- Authentication: email/password, phone auth или выбранные провайдеры.
- Firestore Database.
- Cloud Storage.
- Cloud Functions.
- App Check для web и mobile клиентов.
- Billing, если используются Functions/Storage/внешние API.

## Firestore

Текущие правила лежат в `infrastructure/firebase/firestore.rules`.

Основные коллекции:

- `leads` — заявки с сайта, мобильного приложения и Telegram.
- `students` — профили учеников.
- `bookings` — записи на практические занятия.
- `payments` — платежи и статусы оплат.
- `courses` — курсы, уроки, прогресс.
- `auditLogs` — аудит действий сотрудников.

RBAC строится на custom claim `role`:

- `admin`;
- `manager`;
- `student`.

Правила не дают доступ к неизвестным коллекциям. Студент должен видеть только собственные записи, сотрудники — рабочие данные согласно роли.

## Storage

Правила лежат в `infrastructure/firebase/storage.rules`.

Основные пути:

- `student-documents/{studentId}/{fileName}` — документы ученика;
- `public/{fileName}` — публичные ассеты.

Документы ограничены PDF и изображениями до 10 МБ. Запись документов разрешена сотрудникам или владельцу student scope.

## Functions API

Код API находится в `apps/api`.

Команды:

```bash
npm --workspace @lider/api run build
npm --workspace @lider/api run dev
npm --workspace @lider/api run deploy
```

Endpoints:

- `GET /health`;
- `POST /leads`;
- `POST /bookings`;
- `POST /payments/create-intent`;
- `POST /telegram/webhook`;
- `POST /ai/consult`.

## Эмуляторы

Настроены порты:

- Functions: `5001`;
- Firestore: `8080`;
- Storage: `9199`;
- Emulator UI: `4000`.

Запуск:

```bash
npm run dev:api
```

Локальный API URL по умолчанию:

```text
http://localhost:5001/lider-avtoschool-dev/europe-west1/api
```

## Деплой

```bash
npx firebase login
npx firebase use dev
npx firebase deploy --only firestore:rules,firestore:indexes,storage
npx firebase deploy --only functions
```

## Что осталось сделать вручную

- Авторизовать Firebase CLI.
- Проверить реальные Firebase project IDs.
- Включить Authentication providers.
- Настроить custom claims для ролей.
- Включить App Check.
- Перенести секреты в Firebase/Vercel secret store.
- Подключить реальные адаптеры платежей, Telegram и AI.
