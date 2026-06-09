# Android QA via ADB — Автошкола «Лідер»

Пакет: `ua.lider.avtoschool` · MainActivity: `ua.lider.avtoschool.MainActivity`
ADB: `C:\Android\SDK\platform-tools\adb.exe` (в PATH). На этой машине это работало.

## 0. Подключение

```powershell
adb version
adb devices                      # ждём "device", не "offline"
# если offline:
adb kill-server; adb start-server; adb reconnect offline
# реальное устройство по Wi-Fi (опц.):
adb connect 127.0.0.1:5555
```

Полезное:
```powershell
adb -s emulator-5554 shell wm size      # 1600x900 (phys)
adb -s emulator-5554 shell wm density   # 240
adb -s emulator-5554 shell pidof ua.lider.avtoschool
adb -s emulator-5554 shell dumpsys window | findstr mCurrentFocus
```

## 1. Установка / запуск

```powershell
# Текущие сборки в репозитории:
#   apps/mobile/app-release.apk        (release, debug-подпись)
#   apps/mobile/app-debug.apk          (debug)
#   build_af24a76.apk                  (release, корень)
adb -s emulator-5554 install -r -d -t apps/mobile/app-release.apk
adb -s emulator-5554 shell monkey -p ua.lider.avtoschool -c android.intent.category.LAUNCHER 1
```

## 2. Скриншот + дамп UI

```powershell
# Скриншот (надёжный способ — exec-out в файл):
adb -s emulator-5554 exec-out screencap -p > qa_screen.png
# Дамп иерархии (координаты bounds для tap):
adb -s emulator-5554 shell uiautomator dump /sdcard/ui.xml
adb -s emulator-5554 pull /sdcard/ui.xml ./ui.xml
```

## 3. Навигация тапами (координаты для портрета 900×1600)

Таб-бар (y≈1545): Головна≈90 · Навчання≈270 · Чат≈450 · Клуб≈630 · Профіль≈810.
```powershell
adb -s emulator-5554 shell input tap 630 1545   # Клуб
adb -s emulator-5554 shell input tap 810 1545   # Профіль
adb -s emulator-5554 shell input tap 450 920    # (в Клубі) Рейтинг ПДР
adb -s emulator-5554 shell input keyevent 4     # Back
```
> Координаты зависят от разрешения/плотности — пересними `uiautomator dump` если экран другой.

## 4. Логи (PowerShell вместо grep — Select-String)

```powershell
adb -s emulator-5554 logcat -c    # очистить
adb -s emulator-5554 logcat | Select-String -Pattern "ReactNative|AndroidRuntime|FATAL|Firebase|AppCheck|Firestore|Storage|Auth|notifee|messaging|Hermes"
# снимок последних строк без слежения:
adb -s emulator-5554 logcat -d -t 400 | Select-String "ua.lider|FATAL|AppCheck|ReactNativeJS"
```

## 5. Результаты прогона 2026-06-10 (emulator-5554)

- ✅ Старт без краша; MainActivity в фокусе; pid активен.
- ✅ Головна / Клуб / Рейтинг / Профіль — рендерятся, навигация работает.
- ⚠️ **Бейдж «1» на Профіль горит** (визуально подтверждено) → исправлено в коде (B-01).
- ⚠️ Рейтинг: один участник, solo-state не обыгран (B-06).
- ⚠️ Quick-actions сжаты (B-05) → переделаны в 2×2.
- ❌ logcat: `E RNFBAppCheck ... 403 App attestation failed` каждые ~4 мин (B-02, действие владельца).
- ⚠️ logcat: deprecated namespaced RNFirebase API (B-08, миграция v22).

## 6. Стресс-тест (monkey)

```powershell
adb -s emulator-5554 shell monkey -p ua.lider.avtoschool -v 300
```
Проверять отсутствие ANR/Crash в logcat после прогона.

## 7. Чек-лист ручного QA

Старт · гость → демо-тест · регистрация/логин · главная (карточки 2×2) · Тренажёр (вопрос→ответ→результат) ·
Лідік чат · Клуб (стрічка/сторіс/рейтинг/нагороди) · Профіль (sheets, тема light/dark, бейдж не горит) ·
Чат с менеджером · keyboard avoiding · back-навигация · офлайн-режим (ПДР) · push (тест-кнопка в Профіль→Сповіщення).

## 8. Верификация фиксов этой сессии (ОБЯЗАТЕЛЬНО после rebuild)

```powershell
# пересобрать release APK (см. local APK build memo):
$env:EXPO_NO_METRO_WORKSPACE_ROOT=1; $env:NODE_ENV="production"
cd apps/mobile/android; .\gradlew assembleRelease
adb -s emulator-5554 install -r -d -t app/build/outputs/apk/release/app-release.apk
# затем: Головна → карточки 2×2 крупные; Профіль → бейджа «1» нет (если нет реальных чатов/броней).
```
