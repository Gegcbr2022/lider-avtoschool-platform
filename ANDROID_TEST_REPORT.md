# Android Test Report

Дата: 2026-06-02.

## Цель

Проверить Android Emulator, установить APK и пройти базовые сценарии:

- запуск;
- регистрация/авторизация;
- заявки;
- формы;
- навигация;
- ПДР-тесты.

## Проверка окружения

Выполнено:

```bash
adb version
emulator -list-avds
where adb
where emulator
npx expo-doctor
```

Результат:

- `adb` не найден;
- `emulator` не найден;
- Android Virtual Devices недоступны;
- APK не собран из-за отсутствия Expo account/`EXPO_TOKEN`;
- `npx expo-doctor` после исправлений проходит 18/18 проверок.

## Статус сценариев

- Запуск приложения на эмуляторе: не выполнено, нет emulator/AVD.
- Установка APK: не выполнено, APK не собран.
- Регистрация/авторизация: не выполнено, в текущем mobile app нет production auth flow.
- Заявки/формы: частично покрыто web smoke через `/api/leads`.
- Навигация mobile: проверена статически через TypeScript и Expo Doctor.
- ПДР-тесты: UI-экран присутствует, emulator runtime не проверен.

## Что улучшено в mobile

- Главный экран получил onboarding steps.
- Добавлены быстрые действия.
- Добавлены skeleton и empty state компоненты.
- Исправлен Metro config.
- Зависимости приведены к Expo SDK 53 expectations.

## Что нужно для реального emulator QA

1. Установить Android Studio.
2. Установить Android SDK Platform Tools.
3. Добавить `adb` и `emulator` в PATH.
4. Создать AVD.
5. Собрать APK через EAS.
6. Выполнить:

```bash
adb devices
adb install path/to/app.apk
adb shell monkey -p ua.lider.avtoschool 1
adb exec-out screencap -p > android-home.png
```

## Итог

Код mobile приведён в рабочее состояние по Expo Doctor, но runtime-проверка Android невозможна без внешнего Android окружения и Expo/EAS доступа.
