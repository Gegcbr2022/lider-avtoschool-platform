# Как пользоваться проектом с нуля

Дата: 2026-06-02.

## 1. Установить зависимости

Откройте терминал в корне проекта и выполните:

```bash
npm install
```

## 2. Запустить сайт

```bash
npm run dev:web
```

Откройте:

```text
http://localhost:3000
```

## 3. Запустить админку

```bash
npm run dev:admin
```

Откройте:

```text
http://localhost:3001
```

## 4. Запустить мобильное приложение

```bash
npm run dev:mobile
```

Дальше используйте Expo Go или Android/iOS simulator, если они установлены.

## 5. Проверить проект перед изменениями

```bash
npm run typecheck
npm run build
```

Если обе команды прошли, проект технически собирается.

## 6. Изменить текст на сайте

Главные данные лежат здесь:

```text
packages/shared/src/index.ts
```

SEO-страницы:

```text
apps/web/lib/site-pages.ts
```

После изменения запустите:

```bash
npm run typecheck
npm run build
```

## 7. Добавить новый город

1. Откройте `packages/shared/src/index.ts`.
2. Добавьте новый объект в `branches`.
3. Откройте `apps/web/lib/site-pages.ts`.
4. Добавьте SEO-страницу `avtoshkola-<city>`.
5. Проверьте сайт:

```bash
npm run dev:web
```

## 8. Посмотреть заявки

В dev-режиме форма отвечает успехом локально.

В production нужны:

- `API_URL`;
- Firebase Functions deploy;
- Firestore;
- Telegram ENV, если нужны уведомления.

## 9. Сделать резервную копию

Минимально:

```bash
git status
git add .
git commit -m "описание изменений"
git push
```

Перед этим не коммитьте `.env`.

## 10. Собрать APK

Нужны Android SDK и Expo/EAS доступ.

```bash
cd apps/mobile
npx eas login
npx eas build --profile preview --platform android
```

Если используется CI:

```bash
set EXPO_TOKEN=<token>
npx eas build --profile preview --platform android --non-interactive
```
