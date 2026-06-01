# Релиз в сторах

Мобильное приложение — Expo Router app, сборки выполняются через EAS.

## Доступы

- Expo account.
- Apple Developer Program для iOS.
- Google Play Console для Android.
- Firebase project для Auth, Firestore, Storage, Functions и push credentials.

## Команды сборки

```bash
cd apps/mobile
npx eas login
npx eas build:configure
npx eas build --profile preview --platform android
npx eas build --profile preview --platform ios
npx eas build --profile production --platform all
```

## Перед отправкой

- Проверить финальную иконку и splash assets.
- Настроить privacy labels для App Store.
- Заполнить Google Play Data Safety.
- Настроить push credentials.
- Установить production `API_URL`.
- Проверить login, документы, практику, платежи и уведомления на реальных устройствах.
