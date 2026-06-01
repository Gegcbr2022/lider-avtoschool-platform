# Firebase Status

Дата проверки: 2026-06-01

## Что есть

- `firebase.json`
- Firestore rules
- Storage rules
- Firestore indexes
- Firebase Cloud Functions API в `apps/api`
- Docker helper для локальных эмуляторов

## Что не проверено

Реальный Firebase проект не подключён в этой сессии.

Не проверено:

- Firebase Auth
- Phone Auth
- Email Auth
- Firestore production database
- Storage bucket
- Cloud Functions deploy
- Security Rules deploy
- Firebase Emulator UI в браузере

## Что нужно от пользователя

Нужен Google/Firebase доступ.

Вариант 1:

- пользователь входит в Firebase Console сам;
- создаёт проект;
- сообщает Project ID.

Вариант 2:

- пользователь даёт доступ к Firebase проекту аккаунту, который используется для разработки.

## Что делать после получения доступа

1. Создать `.firebaserc` из `.firebaserc.example`.
2. Указать реальные project id.
3. Включить Authentication.
4. Включить Email Auth.
5. Включить Phone Auth.
6. Создать Firestore.
7. Создать Storage.
8. Запустить:

```bash
firebase deploy --only firestore:rules,storage
firebase deploy --only functions
```

## Статус

| Раздел | Статус |
| --- | --- |
| Конфигурация Firebase | PASS |
| Rules files | PASS |
| Functions code | PASS |
| Реальный Firebase доступ | FAIL |
| Deploy rules | NOT CHECKED |
| Deploy functions | NOT CHECKED |
