# App Store

## Что нужно

- Apple Developer Account.
- App Store Connect приложение.
- Bundle ID: `ua.lider.avtoschool`.
- Production iOS build через EAS.
- Privacy Policy.
- App Privacy labels.
- Скриншоты и описание приложения.

## Команды

```powershell
cd "C:\Users\Nice Try)\Downloads\Avtoschool_APP\apps\mobile"
npx eas login
npx eas build --profile production --platform ios
```

## Статус

iOS проект подготовлен, но production build не создан и публикация невозможна без Apple Developer доступа.
