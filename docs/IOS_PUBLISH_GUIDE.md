# Публикация iOS

## Требования

- Apple Developer Account.
- Expo account.
- App Store Connect приложение.
- Bundle ID: `ua.lider.avtoschool`.
- Privacy Policy и App Privacy labels.

## Сборка

```powershell
cd "C:\Users\Nice Try)\Downloads\Avtoschool_APP\apps\mobile"
npx eas login
npx eas build:configure
npx eas build --profile production --platform ios
```

## Публикация

1. Войти в Apple Developer.
2. Проверить Bundle ID.
3. Создать приложение в App Store Connect.
4. Заполнить описание, скриншоты, privacy policy.
5. Загрузить build через EAS Submit или Transporter.
6. Отправить на review.

## Статус

iOS проект подготовлен, но production build не создан.
