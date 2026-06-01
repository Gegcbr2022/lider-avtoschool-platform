# Android Emulator Report

Дата проверки: 2026-06-01

## Итог

Android Emulator не проверен.

Причина:

```text
adb не установлен или не доступен в PATH
```

Команда:

```powershell
adb devices
```

завершилась ошибкой.

## Что нужно установить

1. Android Studio.
2. Android SDK Platform Tools.
3. Android Emulator.
4. Переменную PATH для `adb`.

## Что проверить после установки

```powershell
adb devices
```

Если команда показывает устройство, можно устанавливать APK и проверять приложение.

## Статус

| Проверка | Статус |
| --- | --- |
| adb | FAIL |
| Emulator | NOT CHECKED |
| APK install | NOT CHECKED |
| App launch | NOT CHECKED |
| Login flow | NOT CHECKED |
| Documents upload | NOT CHECKED |
| PDD tests | NOT CHECKED |
