# Локальная сборка Android APK — Автошкола «Лідер»

> Инструкция для Windows. Собирает `app-debug.apk` без EAS cloud build.  
> Подходит для тестирования в BlueStacks или на реальном устройстве.

---

## 1. Что нужно установить

### Node.js LTS
- Скачать: https://nodejs.org/en (выбрать LTS)
- После установки проверить: `node -v` (должно быть 18.x или 20.x)

### pnpm
```powershell
npm install -g pnpm
pnpm -v
```

### Git
- Скачать: https://git-scm.com/download/win
- Проверить: `git --version`

### Java JDK 17
- Скачать: https://adoptium.net (Eclipse Temurin 17 LTS)
- Установить, выбрать "Add to PATH" и "Set JAVA_HOME" в установщике
- Проверить: `java -version` → должно быть `17.x`

### Android Studio
- Скачать: https://developer.android.com/studio
- В процессе установки:
  - ✅ Android SDK
  - ✅ Android SDK Platform
  - ✅ Android SDK Build-Tools
  - ✅ Android Virtual Device (опционально — для встроенного эмулятора)
- После установки открыть Android Studio → SDK Manager → убедиться что установлен:
  - SDK Platform: Android 14 (API 34) или выше
  - SDK Build-Tools 34.x или выше

---

## 2. Переменные окружения (Windows)

Открыть: **Пуск → "Изменить переменные среды"**

Добавить / проверить переменные:

| Переменная | Значение |
|---|---|
| `ANDROID_HOME` | `C:\Users\<ваш_пользователь>\AppData\Local\Android\Sdk` |
| `ANDROID_SDK_ROOT` | То же что ANDROID_HOME |
| `JAVA_HOME` | `C:\Program Files\Eclipse Adoptium\jdk-17.x.x` (путь к вашей JDK 17) |

В переменную `Path` добавить:
```
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\tools
%ANDROID_HOME%\emulator
```

Перезапустить PowerShell после изменений.

---

## 3. Проверки

```powershell
node -v          # 18.x или 20.x
pnpm -v          # 8.x или 9.x
java -version    # 17.x
adb version      # Android Debug Bridge
```

Если `adb` не найден — проверить `%ANDROID_HOME%\platform-tools` в PATH.

---

## 4. Подготовка проекта

### Установить зависимости

```powershell
cd c:\Users\...\Avtoschool_APP
pnpm install
```

### Prebuild (генерация android/ папки)

Если папки `apps/mobile/android/` нет или нужно пересоздать:

```powershell
cd apps/mobile
pnpm exec expo prebuild --platform android --clean
```

> **Важно**: `--clean` удалит старую android/ папку. Не нужен, если android/ уже есть и работает.

Если android/ уже есть — пропустить этот шаг.

---

## 5. Сборка APK

```powershell
cd apps/mobile/android
.\gradlew.bat assembleDebug
```

Первый запуск скачивает Gradle — это может занять 5–10 минут.

Готовый APK:
```
apps\mobile\android\app\build\outputs\apk\debug\app-debug.apk
```

---

## 6. Установка в BlueStacks

### Вариант 1: перетащить APK в окно BlueStacks
Просто перетащите `app-debug.apk` в открытое окно BlueStacks.

### Вариант 2: через ADB

**Включить ADB в BlueStacks:**
Настройки BlueStacks → Расширенные → включить "Android Debug Bridge".

```powershell
# Проверить что BlueStacks виден
adb devices

# Если нет — подключиться вручную
adb connect 127.0.0.1:5555

# Установить APK
adb install -r apps\mobile\android\app\build\outputs\apk\debug\app-debug.apk
```

Флаг `-r` заменяет уже установленное приложение.

После установки найти приложение "Автошкола Лідер" в лаунчере BlueStacks.

---

## 7. Metro bundler (для dev mode)

Если нужен live reload во время тестирования:

```powershell
# В одном терминале — запустить Metro
cd apps/mobile
pnpm exec expo start

# В другом терминале — запустить на BlueStacks
pnpm exec expo run:android
```

Или встряхнуть устройство → "Dev Settings" → поменять адрес bundler на `10.0.2.2:8081` (для эмулятора).

---

## 8. Частые ошибки и решения

### `JAVA_HOME is not set`
```powershell
# Временно для текущей сессии
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.x.x"
```
Или установить постоянно через "Переменные среды".

### `SDK location not found`
Создать файл `apps/mobile/android/local.properties`:
```
sdk.dir=C:\\Users\\<ваш_пользователь>\\AppData\\Local\\Android\\Sdk
```

### `Unsupported class file major version`
Gradle требует JDK 17. Проверить:
```powershell
java -version
$env:JAVA_HOME
```
Убедиться, что `JAVA_HOME` указывает именно на JDK 17, а не JDK 21+.

### `Package name already in use` в BlueStacks
```powershell
adb uninstall ua.lider.avtoschool
adb install apps\mobile\android\app\build\outputs\apk\debug\app-debug.apk
```

### `Could not connect to development server`
Если Metro не запущен — APK работает автономно с bundled JS (release build).  
Для debug build убедиться что Metro запущен: `pnpm exec expo start`.

### Gradle застрял / не запускается
```powershell
cd apps/mobile/android
.\gradlew.bat --stop    # остановить daemon
.\gradlew.bat assembleDebug --no-daemon
```

### `expo-modules` или нативные модули не найдены
```powershell
cd apps/mobile
pnpm exec expo prebuild --clean
cd android
.\gradlew.bat assembleDebug
```

---

## 9. Быстрый цикл пересборки

```powershell
# Из корня проекта
cd apps/mobile/android && .\gradlew.bat assembleDebug && adb install -r app\build\outputs\apk\debug\app-debug.apk
```

Или разбить на два шага:
```powershell
# Шаг 1: собрать
cd apps/mobile/android
.\gradlew.bat assembleDebug

# Шаг 2: установить
adb install -r app\build\outputs\apk\debug\app-debug.apk
```

---

## 10. Проверить metro config

Файл `apps/mobile/metro.config.js` должен содержать корректный `watchFolders` для monorepo:

```js
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

module.exports = config;
```

Если этого файла нет — создать его. Без него Metro не увидит `@lider/shared` и другие workspace-пакеты.

---

## 11. Параметры приложения

| Параметр | Значение |
|---|---|
| Package | `ua.lider.avtoschool` |
| App name | `Автошкола Лідер` |
| Version | `0.1.0` |
| Min SDK | Android 6+ (API 23) |
| Target SDK | Android 14 (API 34) |
| Deep link scheme | `lider://` |
| API URL (dev) | `http://localhost:5001/lider-avtoschool-dev/europe-west1/api` |
| API URL (prod) | задаётся через `API_URL` env при prebuild |

---

## 12. Разница debug vs release APK

| | Debug | Release |
|---|---|---|
| Для BlueStacks / тестирования | ✅ | — |
| Google Play | — | ✅ |
| Подпись | debug keystore (auto) | production keystore (нужен отдельно) |
| Размер | больше | меньше |
| Производительность | медленнее | быстрее |
| Metro bundler | нужен для dev | не нужен |

Для тестирования Driver Club, форм и навигации — debug APK полностью достаточен.

---

## 13. Как собрать release APK (без Google Play)

```powershell
cd apps/mobile/android
.\gradlew.bat assembleRelease
```

APK будет в:
```
apps\mobile\android\app\build\outputs\apk\release\app-release-unsigned.apk
```

Без подписи не установится на устройство. Для подписи нужен keystore — см. `MOBILE_RELEASE_GUIDE_RU.md`.

---

## Быстрая команда «собери и запусти в BlueStacks»

```powershell
cd c:\Users\...\Avtoschool_APP\apps\mobile\android
.\gradlew.bat assembleDebug ; adb connect 127.0.0.1:5555 ; adb install -r app\build\outputs\apk\debug\app-debug.apk
```
