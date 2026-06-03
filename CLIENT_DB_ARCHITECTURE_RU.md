# Архитектура общей клиентской БД — Автошкола «Лідер»

> Документ описывает предлагаемую структуру Firestore-коллекций, которая объединяет сайт, админку, мобильное приложение и Telegram-бот в единую клиентскую базу.

---

## Принципы

1. **Единый источник правды** — все сервисы читают/пишут одни и те же Firestore-коллекции.
2. **Постепенная интеграция** — сайт и API работают уже сейчас, бот подключится позже без переработки схемы.
3. **Matching по телефону** — `phoneNormalized` — главный ключ для дедупликации клиентов из разных каналов.
4. **Аудит** — любое существенное действие логируется в `activityEvents`.

---

## Коллекции

### `leads`
Первичные заявки с сайта, бота, мобильного приложения и AI-чата.

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | string | Firestore auto-ID |
| `name` | string | Имя (может быть дефолтным) |
| `phone` | string | Исходный номер |
| `phoneNormalized` | string | `+380XXXXXXXXX` — для matching |
| `email` | string? | Email (опционально) |
| `city` | string | Город |
| `category` | A/A1/B/C/CE | Категория ВУ |
| `branchId` | string | ID филиала |
| `source` | LeadSource | website/popup/telegram/mobile/… |
| `status` | LeadStatus | new/contacted/enrolled/… |
| `consentAccepted` | boolean | Обязательно true |
| `language` | uk/ru/en | Язык |
| `createdAt` | ISO datetime | |
| `updatedAt` | ISO datetime | |
| `linkedClientId` | string? | Ссылка на `clients` после matching |
| `ipHash` | string? | Хеш IP без возможности восстановления |
| `userAgent` | string? | |
| `utmSource/Medium/…` | string? | UTM-метки |
| `telegramUserId` | number? | Если из Telegram-бота |
| `telegramUsername` | string? | |
| `telegramChatId` | number? | |
| `botSource` | string? | Источник внутри бота |
| `botDbId` | string? | ID записи в БД бота |
| `referralCode` | string? | Реферальный код |
| `formStartedAt` | number? | Временна́я метка открытия формы |

---

### `clients`
Подтверждённые клиенты — формируются вручную или автоматически из `leads` менеджером.

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | string | Firestore auto-ID |
| `name` | string | |
| `phone` | string | |
| `phoneNormalized` | string | Для дедупликации |
| `email` | string? | |
| `city` | string | |
| `branchId` | string | Основная филиал |
| `status` | active/inactive/graduated | |
| `leadIds` | string[] | Связанные заявки |
| `studentId` | string? | Ссылка на `students` |
| `referralCode` | string | Уникальный реферальный код |
| `referrerId` | string? | Кто пригласил |
| `telegramUserId` | number? | |
| `telegramUsername` | string? | |
| `telegramChatId` | number? | |
| `lastBotSyncAt` | ISO datetime? | Последняя синхронизация с ботом |
| `syncStatus` | synced/pending/conflict? | Статус синхронизации с ботом |
| `botDbId` | string? | ID в БД бота |
| `createdAt` | ISO datetime | |
| `updatedAt` | ISO datetime | |

---

### `students`
Зачисленные ученики с прогрессом обучения.

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | string | |
| `leadId` | string | |
| `clientId` | string? | |
| `name` | string | |
| `phone` | string | |
| `phoneNormalized` | string | |
| `branchId` | string | |
| `category` | A/A1/B/C/CE | |
| `status` | active/passed/dropped | |
| `trainingStartDate` | string | |
| `trainingEndDate` | string? | |
| `theoryProgress` | number 0–100 | % завершения теории |
| `practiceProgress` | number 0–100 | % практических занятий |
| `examStatus` | not_ready/ready/passed/failed | |
| `paymentStatus` | pending/partial/paid | |
| `documentsStatus` | pending/verified/rejected | |
| `managerId` | string | |
| `instructorId` | string? | |
| `discount` | number? | Скидка в грн |

---

### `branches`

| Поле | Тип |
|------|-----|
| `id` | string |
| `city` | string |
| `address` | string |
| `phone` | string |
| `managerId` | string |
| `workingHours` | string |

---

### `managers` / `instructors`

| Поле | Тип |
|------|-----|
| `id` | string |
| `name` | string |
| `phone` | string |
| `branchId` | string |
| `telegramUserId` | number? |
| `role` | admin/manager/instructor |

---

### `courses` / `lessons`

Расписание, теоретические и практические занятия.

| Поле | Тип |
|------|-----|
| `id` | string |
| `branchId` | string |
| `category` | A/B/C/CE |
| `startDate` | string |
| `instructorId` | string |
| `studentIds` | string[] |

---

### `payments`

| Поле | Тип |
|------|-----|
| `id` | string |
| `studentId` | string |
| `clientId` | string? |
| `amount` | number |
| `currency` | UAH |
| `status` | pending/paid/failed |
| `provider` | liqpay/fondy/monobank/cash |
| `createdAt` | ISO datetime |

---

### `documents`

| Поле | Тип |
|------|-----|
| `id` | string |
| `leadId` | string |
| `studentId` | string? |
| `clientId` | string? |
| `name` | string |
| `type` | string (MIME) |
| `storagePath` | string |
| `status` | uploaded/pending_upload/verified/rejected |
| `uploadedAt` | ISO datetime |

---

### `botUsers`
Пользователи Telegram-бота — до и после linking с клиентом.

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | string | Firestore auto-ID |
| `telegramUserId` | number | TG User ID — уникальный ключ |
| `telegramUsername` | string? | |
| `telegramChatId` | number | |
| `firstName` | string? | |
| `lastName` | string? | |
| `phone` | string? | Если пользователь поделился |
| `phoneNormalized` | string? | |
| `linkedClientId` | string? | После ручного/авто-linking |
| `linkedLeadId` | string? | |
| `startParam` | string? | deep-link start parameter |
| `botSource` | string? | Источник внутри бота |
| `botDbId` | string? | ID в старой БД бота |
| `lastActivity` | ISO datetime | |
| `createdAt` | ISO datetime | |
| `language` | uk/ru/en | |

---

### `referrals`

| Поле | Тип |
|------|-----|
| `id` | string |
| `referrerId` | string (clientId) |
| `refereeId` | string (clientId) |
| `refereeLeadId` | string |
| `code` | string |
| `status` | pending/confirmed/rewarded |
| `reward` | number? (грн) |
| `createdAt` | ISO datetime |

---

### `activityEvents`

Аудит всех значимых событий.

| Поле | Тип |
|------|-----|
| `id` | string |
| `entityType` | lead/client/student/payment/botUser/… |
| `entityId` | string |
| `action` | created/updated/deleted/linked/synced/… |
| `actor` | public-form/admin/bot/system/manager-id |
| `source` | website/telegram/mobile/admin |
| `createdAt` | ISO datetime |
| `meta` | Record\<string, unknown\>? |

---

## Стратегия matching (Lead → Client)

### Автоматический matching

При создании нового `lead` — проверить:

```typescript
const existing = await db.collection("clients")
  .where("phoneNormalized", "==", normalizePhone(lead.phone))
  .limit(1).get();

if (!existing.empty) {
  await db.collection("leads").doc(leadId).update({ linkedClientId: existing.docs[0].id });
}
```

### Matching через Telegram start-param

Бот передаёт `start=REFERRAL_CODE` или `start=LEAD_ID` → ищем `leads` по `id` или `referralCode` → связываем `botUsers.linkedLeadId`.

### Ручное объединение в админке

Admin CRM показывает дублирующиеся номера → кнопка "Merge" → один клиент с историей из нескольких лидов.

---

## Roadmap интеграции Telegram-бота

### Фаза 0 (сейчас)
- [x] Схема коллекций готова (этот документ)
- [x] Shared TypeScript types подготовлены
- [x] Поля `telegramUserId/Username/ChatId/botSource/botDbId` добавлены в `leads` schema
- [x] `botUsers` коллекция описана

### Фаза 1 (после передачи кода бота)
- [ ] Проанализировать текущую БД бота
- [ ] Написать migration script: `botOldDb → Firestore botUsers`
- [ ] Добавить в бот POST `/bot/users` → Firebase Functions
- [ ] Webhook `/bot/lead` для создания лида через бот → уже обрабатывает `/leads`
- [ ] Matching: бот ищет `clients` по телефону при новом пользователе

### Фаза 2 (полная синхронизация)
- [ ] Двусторонняя синхронизация прогресса обучения
- [ ] Push-уведомления через Telegram при изменении статуса студента
- [ ] Реферальные начисления обрабатываются единым сервисом
- [ ] Admin CRM показывает `botUsers` с возможностью linking

---

## Нормализация телефона

```typescript
export function normalizePhone(raw: string): string | undefined {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("0")) {
    return `+380${digits.slice(1)}`;
  }
  if (digits.length === 12 && digits.startsWith("380")) {
    return `+${digits}`;
  }
  if (digits.length === 13 && digits.startsWith("3800")) {
    return `+380${digits.slice(4)}`;
  }
  return undefined;
}
```

---

## Firestore Security Rules (расширенный шаблон)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isStaff() {
      return request.auth != null &&
        (request.auth.token.role == "admin" || request.auth.token.role == "manager");
    }

    function isAdmin() {
      return request.auth != null && request.auth.token.role == "admin";
    }

    match /leads/{leadId} {
      allow create: if request.resource.data.consentAccepted == true
                   && request.resource.data.status == "new";
      allow read, update: if isStaff();
      allow delete: if isAdmin();
    }

    match /clients/{clientId} {
      allow read, write: if isStaff();
    }

    match /students/{studentId} {
      allow read, write: if isStaff();
    }

    match /botUsers/{userId} {
      allow read, write: if isStaff();
    }

    match /activityEvents/{eventId} {
      allow read: if isAdmin();
      allow create: if true; // written by server
    }
  }
}
```
