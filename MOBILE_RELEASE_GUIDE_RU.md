# Мобильное приложение — Гайд по сборке и публикации

> **Идентификаторы:**
> - Android package: `ua.lider.avtoschool`
> - iOS Bundle ID: `ua.lider.avtoschool`
> - EAS Project ID: `74bb8f9a-fc35-4016-b110-a17da4dcd31c`
> - Текущая версия: `0.1.0`

---

## Требования

| Инструмент | Версия |
|---|---|
| Node.js | >= 18 |
| Expo CLI | `pnpm add -g expo` |
| EAS CLI | `pnpm add -g eas-cli` |
| EAS CLI version | >= 13.0.0 (задан в `eas.json`) |

---

## 1. Локальная разработка

```bash
cd apps/mobile
pnpm install
pnpm expo start
```

Запускает Metro bundler. Сканируйте QR-код в приложении **Expo Go** (iOS/Android).

---

## 2. ENV для мобильного приложения

Переменные передаются через `app.config.ts` → `extra`:

```typescript
extra: {
  apiUrl: process.env.API_URL ?? "http://localhost:5001/lider-avtoschool-dev/europe-west1/api"
}
```

Для production создайте `apps/mobile/.env`:

```env
API_URL=https://europe-west1-lider-avtoschool.cloudfunctions.net/api
```

Доступ к переменным в коде:

```typescript
import Constants from "expo-constants";
const API_URL = Constants.expoConfig?.extra?.apiUrl as string;
```

---

## 3. Development Build (для тестирования на реальном устройстве)

```bash
cd apps/mobile
eas build --profile development --platform android
# или
eas build --profile development --platform ios
```

Устанавливайте на устройство через QR-код или ссылку из EAS Dashboard.

---

## 4. Preview APK (Android — для внутреннего тестирования)

```bash
eas build --profile preview --platform android
```

Генерирует `.apk` файл (не `.aab`) — можно установить напрямую без Google Play.

---

## 5. Production Build

### Android (Google Play)

```bash
eas build --profile production --platform android
```

Генерирует подписанный `.aab` (Android App Bundle).

**Перед публикацией:**
- [ ] Зарегистрирован аккаунт Google Play Console
- [ ] Приложение создано с пакетом `ua.lider.avtoschool`
- [ ] Настроены подписи (EAS генерирует автоматически или загружайте свой keystore)

**Загрузка в Google Play:**
```bash
eas submit --platform android
```
Или вручную через Google Play Console → Production track.

---

### iOS (App Store)

```bash
eas build --profile production --platform ios
```

**Перед публикацией:**
- [ ] Apple Developer аккаунт ($99/год)
- [ ] App ID `ua.lider.avtoschool` создан в Apple Developer Portal
- [ ] Certificates и Provisioning Profiles настроены (EAS управляет автоматически)
- [ ] Приложение создано в App Store Connect

**Загрузка через TestFlight (тестирование):**
```bash
eas submit --platform ios
```

---

## 6. Over-the-Air обновления (EAS Update)

Для обновления JS-кода без перепубликации в сторах:

```bash
# Установить EAS Update
npx expo install expo-updates

# Отправить обновление
eas update --branch production --message "Fix: lead form validation"
```

Требует `expo-updates` в `app.config.ts`.

---

## 7. Firebase в мобильном приложении

Для push-уведомлений и синхронизации с Firestore:

```bash
pnpm add @react-native-firebase/app @react-native-firebase/firestore @react-native-firebase/messaging
```

Конфигурация:
- Android: `google-services.json` → `apps/mobile/android/app/`
- iOS: `GoogleService-Info.plist` → `apps/mobile/ios/`

Скачать из Firebase Console → Project Settings → Your apps.

---

## 8. Чек-лист перед первой публикацией

### Подготовка
- [ ] `app.config.ts`: проверить `version`, `ios.buildNumber`, `android.versionCode`
- [ ] `eas.json`: настроены профили `development`, `preview`, `production`
- [ ] EAS Project ID соответствует вашему EAS аккаунту
- [ ] `API_URL` указывает на production Firebase Functions

### Android
- [ ] Google Play Console аккаунт активирован
- [ ] Приложение `ua.lider.avtoschool` создано
- [ ] Иконка (1024×1024 PNG), скриншоты, описание подготовлены
- [ ] Privacy Policy URL указан (lider.bdslab.net/privacy)
- [ ] Сборка загружена в Internal Testing track

### iOS
- [ ] Apple Developer Program ($99/год) активирован
- [ ] App ID `ua.lider.avtoschool` создан
- [ ] Иконка (1024×1024 PNG без прозрачности), скриншоты подготовлены
- [ ] Privacy Policy URL указан
- [ ] Сборка загружена в TestFlight

### Финал
- [ ] Прошли тестирование на реальных устройствах (Android + iOS)
- [ ] Проверена работа форм заявок и отправки данных
- [ ] Проверен lead flow: отправка → Telegram-уведомление
- [ ] Финальная сборка с `--profile production`

---

## 9. Быстрые команды

```bash
# Посмотреть все сборки
eas build:list

# Статус текущего проекта
eas project:info

# Обновить профиль EAS
eas build:configure

# Посмотреть логи сборки
eas build:view [BUILD_ID]
```

---

## 10. Что не нужно для сборки APK/IPA

Для базовой сборки и установки на устройство **не нужны**:
- Google Play аккаунт (достаточно `preview` профиля)
- App Store аккаунт
- FCM/APN для push-уведомлений (можно добавить позже)

Для тестирования достаточно:
```bash
eas build --profile preview --platform android
```
Получите `.apk` и отправьте тестировщикам.
