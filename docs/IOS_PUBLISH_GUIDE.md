# iOS Publish Guide

## Что нужно

- Apple Developer Account.
- Expo account.
- EAS CLI.
- Bundle ID: `ua.lider.avtoschool`.

## Команды

```powershell
cd "C:\Users\Nice Try)\Downloads\Avtoschool_APP\apps\mobile"
npx eas login
npx eas build:configure
npx eas build --profile production --platform ios
```

## Что нажимать

1. Войти в Apple Developer.
2. Создать App ID.
3. Создать приложение в App Store Connect.
4. Заполнить название, описание, privacy policy.
5. Загрузить build через EAS Submit или Transporter.

## Текущий статус

iOS проект подготовлен, но production build не создан.
