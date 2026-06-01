# Руководство пользователя

Это простое руководство по проекту.

## Как запустить сайт

1. Откройте PowerShell.
2. Перейдите в папку:

```powershell
cd "C:\Users\Nice Try)\Downloads\Avtoschool_APP"
```

3. Запустите:

```powershell
npm run dev:web
```

4. Откройте браузер:

```text
http://localhost:3000
```

## Как запустить админ-панель

```powershell
npm run dev:admin
```

Откройте:

```text
http://localhost:3001
```

## Как запустить мобильное приложение

```powershell
npm run dev:mobile
```

Дальше следуйте подсказкам Expo.

## Как смотреть заявки

Сейчас заявки отображаются в демо CRM-интерфейсе. Для реальных заявок нужно подключить Firebase Firestore.

## Как добавлять филиалы

Откройте файл:

```text
packages/shared/src/index.ts
```

Найдите `branches` и добавьте новый филиал по примеру существующих.

## Как менять цены

Откройте:

```text
packages/shared/src/index.ts
```

Найдите `services` и измените поле `priceFrom`.

## Как добавлять новости

Сейчас полноценной CMS нет. Нужно подключить Firestore или CMS и добавить отдельную модель новостей.

## Как обновлять проект

1. Внесите изменения.
2. Выполните:

```powershell
npm run lint
npm run typecheck
npm run test
npm run build
```

3. Если ошибок нет, сделайте commit и push.

## Как делать резервные копии

После подключения Firebase нужно настроить Firestore export в Google Cloud Storage.

## Как смотреть логи

- Для сайта: логи Vercel/Netlify.
- Для backend: Firebase Functions logs.
- Для локальной разработки: терминал PowerShell.

## Как восстановить проект после сбоя

1. Откройте GitHub.
2. Скачайте последнюю стабильную версию.
3. Выполните `npm install`.
4. Верните `.env` переменные.
5. Запустите проверки.
