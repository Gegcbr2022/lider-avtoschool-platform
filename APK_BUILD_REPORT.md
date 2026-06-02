# APK Build Report

Дата: 2026-06-02.

## Приложение

- Пакет: `ua.lider.avtoschool`
- Expo app: `apps/mobile`
- Версия: `0.1.0`
- Профиль EAS: `preview`

## Выполненные команды

```bash
npx expo --version
npx --yes eas-cli --version
npx eas build --platform android --profile preview --local --non-interactive
npx expo-doctor
```

## Результат

APK не собран в текущем окружении.

Причина:

- EAS CLI требует Expo account или `EXPO_TOKEN`.
- `adb` не найден в PATH.
- `emulator` не найден в PATH.
- Android SDK/AVD недоступны.

Точный отказ EAS:

```text
An Expo user account is required to proceed.
Either log in with eas login or set the EXPO_TOKEN environment variable if you're using EAS CLI on CI.
```

## Что исправлено для будущей сборки

- `npx expo-doctor` доведён до 18/18 успешных проверок.
- Expo Router, React, React Native, React Native Screens, TypeScript и `@types/react` приведены к версиям, ожидаемым Expo SDK 53.
- Metro config исправлен так, чтобы сохранять Expo defaults и добавлять workspace root.

## Как собрать APK

Вариант через аккаунт:

```bash
cd apps/mobile
npx eas login
npx eas build --profile preview --platform android
```

Вариант через CI token:

```bash
set EXPO_TOKEN=<expo-token>
cd apps/mobile
npx eas build --profile preview --platform android --non-interactive
```

## Где будет APK

После успешной EAS-сборки APK/AAB будет доступен в ссылке EAS build output. В текущей сессии локального файла APK нет.

## Инструкция установки APK

После получения APK:

```bash
adb install path/to/app.apk
```

Для ручной установки на телефоне:

1. Скопировать APK на устройство.
2. Разрешить установку из неизвестных источников для файлового менеджера.
3. Открыть APK и подтвердить установку.
