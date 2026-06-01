# Мобильная сборка

Мобильное приложение находится в `apps/mobile` и использует Expo Router.

## Локальная разработка

```bash
npm install
npm run dev:mobile
```

## EAS builds

```bash
cd apps/mobile
npx eas build --profile preview --platform android
npx eas build --profile production --platform ios
npx eas build --profile production --platform all
```

## Перед публикацией

- Подключить production `API_URL`.
- Проверить иконку, splash assets и название.
- Настроить push notification credentials.
- Заполнить privacy labels и Data Safety.
- Проверить login, документы, практику, платежи и уведомления на реальных устройствах.
